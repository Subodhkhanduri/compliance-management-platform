// core/ports/ComplianceRepository.ts
import { ShipCompliance } from '../domain/ShipCompliance';

export interface ComplianceRepository {
    findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null>;
    save(compliance: ShipCompliance): Promise<void>;
    findAdjustedCB(shipId: string, year: number): Promise<number>;
}
