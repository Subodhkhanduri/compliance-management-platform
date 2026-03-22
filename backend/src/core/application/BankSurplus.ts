// core/application/BankSurplus.ts
export interface BankSurplusCommand {
    shipId: string;
    year: number;
    amount: number;   // must be ≤ available CB surplus
}
