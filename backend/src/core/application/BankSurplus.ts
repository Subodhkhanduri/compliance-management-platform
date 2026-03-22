import { RouteRepository } from '../ports/RouteRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';
import { BankRepository } from '../ports/BankRepository';
import { computeComplianceBalance } from '../domain/ComplianceTarget';
import {
    NotFoundError,
    ValidationError,
    InsufficientBalanceError,
} from '../../shared/errors';

export interface BankSurplusInput {
    shipId: string;
    year: number;
    amount: number;
}

export interface BankSurplusOutput {
    shipId: string;
    year: number;
    amountBanked: number;
    totalBanked: number;
    cbRemaining: number;
}

export class BankSurplus {
    constructor(
        private readonly routeRepo: RouteRepository,
        private readonly complianceRepo: ComplianceRepository,
        private readonly bankRepo: BankRepository
    ) { }

    async execute(input: BankSurplusInput): Promise<BankSurplusOutput> {
        if (input.amount <= 0) {
            throw new ValidationError('Amount to bank must be positive');
        }

        const route = await this.routeRepo.findById(input.shipId);
        if (!route) throw new NotFoundError('Route', input.shipId);

        const cb = computeComplianceBalance(route.ghgIntensity, route.fuelConsumption);

        if (cb <= 0) {
            throw new ValidationError(
                `Ship ${input.shipId} has a deficit CB (${cb.toFixed(2)}). Only surplus can be banked.`
            );
        }

        if (input.amount > cb) {
            throw new InsufficientBalanceError(cb, input.amount);
        }

        await this.bankRepo.save({
            shipId: input.shipId,
            year: input.year,
            amountGco2eq: input.amount,
        });

        const totalBanked = await this.bankRepo.getTotalBanked(input.shipId, input.year);

        return {
            shipId: input.shipId,
            year: input.year,
            amountBanked: input.amount,
            totalBanked,
            cbRemaining: cb - input.amount,
        };
    }
}
