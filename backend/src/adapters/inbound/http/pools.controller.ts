import { Router, Request, Response, NextFunction } from 'express';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { PoolRepository } from '../../../core/ports/PoolRepository';
import { CreatePool } from '../../../core/application/CreatePool';
import { ValidationError } from '../../../shared/errors';

export function createPoolsRouter(
    complianceRepo: ComplianceRepository,
    poolRepo: PoolRepository
): Router {
    const router = Router();

    // POST /pools
    // Body: { year: number, memberShipIds: string[] }
    router.post(
        '/',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { year, memberShipIds } = req.body;

                if (!year || !Array.isArray(memberShipIds)) {
                    throw new ValidationError(
                        'year (number) and memberShipIds (string[]) are required'
                    );
                }

                const useCase = new CreatePool(complianceRepo, poolRepo);
                const result = await useCase.execute({
                    year: Number(year),
                    memberShipIds,
                });

                res.status(201).json({ data: result });
            } catch (err) {
                next(err);
            }
        }
    );

    return router;
}
