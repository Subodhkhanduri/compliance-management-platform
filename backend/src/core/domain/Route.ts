export type VesselType = 'Container' | 'BulkCarrier' | 'Tanker' | 'RoRo';
export type FuelType = 'HFO' | 'LNG' | 'MGO';

export interface Route {
    readonly id: string;
    readonly routeId: string;
    readonly vesselType: VesselType;
    readonly fuelType: FuelType;
    readonly year: number;
    readonly ghgIntensity: number;
    readonly fuelConsumption: number;
    readonly distance: number;
    readonly totalEmissions: number;
    readonly isBaseline: boolean;
}
