import { ComputeCB } from '../../core/application/ComputeCB';
import { mockRouteRepo, mockComplianceRepo } from './mocks';
import { NotFoundError } from '../../shared/errors';

describe('ComputeCB use-case', () => {
    describe('CB formula correctness', () => {
        it('computes correct CB for a deficit ship (R001, ghg=91.0)', async () => {
            // CB = (89.3368 − 91.0) × (5000 × 41000)
            //    = −1.6632 × 205,000,000
            //    = −340,956,000
            const expected = (89.3368 - 91.0) * (5000 * 41_000);

            const useCase = new ComputeCB(mockRouteRepo(), mockComplianceRepo());
            const result = await useCase.execute({ shipId: 'R001', year: 2024 });

            expect(result.cbGco2eq).toBeCloseTo(expected, 0);
            expect(result.isSurplus).toBe(false);
        });

        it('computes correct CB for a surplus ship (R002, ghg=88.0)', async () => {
            // CB = (89.3368 − 88.0) × (4800 × 41000)
            //    = 1.3368 × 196,800,000
            //    = +263,082,240
            const expected = (89.3368 - 88.0) * (4800 * 41_000);

            const useCase = new ComputeCB(mockRouteRepo(), mockComplianceRepo());
            const result = await useCase.execute({ shipId: 'R002', year: 2024 });

            expect(result.cbGco2eq).toBeCloseTo(expected, 0);
            expect(result.isSurplus).toBe(true);
        });

        it('returns correct energy in scope', async () => {
            const useCase = new ComputeCB(mockRouteRepo(), mockComplianceRepo());
            const result = await useCase.execute({ shipId: 'R002', year: 2024 });

            // 4800t × 41,000 MJ/t = 196,800,000 MJ
            expect(result.energyInScope).toBe(4800 * 41_000);
        });
    });

    describe('persistence', () => {
        it('upserts a compliance snapshot on every call', async () => {
            const complianceRepo = mockComplianceRepo();
            const useCase = new ComputeCB(mockRouteRepo(), complianceRepo);

            await useCase.execute({ shipId: 'R001', year: 2024 });

            expect(complianceRepo.upsert).toHaveBeenCalledTimes(1);
            expect(complianceRepo.upsert).toHaveBeenCalledWith(
                expect.objectContaining({ shipId: 'R001', year: 2024 })
            );
        });

        it('is idempotent — calling twice does not double the CB', async () => {
            const complianceRepo = mockComplianceRepo();
            const useCase = new ComputeCB(mockRouteRepo(), complianceRepo);

            const first = await useCase.execute({ shipId: 'R001', year: 2024 });
            const second = await useCase.execute({ shipId: 'R001', year: 2024 });

            expect(first.cbGco2eq).toBeCloseTo(second.cbGco2eq, 0);
            expect(complianceRepo.upsert).toHaveBeenCalledTimes(2);
        });
    });

    describe('error handling', () => {
        it('throws NotFoundError for unknown shipId', async () => {
            const routeRepo = mockRouteRepo({
                findById: jest.fn().mockResolvedValue(null),
            });

            const useCase = new ComputeCB(routeRepo, mockComplianceRepo());

            await expect(
                useCase.execute({ shipId: 'UNKNOWN', year: 2024 })
            ).rejects.toThrow(NotFoundError);
        });
    });
});
