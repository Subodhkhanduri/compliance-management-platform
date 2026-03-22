import { RouteRepository } from '../ports/RouteRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';
import { computeComplianceBalance } from '../domain/ComplianceTarget';
import { NotFoundError } from '../../shared/errors';

export interface ComputeCBInput {
    shipId: string;
    year: number;
}

export interface ComputeCBOutput {
    shipId: string;
    year: number;
    cbGco2eq: number;
    isSurplus: boolean;
    ghgIntensity: number;
    energyInScope: number;
}

export class ComputeCB {
    constructor(
        private readonly routeRepo: RouteRepository,
        private readonly complianceRepo: ComplianceRepository
    ) { }

    async execute(input: ComputeCBInput): Promise<ComputeCBOutput> {
        const route = await this.routeRepo.findById(input.shipId);
        if (!route) throw new NotFoundError('Route', input.shipId);

        const cb = computeComplianceBalance(
            route.ghgIntensity,
            route.fuelConsumption
        );

        // Persist snapshot (upsert so re-running is idempotent)
        await this.complianceRepo.upsert({
            shipId: input.shipId,
            year: input.year,
            cbGco2eq: cb,
        });

        return {
            shipId: input.shipId,
            year: input.year,
            cbGco2eq: cb,
            isSurplus: cb > 0,
            ghgIntensity: route.ghgIntensity,
            energyInScope: route.fuelConsumption * 41_000,
        };
    }
}
