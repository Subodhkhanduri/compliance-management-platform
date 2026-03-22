import { ComplianceRepository } from '../ports/ComplianceRepository';
import { PoolRepository } from '../ports/PoolRepository';
import { PoolMember } from '../domain/PoolMember';
import { InvalidPoolError, ValidationError } from '../../shared/errors';

export interface CreatePoolInput {
    year: number;
    memberShipIds: string[];
}

export interface CreatePoolOutput {
    poolId: string;
    year: number;
    members: Array<{
        shipId: string;
        cbBefore: number;
        cbAfter: number;
        allocatedSurplus: number;
    }>;
    poolSum: number;
}

export class CreatePool {
    constructor(
        private readonly complianceRepo: ComplianceRepository,
        private readonly poolRepo: PoolRepository
    ) { }

    async execute(input: CreatePoolInput): Promise<CreatePoolOutput> {
        if (input.memberShipIds.length < 2) {
            throw new ValidationError('A pool must have at least 2 members');
        }

        // Fetch CB for each member
        const members = await Promise.all(
            input.memberShipIds.map(async shipId => {
                const compliance = await this.complianceRepo.findByShipAndYear(
                    shipId,
                    input.year
                );
                return {
                    shipId,
                    cbBefore: compliance?.cbGco2eq ?? 0,
                    cbAfter: compliance?.cbGco2eq ?? 0,  // will be updated by allocation
                    allocatedSurplus: 0,
                };
            })
        );

        // Rule 1: Pool sum must be ≥ 0
        const poolSum = members.reduce((sum, m) => sum + m.cbBefore, 0);
        if (poolSum < 0) {
            throw new InvalidPoolError(
                `Pool CB sum is ${poolSum.toFixed(2)} — must be ≥ 0. ` +
                `Total surplus must cover total deficit.`
            );
        }

        // Greedy allocation: sort descending by CB, surplus ships cover deficits
        const allocated = this.greedyAllocate(members);

        // Save to DB
        const result = await this.poolRepo.save(
            { year: input.year },
            allocated.map(m => ({
                shipId: m.shipId,
                cbBefore: m.cbBefore,
                cbAfter: m.cbAfter,
                allocatedSurplus: m.allocatedSurplus,
            }))
        );

        return {
            poolId: result.pool.id,
            year: input.year,
            members: allocated,
            poolSum,
        };
    }

    private greedyAllocate(
        members: Array<{ shipId: string; cbBefore: number; cbAfter: number; allocatedSurplus: number }>
    ) {
        // Sort: surplus ships first (desc), then deficit ships
        const sorted = [...members].sort((a, b) => b.cbBefore - a.cbBefore);

        // Separate into surplus and deficit buckets
        const surpluses = sorted.filter(m => m.cbBefore > 0);
        const deficits = sorted.filter(m => m.cbBefore < 0);

        // Track remaining surplus as we allocate
        const surplusRemaining = surpluses.map(s => ({ ...s, remaining: s.cbBefore }));

        for (const deficit of deficits) {
            let needed = Math.abs(deficit.cbBefore); // how much this ship needs

            for (const surplus of surplusRemaining) {
                if (needed <= 0) break;
                if (surplus.remaining <= 0) continue;

                const transfer = Math.min(needed, surplus.remaining);
                surplus.remaining -= transfer;
                needed -= transfer;

                // Update the deficit ship's cbAfter
                deficit.cbAfter = deficit.cbBefore + (Math.abs(deficit.cbBefore) - needed);
                deficit.allocatedSurplus += transfer;

                // Rule: surplus ship cannot go negative
                surplus.cbAfter = surplus.remaining;
            }
        }

        // Merge back
        return members.map(m => {
            const fromSurplus = surplusRemaining.find(s => s.shipId === m.shipId);
            const fromDeficit = deficits.find(d => d.shipId === m.shipId);
            return fromSurplus
                ? { ...m, cbAfter: fromSurplus.remaining, allocatedSurplus: 0 }
                : fromDeficit ?? m;
        });
    }
}
