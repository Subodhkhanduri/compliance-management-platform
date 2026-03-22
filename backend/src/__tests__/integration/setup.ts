import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { Pool, PoolClient } from 'pg';
import { createApp } from '../../infrastructure/server/app';
import { Express } from 'express';
import fs from 'fs';
import path from 'path';

// Shared pg pool for all integration tests
export const testPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export let app: Express;

// Run migrations + seed once before all suites
beforeAll(async () => {
    app = createApp();

    const migrationSql = fs.readFileSync(
        path.join(__dirname, '../../infrastructure/db/migrations/001_initial.sql'),
        'utf-8'
    );
    const seedSql = fs.readFileSync(
        path.join(__dirname, '../../infrastructure/db/seeds/routes.sql'),
        'utf-8'
    );

    await testPool.query(migrationSql);
    await testPool.query(seedSql);
});

afterAll(async () => {
    await testPool.end();
});

// Each test gets a clean slate via truncation
// (simpler than transactions for multi-table state)
export async function resetNonRouteData(): Promise<void> {
    await testPool.query(`
    TRUNCATE pool_members, pools, bank_entries, ship_compliance CASCADE
  `);
}
