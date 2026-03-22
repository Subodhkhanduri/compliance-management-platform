import request from 'supertest';
import { app, resetNonRouteData } from './setup';

beforeEach(resetNonRouteData);

describe('GET /routes', () => {
    it('returns all 5 seeded routes', async () => {
        const res = await request(app).get('/routes').expect(200);

        expect(res.body.data).toHaveLength(5);
    });

    it('filters by vesselType', async () => {
        const res = await request(app)
            .get('/routes?vesselType=Container')
            .expect(200);

        expect(res.body.data).toHaveLength(2); // R001, R005
        res.body.data.forEach((r: { vesselType: string }) => {
            expect(r.vesselType).toBe('Container');
        });
    });

    it('filters by fuelType', async () => {
        const res = await request(app)
            .get('/routes?fuelType=LNG')
            .expect(200);

        expect(res.body.data).toHaveLength(2); // R002, R005
    });

    it('filters by year', async () => {
        const res = await request(app)
            .get('/routes?year=2025')
            .expect(200);

        expect(res.body.data).toHaveLength(2); // R004, R005
    });

    it('combines filters', async () => {
        const res = await request(app)
            .get('/routes?fuelType=HFO&year=2024')
            .expect(200);

        expect(res.body.data).toHaveLength(1); // R001 only
        expect(res.body.data[0].routeId).toBe('R001');
    });
});

describe('POST /routes/:id/baseline', () => {
    it('sets R002 as the new baseline', async () => {
        await request(app).post('/routes/R002/baseline').expect(200);

        const res = await request(app).get('/routes').expect(200);
        const r002 = res.body.data.find((r: { routeId: string }) => r.routeId === 'R002');
        const r001 = res.body.data.find((r: { routeId: string }) => r.routeId === 'R001');

        expect(r002.isBaseline).toBe(true);
        expect(r001.isBaseline).toBe(false);
    });

    it('returns 404 for unknown routeId', async () => {
        const res = await request(app)
            .post('/routes/FAKE/baseline')
            .expect(404);

        expect(res.body.error).toMatch(/not found/i);
    });
});

describe('GET /routes/comparison', () => {
    it('returns baseline + comparisons with percentDiff and compliant flags', async () => {
        const res = await request(app).get('/routes/comparison').expect(200);

        expect(res.body.data.baseline).toBeDefined();
        expect(res.body.data.comparisons).toHaveLength(4);

        const r002 = res.body.data.comparisons.find(
            (c: { route: { routeId: string } }) => c.route.routeId === 'R002'
        );
        expect(r002.compliant).toBe(true);   // 88.0 ≤ 89.3368
        expect(r002.percentDiff).toBeLessThan(0);

        const r003 = res.body.data.comparisons.find(
            (c: { route: { routeId: string } }) => c.route.routeId === 'R003'
        );
        expect(r003.compliant).toBe(false);  // 93.5 > 89.3368
        expect(r003.percentDiff).toBeGreaterThan(0);
    });
});
