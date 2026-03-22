import request from 'supertest';
import { app, resetNonRouteData } from './setup';

beforeEach(async () => {
    await resetNonRouteData();
    // Pre-compute CB for R002 so banking has a reference
    await request(app).get('/compliance/cb?shipId=R002&year=2024');
});

describe('POST /banking/bank', () => {
    it('banks a valid surplus amount', async () => {
        const res = await request(app)
            .post('/banking/bank')
            .send({ shipId: 'R002', year: 2024, amount: 100_000 })
            .expect(201);

        expect(res.body.data.amountBanked).toBe(100_000);
        expect(res.body.data.totalBanked).toBe(100_000);
    });

    it('accumulates multiple bank entries', async () => {
        await request(app)
            .post('/banking/bank')
            .send({ shipId: 'R002', year: 2024, amount: 50_000 });

        const res = await request(app)
            .post('/banking/bank')
            .send({ shipId: 'R002', year: 2024, amount: 50_000 })
            .expect(201);

        expect(res.body.data.totalBanked).toBe(100_000);
    });

    it('returns 400 when banking from a deficit ship', async () => {
        // R001 has ghg=91.0 > target → deficit
        await request(app).get('/compliance/cb?shipId=R001&year=2024');

        const res = await request(app)
            .post('/banking/bank')
            .send({ shipId: 'R001', year: 2024, amount: 50_000 })
            .expect(400);

        expect(res.body.error).toMatch(/deficit|surplus/i);
    });

    it('returns 400 when amount exceeds CB surplus', async () => {
        const res = await request(app)
            .post('/banking/bank')
            .send({ shipId: 'R002', year: 2024, amount: 999_999_999_999 })
            .expect(400);

        expect(res.body.error).toMatch(/insufficient/i);
    });

    it('returns 400 when required fields are missing', async () => {
        await request(app)
            .post('/banking/bank')
            .send({ shipId: 'R002' })
            .expect(400);
    });
});

describe('POST /banking/apply', () => {
    beforeEach(async () => {
        // Pre-bank some surplus from R002
        await request(app)
            .post('/banking/bank')
            .send({ shipId: 'R002', year: 2024, amount: 200_000 });
    });

    it('applies banked amount and returns before/after CB', async () => {
        const res = await request(app)
            .post('/banking/apply')
            .send({ shipId: 'R002', year: 2024, amount: 200_000 })
            .expect(200);

        const { cbBefore, applied, cbAfter } = res.body.data;
        expect(applied).toBe(200_000);
        expect(cbAfter).toBeCloseTo(cbBefore + 200_000, 0);
    });

    it('returns 400 when applying more than banked', async () => {
        const res = await request(app)
            .post('/banking/apply')
            .send({ shipId: 'R002', year: 2024, amount: 999_999_999 })
            .expect(400);

        expect(res.body.error).toMatch(/insufficient/i);
    });

    it('consumes bank entries (FIFO deduction)', async () => {
        await request(app)
            .post('/banking/apply')
            .send({ shipId: 'R002', year: 2024, amount: 200_000 });

        // All banked amount consumed — records should be empty
        const recordsRes = await request(app)
            .get('/banking/records?shipId=R002&year=2024')
            .expect(200);

        expect(recordsRes.body.data.totalBanked).toBe(0);
    });
});
