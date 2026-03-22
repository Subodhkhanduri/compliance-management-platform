import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BankRepository } from '../../../core/ports/BankRepository';
import { BankEntry } from '../../../core/domain/BankEntry';
import { InsufficientBalanceError } from '../../../shared/errors';

interface BankRow {
    id: string;
    ship_id: string;
    year: number;
    amount_gco2eq: string;
    created_at: Date;
}

function toBankEntry(row: BankRow): BankEntry {
    return {
        id: row.id,
        shipId: row.ship_id,
        year: Number(row.year),
        amountGco2eq: parseFloat(row.amount_gco2eq),
        createdAt: row.created_at,
    };
}

export class PgBankRepository implements BankRepository {
    constructor(private readonly pool: Pool) { }

    async findByShipAndYear(
        shipId: string,
        year: number
    ): Promise<BankEntry[]> {
        const { rows } = await this.pool.query<BankRow>(
            `SELECT * FROM bank_entries
       WHERE ship_id = $1 AND year = $2
       ORDER BY created_at DESC`,
            [shipId, year]
        );
        return rows.map(toBankEntry);
    }

    async getTotalBanked(shipId: string, year: number): Promise<number> {
        const { rows } = await this.pool.query<{ total: string }>(
            `SELECT COALESCE(SUM(amount_gco2eq), 0) AS total
       FROM bank_entries
       WHERE ship_id = $1 AND year = $2`,
            [shipId, year]
        );
        return parseFloat(rows[0].total);
    }

    async save(
        entry: Omit<BankEntry, 'id' | 'createdAt'>
    ): Promise<BankEntry> {
        const { rows } = await this.pool.query<BankRow>(
            `INSERT INTO bank_entries (id, ship_id, year, amount_gco2eq)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [uuidv4(), entry.shipId, entry.year, entry.amountGco2eq]
        );
        return toBankEntry(rows[0]);
    }

    async deductAmount(
        shipId: string,
        year: number,
        amount: number
    ): Promise<void> {
        // Greedy deduction: consume oldest entries first (FIFO)
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query<BankRow>(
                `SELECT * FROM bank_entries
         WHERE ship_id = $1 AND year = $2
         ORDER BY created_at ASC
         FOR UPDATE`,   // lock rows during transaction
                [shipId, year]
            );

            const total = rows.reduce(
                (sum, r) => sum + parseFloat(r.amount_gco2eq),
                0
            );

            if (amount > total) {
                throw new InsufficientBalanceError(total, amount);
            }

            let remaining = amount;

            for (const row of rows) {
                if (remaining <= 0) break;

                const rowAmount = parseFloat(row.amount_gco2eq);

                if (rowAmount <= remaining) {
                    // Consume this entry entirely
                    await client.query(
                        'DELETE FROM bank_entries WHERE id = $1',
                        [row.id]
                    );
                    remaining -= rowAmount;
                } else {
                    // Partially consume — update the entry
                    await client.query(
                        'UPDATE bank_entries SET amount_gco2eq = $1 WHERE id = $2',
                        [rowAmount - remaining, row.id]
                    );
                    remaining = 0;
                }
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
