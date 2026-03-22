// core/application/CompareRoutes.ts
import { Route } from '../domain/Route';

export interface CompareResult {
    baselineRoute: Route;
    comparisons: Array<{
        route: Route;
        percentDiff: number;
        compliant: boolean;  // ghgIntensity ≤ TARGET
    }>;
}
