import { Router, Request, Response, NextFunction } from 'express';
import { RouteRepository } from '../../../core/ports/RouteRepository';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { BankRepository } from '../../../core/ports/BankRepository';
import { BankSurplus } from '../../../core/application/BankSurplus';
import { ApplyBanked } from '../../../core/application/ApplyBanked';
import { ValidationError } from '../../../shared/errors';

export function createBankingRouter(
    routeRepo: RouteRepository,
    complianceRepo: ComplianceRepository,
    bankRepo: BankRepository
): Router {
    const router = Router();

    // GET /banking/records?shipId=R001&year=2024
    router.get(
        '/records',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { shipId, year } = req.query;
                if (!shipId || !year) {
                    throw new ValidationError('shipId and year are required');
                }

                const entries = await bankRepo.findByShipAndYear(
                    String(shipId),
                    Number(year)
                );
                const total = entries.reduce((s, e) => s + e.amountGco2eq, 0);

                res.json({ data: { entries, totalBanked: total } });
            } catch (err) {
                next(err);
            }
        }
    );

    // POST /banking/bank
    // Body: { shipId: string, year: number, amount: number }
    router.post(
        '/bank',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { shipId, year, amount } = req.body;

                if (!shipId || !year || amount === undefined) {
                    throw new ValidationError('shipId, year, and amount are required');
                }

                const useCase = new BankSurplus(routeRepo, complianceRepo, bankRepo);
                const result = await useCase.execute({
                    shipId: String(shipId),
                    year: Number(year),
                    amount: Number(amount),
                });

                res.status(201).json({ data: result });
            } catch (err) {
                next(err);
            }
        }
    );

    // POST /banking/apply
    // Body: { shipId: string, year: number, amount: number }
    router.post(
        '/apply',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { shipId, year, amount } = req.body;

                if (!shipId || !year || amount === undefined) {
                    throw new ValidationError('shipId, year, and amount are required');
                }

                const useCase = new ApplyBanked(bankRepo, complianceRepo);
                const result = await useCase.execute({
                    shipId: String(shipId),
                    year: Number(year),
                    amount: Number(amount),
                });

                res.json({ data: result });
            } catch (err) {
                next(err);
            }
        }
    );

    return router;
}
