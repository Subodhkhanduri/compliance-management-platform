import { Router, Request, Response, NextFunction } from 'express';
import { RouteRepository } from '../../../core/ports/RouteRepository';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { BankRepository } from '../../../core/ports/BankRepository';
import { ComputeCB } from '../../../core/application/ComputeCB';
import { ValidationError } from '../../../shared/errors';

export function createComplianceRouter(
    routeRepo: RouteRepository,
    complianceRepo: ComplianceRepository,
    bankRepo: BankRepository
): Router {
    const router = Router();

    // GET /compliance/cb?shipId=R001&year=2024
    router.get('/cb', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { shipId, year } = req.query;

            if (!shipId || !year) {
                throw new ValidationError('shipId and year are required query params');
            }

            const useCase = new ComputeCB(routeRepo, complianceRepo);
            const result = await useCase.execute({
                shipId: String(shipId),
                year: Number(year),
            });

            res.json({ data: result });
        } catch (err) {
            next(err);
        }
    });

    // GET /compliance/adjusted-cb?shipId=R001&year=2024
    // Returns CB after applying any banked surplus
    router.get(
        '/adjusted-cb',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { shipId, year } = req.query;

                if (!shipId || !year) {
                    throw new ValidationError('shipId and year are required query params');
                }

                const shipIdStr = String(shipId);
                const yearNum = Number(year);

                // Get base CB
                const compliance = await complianceRepo.findByShipAndYear(
                    shipIdStr,
                    yearNum
                );

                // Get total banked (available to apply)
                const totalBanked = await bankRepo.getTotalBanked(shipIdStr, yearNum);

                const baseCb = compliance?.cbGco2eq ?? 0;
                const adjustedCb = baseCb + totalBanked;

                res.json({
                    data: {
                        shipId: shipIdStr,
                        year: yearNum,
                        baseCb,
                        totalBanked,
                        adjustedCb,
                        isSurplus: adjustedCb >= 0,
                    },
                });
            } catch (err) {
                next(err);
            }
        }
    );

    return router;
}
