// core/ports/BankRepository.ts
import { BankEntry } from '../domain/BankEntry';

export interface BankRepository {
    findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
    getTotalBanked(shipId: string, year: number): Promise<number>;
    save(entry: BankEntry): Promise<void>;
    applyAmount(shipId: string, year: number, amount: number): Promise<void>;
}
