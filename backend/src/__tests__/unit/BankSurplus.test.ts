import { BankSurplus } from '../../core/application/BankSurplus';
import {
    mockRouteRepo, mockComplianceRepo, mockBankRepo,
} from './mocks';
import {
    ValidationError,
    InsufficientBalanceError,
    NotFoundError,
} from '../../shared/errors';

// R002 surplus CB ≈ +263,082,240
const R002_CB = (89.3368 - 88.0) * (4800 * 41_000);

describe('BankSurplus use-case', () => {
    const makeUseCase = () => new BankSurplus(
        mockRouteRepo(),
        mockComplianceRepo(),
        mockBankRepo()
    );

    it('banks a valid amount for a surplus ship', async () => {
        const bankRepo = mockBankRepo({
            getTotalBanked: jest.fn().mockResolvedValue(100_000),
        });
        const useCase = new BankSurplus(mockRouteRepo(), mockComplianceRepo(), bankRepo);

        const result = await useCase.execute({
            shipId: 'R002', year: 2024, amount: 100_000,
        });

        expect(result.amountBanked).toBe(100_000);
        expect(bankRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({ shipId: 'R002', amountGco2eq: 100_000 })
        );
    });

    it('throws ValidationError when amount is zero', async () => {
        await expect(
            makeUseCase().execute({ shipId: 'R002', year: 2024, amount: 0 })
        ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when amount is negative', async () => {
        await expect(
            makeUseCase().execute({ shipId: 'R002', year: 2024, amount: -500 })
        ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when ship has a deficit (R001)', async () => {
        // R001 ghgIntensity=91.0 > target, so CB is negative
        await expect(
            makeUseCase().execute({ shipId: 'R001', year: 2024, amount: 50_000 })
        ).rejects.toThrow(ValidationError);
    });

    it('throws InsufficientBalanceError when amount exceeds CB surplus', async () => {
        // Try to bank more than the full surplus
        const overAmount = R002_CB + 1_000_000;

        await expect(
            makeUseCase().execute({ shipId: 'R002', year: 2024, amount: overAmount })
        ).rejects.toThrow(InsufficientBalanceError);
    });

    it('throws NotFoundError for unknown ship', async () => {
        const routeRepo = mockRouteRepo({
            findById: jest.fn().mockResolvedValue(null),
        });
        const useCase = new BankSurplus(routeRepo, mockComplianceRepo(), mockBankRepo());

        await expect(
            useCase.execute({ shipId: 'GHOST', year: 2024, amount: 1_000 })
        ).rejects.toThrow(NotFoundError);
    });
});
