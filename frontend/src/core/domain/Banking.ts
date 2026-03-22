export interface BankEntry {
    id: string;
    shipId: string;
    year: number;
    amountGco2eq: number;
    createdAt: string;
}

export interface BankRecords {
    entries: BankEntry[];
    totalBanked: number;
}

export interface BankSurplusResult {
    shipId: string;
    year: number;
    amountBanked: number;
    totalBanked: number;
    cbRemaining: number;
}

export interface ApplyBankedResult {
    shipId: string;
    year: number;
    cbBefore: number;
    applied: number;
    cbAfter: number;
}
