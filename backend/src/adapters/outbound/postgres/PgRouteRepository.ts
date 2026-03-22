import { Pool } from 'pg';
import { RouteRepository, RouteFilters } from '../../../core/ports/RouteRepository';
import { Route, VesselType, FuelType } from '../../../core/domain/Route';

// DB row shape — explicit typing prevents silent mapping errors
interface RouteRow {
    id: string;
    route_id: string;
    vessel_type: string;
    fuel_type: string;
    year: number;
    ghg_intensity: string;      // pg returns NUMERIC as string
    fuel_consumption: string;
    distance: string;
    total_emissions: string;
    is_baseline: boolean;
}

function toRoute(row: RouteRow): Route {
    return {
        id: row.id,
        routeId: row.route_id,
        vesselType: row.vessel_type as VesselType,
        fuelType: row.fuel_type as FuelType,
        year: Number(row.year),
        ghgIntensity: parseFloat(row.ghg_intensity),
        fuelConsumption: parseFloat(row.fuel_consumption),
        distance: parseFloat(row.distance),
        totalEmissions: parseFloat(row.total_emissions),
        isBaseline: row.is_baseline,
    };
}

export class PgRouteRepository implements RouteRepository {
    constructor(private readonly pool: Pool) { }

    async findAll(filters?: RouteFilters): Promise<Route[]> {
        const conditions: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (filters?.vesselType) {
            conditions.push(`vessel_type = $${idx++}`);
            values.push(filters.vesselType);
        }
        if (filters?.fuelType) {
            conditions.push(`fuel_type = $${idx++}`);
            values.push(filters.fuelType);
        }
        if (filters?.year) {
            conditions.push(`year = $${idx++}`);
            values.push(filters.year);
        }

        const where = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const { rows } = await this.pool.query<RouteRow>(
            `SELECT * FROM routes ${where} ORDER BY route_id ASC`,
            values
        );

        return rows.map(toRoute);
    }

    async findById(routeId: string): Promise<Route | null> {
        const { rows } = await this.pool.query<RouteRow>(
            'SELECT * FROM routes WHERE route_id = $1',
            [routeId]
        );
        return rows[0] ? toRoute(rows[0]) : null;
    }

    async findBaseline(): Promise<Route | null> {
        const { rows } = await this.pool.query<RouteRow>(
            'SELECT * FROM routes WHERE is_baseline = true LIMIT 1'
        );
        return rows[0] ? toRoute(rows[0]) : null;
    }

    async setBaseline(routeId: string): Promise<void> {
        // Use a transaction: clear all baselines, then set the new one
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                'UPDATE routes SET is_baseline = false WHERE is_baseline = true'
            );
            await client.query(
                'UPDATE routes SET is_baseline = true WHERE route_id = $1',
                [routeId]
            );
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
