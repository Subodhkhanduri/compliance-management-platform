// core/application/ComputeCB.ts
export interface ComputeCBCommand {
    shipId: string;    // maps to routeId in this context
    year: number;
}

export interface ComputeCBResult {
    shipId: string;
    year: number;
    cbGco2eq: number;
    isSurplus: boolean;
}
