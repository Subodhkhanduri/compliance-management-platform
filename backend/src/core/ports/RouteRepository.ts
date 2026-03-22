// core/ports/RouteRepository.ts
import { Route } from '../domain/Route';

export interface RouteRepository {
    findAll(): Promise<Route[]>;
    findById(routeId: string): Promise<Route | null>;
    findBaseline(): Promise<Route | null>;
    setBaseline(routeId: string): Promise<void>;
    findByFilters(filters: {
        vesselType?: string;
        fuelType?: string;
        year?: number;
    }): Promise<Route[]>;
}
