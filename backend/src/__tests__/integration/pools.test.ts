import request from 'supertest';
import { app, resetNonRouteData } from './setup';

beforeEach(async () => {
    await resetNonRouteData();
    // Pre-compute CB for all ships we'll pool
    await Promise.all([
        request(app).get('/compliance/cb?shipId=R001&year=2024'),
        request(app).get('/compliance/cb?shipId=R002&year=2024'),
        request(app).get('/compliance/cb?shipId=R003&year=2024'),
    ]);
});

describe('POST /pools', () => {
    it('creates a valid pool when surplus covers deficit', async () => {
        // R002 (surplus) + R001 (deficit) — R002 surplus is large enough
        const res = await request(app)
            .post('/pools')
            .send({ year: 2024, memberShipIds: ['R001', 'R002'] })
            .expect(201);

        expect(res.body.data.poolId).toBeDefined();
        expect(res.body.data.members).toHaveLength(2);
    });

    it('returns cb_before and cb_after per member', async () => {
        const res = await request(app)
            .post('/pools')
            .send({ year: 2024, memberShipIds: ['R001', 'R002'] })
            .expect(201);

        const members = res.body.data.members;
        members.forEach((m: { cbBefore: number; cbAfter: number }) => {
            expect(m.cbBefore).toBeDefined();
            expect(m.cbAfter).toBeDefined();
        });
    });

    it('surplus ship cbAfter is never negative', async () => {
        const res = await request(app)
            .post('/pools')
            .send({ year: 2024, memberShipIds: ['R001', 'R002'] })
            .expect(201);

        const r002 = res.body.data.members.find(
            (m: { shipId: string }) => m.shipId === 'R002'
        );
        expect(r002.cbAfter).toBeGreaterThanOrEqual(0);
    });

    it('returns 400 when pool sum is negative (all ships in deficit)', async () => {
        // R001 and R003 are both deficit ships
        const res = await request(app)
            .post('/pools')
            .send({ year: 2024, memberShipIds: ['R001', 'R003'] })
            .expect(400);

        expect(res.body.error).toMatch(/invalid pool|sum/i);
    });

    it('returns 400 with fewer than 2 members', async () => {
        await request(app)
            .post('/pools')
            .send({ year: 2024, memberShipIds: ['R002'] })
            .expect(400);
    });

    it('returns 400 when memberShipIds is not an array', async () => {
        await request(app)
            .post('/pools')
            .send({ year: 2024, memberShipIds: 'R001,R002' })
            .expect(400);
    });
});
