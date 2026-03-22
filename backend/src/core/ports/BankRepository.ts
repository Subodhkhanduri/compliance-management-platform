import { BankEntry } from '../domain/BankEntry';

export interface BankRepository {
    findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
    getTotalBanked(shipId: string, year: number): Promise<number>;
    save(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry>;
    deductAmount(shipId: string, year: number, amount: number): Promise<void>;
}
