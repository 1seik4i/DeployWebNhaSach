import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/database.js', () => {
  const prisma = {
    event: { findFirst: vi.fn() }, organizationMember: { findFirst: vi.fn() },
    partnerApplication: { create: vi.fn() }, user: { findMany: vi.fn() }, auditLog: { create: vi.fn() },
  };
  prisma.$transaction = vi.fn(callback => callback(prisma));
  return { prisma };
});
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => { req.user = { id: 'partner', primaryRole: 'partner' }; next(); } }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: () => (req, res, next) => next(), requirePermission: () => (req, res, next) => next() }));
import { prisma } from '../src/config/database.js';
import { createApp } from '../src/app.js';

const app = createApp();
const eventId = '00000000-0000-4000-8000-000000000001';
const event = {
  id: eventId, status: 'published', visibility: 'public', isDeleted: false,
  startAt: new Date('2026-10-20T09:00:00+07:00'), endAt: new Date('2026-10-22T17:00:00+07:00'),
  settings: { partnerApplyDeadline: new Date('2000-01-01'), boothRequestDeadline: new Date('2000-01-01') },
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-19T12:00:00+07:00'));
  prisma.event.findFirst.mockResolvedValue(event);
  prisma.organizationMember.findFirst.mockResolvedValue({ organization: { id: 'organization', name: 'Partner' } });
  prisma.partnerApplication.create.mockResolvedValue({ id: 'application', status: 'submitted' });
  prisma.user.findMany.mockResolvedValue([]);
});
afterEach(() => vi.useRealTimers());

describe('partner participation without a registration period', () => {
  it('accepts upcoming events despite expired application deadlines', async () => {
    const response = await request(app).post('/api/partner/event-applications').send({ eventId });
    expect(response.status).toBe(200);
    expect(prisma.partnerApplication.create).toHaveBeenCalled();
    expect(prisma.event.findFirst.mock.calls[0][0]).not.toHaveProperty('include.settings');
    expect(prisma.event.findFirst.mock.calls[0][0].where).not.toHaveProperty('endAt');
  });
  it('accepts ongoing events despite expired application deadlines', async () => {
    prisma.event.findFirst.mockResolvedValue({ ...event, status: 'ongoing', startAt: new Date('2026-10-18T09:00:00+07:00') });
    expect((await request(app).post('/api/partner/event-applications').send({ eventId })).status).toBe(200);
  });
  it('matches the calendar status throughout the final Vietnam calendar day', async () => {
    prisma.event.findFirst.mockResolvedValue({ ...event, startAt: new Date('2026-10-19T08:00:00+07:00'), endAt: new Date('2026-10-19T09:00:00+07:00') });
    expect((await request(app).post('/api/partner/event-applications').send({ eventId })).status).toBe(200);
  });
  it.each([
    { endAt: new Date('2026-10-18T17:00:00+07:00'), startAt: new Date('2026-10-17') },
    { status: 'completed' }, { status: 'cancelled' }, { status: 'draft' },
    { isDeleted: true }, { visibility: 'internal' },
  ])('rejects unavailable events %j', async changes => {
    prisma.event.findFirst.mockResolvedValue({ ...event, ...changes });
    const response = await request(app).post('/api/partner/event-applications').send({ eventId });
    expect(response.status).toBe(409);
    expect(prisma.partnerApplication.create).not.toHaveBeenCalled();
  });
});
