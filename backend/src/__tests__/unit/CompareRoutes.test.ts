import { CompareRoutes } from '../../core/application/CompareRoutes';
import { mockRouteRepo, ROUTES } from './mocks';
import { DomainError } from '../../shared/errors';

describe('CompareRoutes use-case', () => {
    it('returns baseline + all other routes as comparisons', async () => {
        const useCase = new CompareRoutes(mockRouteRepo());
        const result = await useCase.execute();

        expect(result.baseline.routeId).toBe('R001');
        expect(result.comparisons).toHaveLength(3); // R002, R003, R004
    });

    it('sets correct target (89.3368)', async () => {
        const useCase = new CompareRoutes(mockRouteRepo());
        const result = await useCase.execute();

        expect(result.target).toBe(89.3368);
    });

    it('marks R002 (88.0) as compliant', async () => {
        const useCase = new CompareRoutes(mockRouteRepo());
        const result = await useCase.execute();

        const r002 = result.comparisons.find(c => c.route.routeId === 'R002');
        expect(r002?.compliant).toBe(true);
    });

    it('marks R003 (93.5) as non-compliant', async () => {
        const useCase = new CompareRoutes(mockRouteRepo());
        const result = await useCase.execute();

        const r003 = result.comparisons.find(c => c.route.routeId === 'R003');
        expect(r003?.compliant).toBe(false);
    });

    it('computes correct percentDiff for R003 vs R001 baseline', async () => {
        // percentDiff = ((93.5 / 91.0) − 1) × 100 = +2.7472...%
        const expected = ((93.5 / 91.0) - 1) * 100;
        const useCase = new CompareRoutes(mockRouteRepo());
        const result = await useCase.execute();

        const r003 = result.comparisons.find(c => c.route.routeId === 'R003');
        expect(r003?.percentDiff).toBeCloseTo(expected, 4);
    });

    it('throws DomainError when no baseline is set', async () => {
        const routeRepo = mockRouteRepo({
            findBaseline: jest.fn().mockResolvedValue(null),
        });

        const useCase = new CompareRoutes(routeRepo);
        await expect(useCase.execute()).rejects.toThrow(DomainError);
    });
});
