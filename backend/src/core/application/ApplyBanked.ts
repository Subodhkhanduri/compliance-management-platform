// core/application/ApplyBanked.ts
export interface ApplyBankedCommand {
    shipId: string;
    year: number;
    amount: number;   // must be ≤ total banked for that ship/year
}

export interface ApplyBankedResult {
    cbBefore: number;
    applied: number;
    cbAfter: number;
}
