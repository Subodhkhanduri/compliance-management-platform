import { ShipCompliance } from '../domain/ShipCompliance';

export interface ComplianceRepository {
    findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null>;
    upsert(compliance: Omit<ShipCompliance, 'id' | 'computedAt'>): Promise<ShipCompliance>;
    getTotalBankedForShip(shipId: string, year: number): Promise<number>;
}
