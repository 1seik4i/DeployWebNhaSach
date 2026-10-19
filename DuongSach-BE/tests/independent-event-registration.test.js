import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/database.js', () => {
  const prisma = {
    event: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    location: { findFirst: vi.fn() }, eventLocation: { upsert: vi.fn() },
    eventSettings: { findUnique: vi.fn() }, partnerApplication: { findFirst: vi.fn() },
    organizationMember: { findFirst: vi.fn() }, activity: { create: vi.fn() },
    activityProposal: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    activityReview: { create: vi.fn() }, user: { findMany: vi.fn() },
    notification: { createMany: vi.fn() }, auditLog: { create: vi.fn() },
  };
  prisma.$transaction = vi.fn(callback => callback(prisma));
  return { prisma };
});
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => { req.user = { id: 'actor', primaryRole: req.headers['x-role'] || 'admin' }; next(); } }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: (...roles) => (req, res, next) => roles.includes(req.user.primaryRole) ? next() : res.sendStatus(403), requirePermission: () => (req, res, next) => next() }));
import { prisma } from '../src/config/database.js';
import { createApp } from '../src/app.js';
import { checkIndependentSchedule } from '../src/modules/event/independent-event.js';

const app = createApp();
const proposalId = '00000000-0000-4000-8000-000000000010';
const input = { title: 'Independent event', kind: 'talkshow', locationId: '00000000-0000-4000-8000-000000000002', startAt: '2026-10-21T09:00:00+07:00', endAt: '2026-10-22T23:00:00+07:00', capacity: 30 };
let events, proposal;
beforeEach(() => {
  vi.clearAllMocks(); events = []; proposal = null;
  prisma.event.findFirst.mockRejectedValue(new Error('Must not inspect another event'));
  prisma.location.findFirst.mockResolvedValue({ id: input.locationId, venueId: 'venue' });
  prisma.organizationMember.findFirst.mockResolvedValue({ organization: { id: 'org', name: 'Publisher' } });
  prisma.event.create.mockImplementation(async ({ data }) => { const event = { id: `new-event-${events.length + 1}`, ...data }; events.push(event); return event; });
  prisma.event.update.mockImplementation(async ({ where, data }) => Object.assign(events.find(event => event.id === where.id) || {}, data));
  prisma.activity.create.mockImplementation(async ({ data }) => ({ id: 'new-program', ...data }));
  prisma.activityProposal.create.mockImplementation(async ({ data }) => { proposal = { id: proposalId, ...data }; return proposal; });
  prisma.activityProposal.findUnique.mockImplementation(async () => proposal);
  prisma.activityProposal.update.mockImplementation(async ({ data }) => Object.assign(proposal, data));
  prisma.activityReview.create.mockResolvedValue({ id: 'review' });
  prisma.user.findMany.mockResolvedValue([]);
});

describe('independent event registration', () => {
  it('creates two separate events with identical time and location without reading any existing event', async () => {
    const first = await request(app).post('/api/admin/event-registrations').send(input);
    const second = await request(app).post('/api/admin/event-registrations').send(input);
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    expect(first.body.data.id).not.toBe(second.body.data.id);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ startAt: new Date(input.startAt), endAt: new Date(input.endAt), status: 'published' });
    expect(prisma.event.findFirst).not.toHaveBeenCalled();
    expect(prisma.eventSettings.findUnique).not.toHaveBeenCalled();
  });
  it('accepts dates chosen by the user, including past dates, and honors admin draft selection', async () => {
    const response = await request(app).post('/api/admin/event-registrations').send({ ...input, startAt: '2010-01-01T08:00:00+07:00', endAt: '2010-01-02T09:00:00+07:00', isPublished: false });
    expect(response.status).toBe(200);
    expect(events[0]).toMatchObject({ status: 'draft', visibility: 'internal', startAt: new Date('2010-01-01T08:00:00+07:00') });
  });
  it('lets a partner register without a previous event application, then publishes only after approval', async () => {
    const response = await request(app).post('/api/partner/event-registrations').set('x-role', 'partner').send(input);
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('pending');
    expect(events[0]).toMatchObject({ status: 'draft', visibility: 'internal' });
    expect(proposal.eventId).toBe(events[0].id);
    expect(prisma.partnerApplication.findFirst).not.toHaveBeenCalled();
    expect(prisma.activity.create).not.toHaveBeenCalled();
    const approved = await request(app).post(`/api/admin/activity-proposals/${proposalId}/approve`).send({});
    expect(approved.status).toBe(200);
    expect(events[0]).toMatchObject({ status: 'published', visibility: 'public' });
    expect(proposal).toMatchObject({ status: 'approved', publishedActivityId: 'new-program' });
    expect(prisma.activity.create.mock.calls[0][0].data).toMatchObject({ eventId: events[0].id, startAt: new Date(input.startAt), endAt: new Date(input.endAt), status: 'published' });
  });
  it.each([input.startAt, '2026-10-20T09:00:00+07:00'])('rejects end-before-start without writing an event', async endAt => {
    const response = await request(app).post('/api/admin/event-registrations').send({ ...input, endAt });
    expect(response.status).toBe(422);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });
  it('rejects an external eventId and enforces the role of the endpoint', async () => {
    expect((await request(app).post('/api/admin/event-registrations').send({ ...input, eventId: 'old-event' })).status).toBe(422);
    expect((await request(app).post('/api/admin/event-registrations').set('x-role', 'partner').send(input)).status).toBe(403);
  });
  it('allows editing an independent registration beyond its own original dates', async () => {
    const data = { ...input, eventId: 'own-event', startAt: '2030-01-01T08:00:00+07:00', endAt: '2030-01-03T10:00:00+07:00' };
    const checked = await checkIndependentSchedule(prisma, data);
    expect(checked.endAt).toEqual(new Date(data.endAt));
    expect(prisma.event.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'own-event' }, data: expect.objectContaining({ endAt: new Date(data.endAt) }) }));
    expect(prisma.event.findFirst).not.toHaveBeenCalled();
  });
});
