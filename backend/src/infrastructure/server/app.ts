import express from 'express';
import cors from 'cors';
import { pool } from '../db/pool';

// Adapters
import { PgRouteRepository } from '../../adapters/outbound/postgres/PgRouteRepository';
import { PgComplianceRepository } from '../../adapters/outbound/postgres/PgComplianceRepository';
import { PgBankRepository } from '../../adapters/outbound/postgres/PgBankRepository';
import { PgPoolRepository } from '../../adapters/outbound/postgres/PgPoolRepository';

// Controllers
import { createRoutesRouter } from '../../adapters/inbound/http/routes.controller';
import { createComplianceRouter } from '../../adapters/inbound/http/compliance.controller';
import { createBankingRouter } from '../../adapters/inbound/http/banking.controller';
import { createPoolsRouter } from '../../adapters/inbound/http/pools.controller';

// Middleware
import { errorMiddleware } from './errorMiddleware';

export function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    // Instantiate adapters (concrete implementations of ports)
    const routeRepo = new PgRouteRepository(pool);
    const complianceRepo = new PgComplianceRepository(pool);
    const bankRepo = new PgBankRepository(pool);
    const poolRepo = new PgPoolRepository(pool);

    // Mount routers — inject dependencies here, not inside controllers
    app.use('/routes', createRoutesRouter(routeRepo, complianceRepo));
    app.use('/compliance', createComplianceRouter(routeRepo, complianceRepo, bankRepo));
    app.use('/banking', createBankingRouter(routeRepo, complianceRepo, bankRepo));
    app.use('/pools', createPoolsRouter(complianceRepo, poolRepo));

    // Health check
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));

    // Error handler must be last
    app.use(errorMiddleware);

    return app;
}
