import { ApplyBanked } from '../../core/application/ApplyBanked';
import {
    mockBankRepo, mockComplianceRepo, makeCompliance,
} from './mocks';
import {
    ValidationError,
    InsufficientBalanceError,
} from '../../shared/errors';

describe('ApplyBanked use-case', () => {
    it('applies banked amount and returns correct before/after', async () => {
        const compliance = makeCompliance('R001', -340_000_000); // big deficit
        const bankRepo = mockBankRepo({
            getTotalBanked: jest.fn().mockResolvedValue(50_000_000),
        });
        const complianceRepo = mockComplianceRepo({
            findByShipAndYear: jest.fn().mockResolvedValue(compliance),
        });

        const useCase = new ApplyBanked(bankRepo, complianceRepo);
        const result = await useCase.execute({
            shipId: 'R001', year: 2024, amount: 50_000_000,
        });

        expect(result.cbBefore).toBe(-340_000_000);
        expect(result.applied).toBe(50_000_000);
        expect(result.cbAfter).toBe(-340_000_000 + 50_000_000);
    });

    it('deducts from bank entries after applying', async () => {
        const bankRepo = mockBankRepo({
            getTotalBanked: jest.fn().mockResolvedValue(100_000),
        });
        const useCase = new ApplyBanked(bankRepo, mockComplianceRepo());

        await useCase.execute({ shipId: 'R001', year: 2024, amount: 100_000 });

        expect(bankRepo.deductAmount).toHaveBeenCalledWith('R001', 2024, 100_000);
    });

    it('updates compliance snapshot after applying', async () => {
        const compliance = makeCompliance('R001', -200_000);
        const bankRepo = mockBankRepo({
            getTotalBanked: jest.fn().mockResolvedValue(200_000),
        });
        const complianceRepo = mockComplianceRepo({
            findByShipAndYear: jest.fn().mockResolvedValue(compliance),
        });

        const useCase = new ApplyBanked(bankRepo, complianceRepo);
        await useCase.execute({ shipId: 'R001', year: 2024, amount: 200_000 });

        expect(complianceRepo.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ shipId: 'R001', cbGco2eq: 0 })
        );
    });

    it('throws ValidationError when amount ≤ 0', async () => {
        const useCase = new ApplyBanked(mockBankRepo(), mockComplianceRepo());

        await expect(
            useCase.execute({ shipId: 'R001', year: 2024, amount: 0 })
        ).rejects.toThrow(ValidationError);
    });

    it('throws InsufficientBalanceError when applying more than banked', async () => {
        const bankRepo = mockBankRepo({
            getTotalBanked: jest.fn().mockResolvedValue(10_000),
        });
        const useCase = new ApplyBanked(bankRepo, mockComplianceRepo());

        await expect(
            useCase.execute({ shipId: 'R001', year: 2024, amount: 999_999 })
        ).rejects.toThrow(InsufficientBalanceError);
    });

    it('uses cbGco2eq=0 as baseline when no compliance snapshot exists', async () => {
        const bankRepo = mockBankRepo({
            getTotalBanked: jest.fn().mockResolvedValue(50_000),
        });
        // findByShipAndYear returns null — no prior snapshot
        const useCase = new ApplyBanked(bankRepo, mockComplianceRepo());

        const result = await useCase.execute({
            shipId: 'R001', year: 2024, amount: 50_000,
        });

        expect(result.cbBefore).toBe(0);
        expect(result.cbAfter).toBe(50_000);
    });
});
