import { Route } from '../domain/Route';

export interface RouteFilters {
    vesselType?: string;
    fuelType?: string;
    year?: number;
}

export interface RouteRepository {
    findAll(filters?: RouteFilters): Promise<Route[]>;
    findById(routeId: string): Promise<Route | null>;
    findBaseline(): Promise<Route | null>;
    setBaseline(routeId: string): Promise<void>;
}
