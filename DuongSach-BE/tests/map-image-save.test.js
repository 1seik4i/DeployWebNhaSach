import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../src/config/database.js', () => {
  const prisma = {
    setting: { findUnique: vi.fn(), upsert: vi.fn() },
    venue: { findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
    booth: { findMany: vi.fn() },
    location: { findMany: vi.fn(), update: vi.fn() },
    heritage: { findMany: vi.fn(), update: vi.fn() },
    mapHotspot: { findMany: vi.fn(), update: vi.fn() },
  };
  prisma.$transaction = vi.fn(callback => callback(prisma));
  return { prisma };
});
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => { req.user = { id: 'admin', primaryRole: 'admin' }; next(); } }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: () => (req, res, next) => next() }));
import { prisma } from '../src/config/database.js';
import router from '../src/modules/public/map.routes.js';

const app = express();
app.use(express.json({ limit: '30mb' }));
app.use('/api', router);
app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
beforeEach(() => {
  vi.clearAllMocks();
  prisma.setting.findUnique.mockResolvedValue({ value: { imageUrl: '/old-map.png' } });
  prisma.venue.findFirst.mockResolvedValue({ id: 'venue' });
  prisma.booth.findMany.mockResolvedValue([{ id: 'booth', code: 'B1', location: { id: 'location', mapX: 0, mapY: 0 } }]);
  prisma.location.findMany.mockResolvedValue([]);
  prisma.heritage.findMany.mockResolvedValue([]);
  prisma.mapHotspot.findMany.mockResolvedValue([]);
});

describe('map image size and combined save', () => {
  it('resolves 39 unchanged markers in four reads without rewriting coordinates', async () => {
    const points = Array.from({ length: 39 }, (_, i) => ({ id: `booth-${i}`, x: 25, y: 30 }));
    prisma.booth.findMany.mockResolvedValue(points.map(point => ({ id: point.id, location: { id: `location-${point.id}`, mapX: 25, mapY: 30 } })));
    const response = await request(app).put('/api/admin/map-config').send({ imageUrl: '/new-map.png', points });
    expect(response.status).toBe(200);
    for (const model of [prisma.booth, prisma.location, prisma.heritage, prisma.mapHotspot]) expect(model.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.location.update).not.toHaveBeenCalled();
    expect(prisma.setting.upsert.mock.calls[0][0].update.value.imageUrl).toBe('/new-map.png');
  });
  it('does not query markers when only the image changes', async () => {
    expect((await request(app).put('/api/admin/map-config').send({ imageUrl: '/new-map.png' })).status).toBe(200);
    expect(prisma.booth.findMany).not.toHaveBeenCalled();
  });
  it('accepts a 20 MiB image and writes image and coordinates in one transaction', async () => {
    const imageUrl = 'data:image/png;base64,' + Buffer.alloc(20 * 1024 * 1024).toString('base64');
    const response = await request(app).put('/api/admin/map-config').send({ imageUrl, points: [{ id: 'booth', x: 25, y: 30 }] });
    expect(response.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.location.update).toHaveBeenCalledWith({ where: { id: 'location' }, data: { mapX: 25, mapY: 30 } });
    expect(prisma.setting.upsert.mock.calls[0][0].update.value.imageUrl).toBe(imageUrl);
  });
  it('rejects an image above 20 MiB before any write', async () => {
    const imageUrl = 'data:image/png;base64,' + Buffer.alloc(21 * 1024 * 1024).toString('base64');
    const response = await request(app).put('/api/admin/map-config').send({ imageUrl });
    expect(response.status).toBe(422);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.setting.upsert).not.toHaveBeenCalled();
  });
  it('preserves the saved image for coordinate-only saves', async () => {
    const response = await request(app).put('/api/admin/map-config').send({ points: [] });
    expect(response.status).toBe(200);
    expect(prisma.setting.upsert.mock.calls[0][0].update.value.imageUrl).toBe('/old-map.png');
  });
});
