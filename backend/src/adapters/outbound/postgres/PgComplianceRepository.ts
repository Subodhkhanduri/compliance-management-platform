import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { ShipCompliance } from '../../../core/domain/ShipCompliance';

interface ComplianceRow {
    id: string;
    ship_id: string;
    year: number;
    cb_gco2eq: string;
    computed_at: Date;
}

function toCompliance(row: ComplianceRow): ShipCompliance {
    return {
        id: row.id,
        shipId: row.ship_id,
        year: Number(row.year),
        cbGco2eq: parseFloat(row.cb_gco2eq),
        computedAt: row.computed_at,
    };
}

export class PgComplianceRepository implements ComplianceRepository {
    constructor(private readonly pool: Pool) { }

    async findByShipAndYear(
        shipId: string,
        year: number
    ): Promise<ShipCompliance | null> {
        const { rows } = await this.pool.query<ComplianceRow>(
            `SELECT * FROM ship_compliance
       WHERE ship_id = $1 AND year = $2
       LIMIT 1`,
            [shipId, year]
        );
        return rows[0] ? toCompliance(rows[0]) : null;
    }

    async upsert(
        compliance: Omit<ShipCompliance, 'id' | 'computedAt'>
    ): Promise<ShipCompliance> {
        // ON CONFLICT: if a snapshot exists for this ship+year, update it
        const { rows } = await this.pool.query<ComplianceRow>(
            `INSERT INTO ship_compliance (id, ship_id, year, cb_gco2eq)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (ship_id, year)
       DO UPDATE SET cb_gco2eq = EXCLUDED.cb_gco2eq,
                     computed_at = NOW()
       RETURNING *`,
            [uuidv4(), compliance.shipId, compliance.year, compliance.cbGco2eq]
        );
        return toCompliance(rows[0]);
    }

    async getTotalBankedForShip(shipId: string, year: number): Promise<number> {
        // Sum all active bank entries — used for adjusted CB
        const { rows } = await this.pool.query<{ total: string }>(
            `SELECT COALESCE(SUM(amount_gco2eq), 0) AS total
       FROM bank_entries
       WHERE ship_id = $1 AND year = $2`,
            [shipId, year]
        );
        return parseFloat(rows[0].total);
    }
}
