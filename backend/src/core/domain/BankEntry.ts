// core/domain/BankEntry.ts
export interface BankEntry {
    readonly id: string;
    readonly shipId: string;
    readonly year: number;
    readonly amountGco2eq: number;   // always positive
    readonly createdAt: Date;
}
