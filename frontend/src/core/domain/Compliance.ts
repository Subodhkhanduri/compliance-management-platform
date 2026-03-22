export interface ComplianceCB {
    shipId: string;
    year: number;
    cbGco2eq: number;
    isSurplus: boolean;
    ghgIntensity: number;
    energyInScope: number;
}

export interface AdjustedCB {
    shipId: string;
    year: number;
    baseCb: number;
    totalBanked: number;
    adjustedCb: number;
    isSurplus: boolean;
}

export interface ComparisonEntry {
    route: import('./Route').Route;
    percentDiff: number;
    compliant: boolean;
    vsTarget: number;
}

export interface ComparisonResult {
    baseline: import('./Route').Route;
    target: number;
    comparisons: ComparisonEntry[];
}
