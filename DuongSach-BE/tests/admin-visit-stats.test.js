import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../src/config/database.js', () => ({ prisma: { siteVisit: { count: vi.fn(), groupBy: vi.fn() } } }));
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => req.headers.authorization ? next() : res.sendStatus(401) }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: () => (req, res, next) => req.headers.authorization === 'admin' ? next() : res.sendStatus(403) }));
import { prisma } from '../src/config/database.js';
import router from '../src/modules/public/content.routes.js';

const app = express();
app.use('/api', router);
app.use((error, req, res, next) => res.status(error.statusCode || 400).json({ message: error.message }));

beforeEach(() => {
  vi.clearAllMocks();
  prisma.siteVisit.count.mockResolvedValue(3);
  prisma.siteVisit.groupBy.mockImplementation(async ({ by }) => by[0] === 'sessionId'
    ? [{ sessionId: 'one' }, { sessionId: 'two' }, { sessionId: 'three' }]
    : [{ day: new Date('2024-02-29T00:00:00Z'), _count: 2 }]);
});

describe('admin visit statistics endpoint', () => {
  it('returns counters and fills every day of a leap month with real counts or zero', async () => {
    const response = await request(app).get('/api/admin/visit-stats?year=2024&month=2').set('Authorization', 'admin');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ onlineCount: 3, todayVisits: 3, monthVisits: 3, totalVisits: 3 });
    expect(response.body.data.dailyVisits).toHaveLength(29);
    expect(response.body.data.dailyVisits[0]).toEqual({ date: '2024-02-01', count: 0 });
    expect(response.body.data.dailyVisits[28]).toEqual({ date: '2024-02-29', count: 2 });
    expect(response.body.data.monthlyStats).toHaveLength(12);
    expect(response.body.data.monthlyStats[1]).toEqual({ month: 2, year: 2024, count: 2 });
  });

  it('returns a full year and validates the month', async () => {
    const response = await request(app).get('/api/admin/visit-stats?year=2024').set('Authorization', 'admin');
    expect(response.status).toBe(200);
    expect(response.body.data.dailyVisits).toHaveLength(366);
    const invalid = await request(app).get('/api/admin/visit-stats?month=13').set('Authorization', 'admin');
    expect(invalid.status).toBe(422);
  });

  it('requires administrator access before querying statistics', async () => {
    expect((await request(app).get('/api/admin/visit-stats')).status).toBe(401);
    expect((await request(app).get('/api/admin/visit-stats').set('Authorization', 'partner')).status).toBe(403);
    expect(prisma.siteVisit.count).not.toHaveBeenCalled();
  });
});
