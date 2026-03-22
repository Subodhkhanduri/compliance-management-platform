// core/domain/Route.ts
export interface Route {
    readonly routeId: string;
    readonly vesselType: 'Container' | 'BulkCarrier' | 'Tanker' | 'RoRo';
    readonly fuelType: 'HFO' | 'LNG' | 'MGO';
    readonly year: number;
    readonly ghgIntensity: number;       // gCO₂e/MJ
    readonly fuelConsumption: number;    // tonnes
    readonly distance: number;           // km
    readonly totalEmissions: number;     // tonnes
    readonly isBaseline: boolean;
}
