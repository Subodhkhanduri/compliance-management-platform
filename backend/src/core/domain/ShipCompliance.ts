// core/domain/ShipCompliance.ts
export interface ShipCompliance {
    readonly id: string;
    readonly shipId: string;
    readonly year: number;
    readonly cbGco2eq: number;       // the computed CB value
    readonly computedAt: Date;
}
