import { Router, Request, Response, NextFunction } from 'express';
import { RouteRepository } from '../../../core/ports/RouteRepository';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { SetBaseline } from '../../../core/application/SetBaseline';
import { CompareRoutes } from '../../../core/application/CompareRoutes';

export function createRoutesRouter(
    routeRepo: RouteRepository,
    complianceRepo: ComplianceRepository
): Router {
    const router = Router();

    // GET /routes — list all, optionally filtered
    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { vesselType, fuelType, year } = req.query;
            const routes = await routeRepo.findAll({
                vesselType: vesselType as string | undefined,
                fuelType: fuelType as string | undefined,
                year: year ? Number(year) : undefined,
            });
            res.json({ data: routes });
        } catch (err) {
            next(err);
        }
    });

    // GET /routes/comparison — must be BEFORE /:id to avoid route clash
    router.get(
        '/comparison',
        async (_req: Request, res: Response, next: NextFunction) => {
            try {
                const useCase = new CompareRoutes(routeRepo);
                const result = await useCase.execute();
                res.json({ data: result });
            } catch (err) {
                next(err);
            }
        }
    );

    // POST /routes/:id/baseline
    router.post(
        '/:id/baseline',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const useCase = new SetBaseline(routeRepo);
                const updated = await useCase.execute(String(req.params.id));
                res.json({ data: updated });
            } catch (err) {
                next(err);
            }
        }
    );

    return router;
}
