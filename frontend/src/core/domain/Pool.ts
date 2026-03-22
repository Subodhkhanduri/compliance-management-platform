export interface PoolMemberView {
    shipId: string;
    cbBefore: number;
    cbAfter: number;
    allocatedSurplus: number;
}

export interface PoolResult {
    poolId: string;
    year: number;
    members: PoolMemberView[];
    poolSum: number;
}

export interface AdjustedCBEntry {
    shipId: string;
    year: number;
    baseCb: number;
    totalBanked: number;
    adjustedCb: number;
    isSurplus: boolean;
}
