import { CreatePool } from '../../core/application/CreatePool';
import {
    mockComplianceRepo, mockPoolRepo, makeCompliance,
} from './mocks';
import { InvalidPoolError, ValidationError } from '../../shared/errors';

describe('CreatePool use-case', () => {
    function makeUseCase(cbMap: Record<string, number>) {
        const complianceRepo = mockComplianceRepo({
            findByShipAndYear: jest.fn().mockImplementation(
                (shipId: string) => Promise.resolve(
                    cbMap[shipId] !== undefined
                        ? makeCompliance(shipId, cbMap[shipId])
                        : null
                )
            ),
        });
        return new CreatePool(complianceRepo, mockPoolRepo());
    }

    describe('validation', () => {
        it('throws ValidationError with fewer than 2 members', async () => {
            const useCase = makeUseCase({ R002: 100_000 });

            await expect(
                useCase.execute({ year: 2024, memberShipIds: ['R002'] })
            ).rejects.toThrow(ValidationError);
        });

        it('throws InvalidPoolError when pool sum is negative', async () => {
            // Both ships in deficit
            const useCase = makeUseCase({
                R001: -300_000_000,
                R003: -400_000_000,
            });

            await expect(
                useCase.execute({ year: 2024, memberShipIds: ['R001', 'R003'] })
            ).rejects.toThrow(InvalidPoolError);
        });
    });

    describe('greedy allocation', () => {
        it('allocates surplus from R002 to cover R001 deficit', async () => {
            // R002 surplus: +500_000, R001 deficit: -200_000
            const useCase = makeUseCase({ R001: -200_000, R002: 500_000 });
            const result = await useCase.execute({
                year: 2024, memberShipIds: ['R001', 'R002'],
            });

            const r001After = result.members.find(m => m.shipId === 'R001')!.cbAfter;
            const r002After = result.members.find(m => m.shipId === 'R002')!.cbAfter;

            // R001 should be covered (cbAfter = 0 or better)
            expect(r001After).toBeGreaterThanOrEqual(0);
            // R002 should not go negative (300_000 remaining)
            expect(r002After).toBeGreaterThanOrEqual(0);
        });

        it('pool sum is preserved after allocation', async () => {
            const useCase = makeUseCase({
                R001: -200_000,
                R002: 500_000,
                R003: -100_000,
            });
            const result = await useCase.execute({
                year: 2024, memberShipIds: ['R001', 'R002', 'R003'],
            });

            const sumBefore = result.members.reduce((s, m) => s + m.cbBefore, 0);
            const sumAfter = result.members.reduce((s, m) => s + m.cbAfter, 0);

            // Total CB in the pool is conserved — no CB is created or destroyed
            expect(sumAfter).toBeCloseTo(sumBefore, 0);
        });

        it('surplus ship never goes below zero after allocation', async () => {
            // Deficit is larger than any single surplus — tests partial allocation
            const useCase = makeUseCase({ R002: 100_000, R001: -600_000 });

            // poolSum = -500_000 < 0, should throw
            await expect(
                useCase.execute({ year: 2024, memberShipIds: ['R001', 'R002'] })
            ).rejects.toThrow(InvalidPoolError);
        });

        it('handles exactly zero pool sum', async () => {
            // Perfect balance: surplus exactly covers deficit
            const useCase = makeUseCase({ R001: -500_000, R002: 500_000 });
            const result = await useCase.execute({
                year: 2024, memberShipIds: ['R001', 'R002'],
            });

            expect(result.poolSum).toBe(0);
            expect(result.members.find(m => m.shipId === 'R001')!.cbAfter).toBeCloseTo(0, 0);
            expect(result.members.find(m => m.shipId === 'R002')!.cbAfter).toBeCloseTo(0, 0);
        });

        it('persists pool and members', async () => {
            const poolRepo = mockPoolRepo();
            const complianceRepo = mockComplianceRepo({
                findByShipAndYear: jest.fn().mockImplementation(
                    (shipId: string) => Promise.resolve(
                        makeCompliance(shipId, shipId === 'R002' ? 500_000 : -200_000)
                    )
                ),
            });
            const useCase = new CreatePool(complianceRepo, poolRepo);
            await useCase.execute({ year: 2024, memberShipIds: ['R001', 'R002'] });

            expect(poolRepo.save).toHaveBeenCalledTimes(1);
            expect(poolRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ year: 2024 }),
                expect.arrayContaining([
                    expect.objectContaining({ shipId: 'R001' }),
                    expect.objectContaining({ shipId: 'R002' }),
                ])
            );
        });
    });
});
