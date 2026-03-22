import { RouteRepository } from '../ports/RouteRepository';
import { Route } from '../domain/Route';
import {
    computePercentDiff,
    isCompliant,
    TARGET_INTENSITY_2025,
} from '../domain/ComplianceTarget';
import { DomainError } from '../../shared/errors';

export interface ComparisonEntry {
    route: Route;
    percentDiff: number;      // vs baseline ghgIntensity
    compliant: boolean;       // vs EU target
    vsTarget: number;         // absolute diff from 89.3368
}

export interface CompareRoutesOutput {
    baseline: Route;
    target: number;
    comparisons: ComparisonEntry[];
}

export class CompareRoutes {
    constructor(private readonly routeRepo: RouteRepository) { }

    async execute(): Promise<CompareRoutesOutput> {
        const baseline = await this.routeRepo.findBaseline();
        if (!baseline) {
            throw new DomainError('No baseline route set. Use POST /routes/:id/baseline first.');
        }

        const allRoutes = await this.routeRepo.findAll();
        const others = allRoutes.filter(r => r.routeId !== baseline.routeId);

        const comparisons: ComparisonEntry[] = others.map(route => ({
            route,
            percentDiff: computePercentDiff(baseline.ghgIntensity, route.ghgIntensity),
            compliant: isCompliant(route.ghgIntensity),
            vsTarget: route.ghgIntensity - TARGET_INTENSITY_2025,
        }));

        return {
            baseline,
            target: TARGET_INTENSITY_2025,
            comparisons,
        };
    }
}
