import { RouteRepository } from '../ports/RouteRepository';
import { NotFoundError } from '../../shared/errors';
import { Route } from '../domain/Route';

export class SetBaseline {
    constructor(private readonly routeRepo: RouteRepository) { }

    async execute(routeId: string): Promise<Route> {
        const route = await this.routeRepo.findById(routeId);
        if (!route) throw new NotFoundError('Route', routeId);

        await this.routeRepo.setBaseline(routeId);

        // Return the updated route
        const updated = await this.routeRepo.findById(routeId);
        return updated!;
    }
}
