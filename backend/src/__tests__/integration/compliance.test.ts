import request from 'supertest';
import { app, resetNonRouteData } from './setup';

beforeEach(resetNonRouteData);

describe('GET /compliance/cb', () => {
    it('computes and stores CB for R002 (surplus)', async () => {
        const res = await request(app)
            .get('/compliance/cb?shipId=R002&year=2024')
            .expect(200);

        const { cbGco2eq, isSurplus } = res.body.data;
        const expected = (89.3368 - 88.0) * (4800 * 41_000);

        expect(cbGco2eq).toBeCloseTo(expected, 0);
        expect(isSurplus).toBe(true);
    });

    it('computes and stores CB for R001 (deficit)', async () => {
        const res = await request(app)
            .get('/compliance/cb?shipId=R001&year=2024')
            .expect(200);

        expect(res.body.data.isSurplus).toBe(false);
        expect(res.body.data.cbGco2eq).toBeLessThan(0);
    });

    it('returns 400 when query params are missing', async () => {
        await request(app).get('/compliance/cb').expect(400);
        await request(app).get('/compliance/cb?shipId=R001').expect(400);
    });

    it('returns 404 for unknown shipId', async () => {
        await request(app)
            .get('/compliance/cb?shipId=GHOST&year=2024')
            .expect(404);
    });
});

describe('GET /compliance/adjusted-cb', () => {
    it('returns adjustedCb = baseCb when no banking has occurred', async () => {
        // First compute base CB
        await request(app).get('/compliance/cb?shipId=R002&year=2024');

        const res = await request(app)
            .get('/compliance/adjusted-cb?shipId=R002&year=2024')
            .expect(200);

        const { baseCb, totalBanked, adjustedCb } = res.body.data;
        expect(totalBanked).toBe(0);
        expect(adjustedCb).toBeCloseTo(baseCb, 0);
    });
});
