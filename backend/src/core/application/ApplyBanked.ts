import { BankRepository } from '../ports/BankRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';
import {
    ValidationError,
    InsufficientBalanceError,
} from '../../shared/errors';

export interface ApplyBankedInput {
    shipId: string;
    year: number;
    amount: number;
}

export interface ApplyBankedOutput {
    shipId: string;
    year: number;
    cbBefore: number;
    applied: number;
    cbAfter: number;
}

export class ApplyBanked {
    constructor(
        private readonly bankRepo: BankRepository,
        private readonly complianceRepo: ComplianceRepository
    ) { }

    async execute(input: ApplyBankedInput): Promise<ApplyBankedOutput> {
        if (input.amount <= 0) {
            throw new ValidationError('Amount to apply must be positive');
        }

        const totalBanked = await this.bankRepo.getTotalBanked(
            input.shipId,
            input.year
        );

        if (input.amount > totalBanked) {
            throw new InsufficientBalanceError(totalBanked, input.amount);
        }

        const compliance = await this.complianceRepo.findByShipAndYear(
            input.shipId,
            input.year
        );

        const cbBefore = compliance?.cbGco2eq ?? 0;

        await this.bankRepo.deductAmount(input.shipId, input.year, input.amount);

        // Update the compliance snapshot with improved CB
        await this.complianceRepo.upsert({
            shipId: input.shipId,
            year: input.year,
            cbGco2eq: cbBefore + input.amount,
        });

        return {
            shipId: input.shipId,
            year: input.year,
            cbBefore,
            applied: input.amount,
            cbAfter: cbBefore + input.amount,
        };
    }
}
