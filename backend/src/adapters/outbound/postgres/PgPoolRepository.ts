import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { PoolRepository } from '../../../core/ports/PoolRepository';
import { Pool as PoolEntity } from '../../../core/domain/Pool';
import { PoolMember } from '../../../core/domain/PoolMember';

export class PgPoolRepository implements PoolRepository {
    constructor(private readonly pool: Pool) { }

    async save(
        poolData: Omit<PoolEntity, 'id' | 'createdAt'>,
        members: Omit<PoolMember, 'poolId'>[]
    ): Promise<{ pool: PoolEntity; members: PoolMember[] }> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const poolId = uuidv4();

            // Insert pool record
            const { rows: poolRows } = await client.query<{
                id: string;
                year: number;
                created_at: Date;
            }>(
                `INSERT INTO pools (id, year) VALUES ($1, $2) RETURNING *`,
                [poolId, poolData.year]
            );

            // Insert all members in one batch
            const memberValues = members.map((m, i) => {
                const base = i * 5;
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
            });

            const memberParams = members.flatMap(m => [
                poolId,
                m.shipId,
                m.cbBefore,
                m.cbAfter,
                m.allocatedSurplus,
            ]);

            await client.query(
                `INSERT INTO pool_members
           (pool_id, ship_id, cb_before, cb_after, allocated_surplus)
         VALUES ${memberValues.join(', ')}`,
                memberParams
            );

            await client.query('COMMIT');

            const pool: PoolEntity = {
                id: poolRows[0].id,
                year: poolRows[0].year,
                createdAt: poolRows[0].created_at,
            };

            const savedMembers: PoolMember[] = members.map(m => ({
                ...m,
                poolId,
            }));

            return { pool, members: savedMembers };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
