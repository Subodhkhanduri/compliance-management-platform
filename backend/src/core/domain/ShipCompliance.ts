export interface ShipCompliance {
    readonly id: string;
    readonly shipId: string;
    readonly year: number;
    readonly cbGco2eq: number;
    readonly computedAt: Date;
}
