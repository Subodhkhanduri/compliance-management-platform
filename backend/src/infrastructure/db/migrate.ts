import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function migrate(): Promise<void> {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const sql = fs.readFileSync(
        path.join(__dirname, 'migrations/001_initial.sql'),
        'utf-8'
    );
    try {
        await pool.query(sql);
        console.log('✅ Migration complete');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
