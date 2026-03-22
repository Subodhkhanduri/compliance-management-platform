export interface BankEntry {
    readonly id: string;
    readonly shipId: string;
    readonly year: number;
    readonly amountGco2eq: number;  // always positive — enforced at use-case layer
    readonly createdAt: Date;
}
