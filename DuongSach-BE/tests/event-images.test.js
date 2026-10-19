import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/database.js', () => {
  const prisma = {
    event: { findFirst: vi.fn() }, location: { findFirst: vi.fn() },
    eventLocation: { findUnique: vi.fn() }, eventSettings: { findUnique: vi.fn() },
    activity: { create: vi.fn(), findFirst: vi.fn() },
    organizationMember: { findFirst: vi.fn() }, partnerApplication: { findFirst: vi.fn() },
    activityProposal: { create: vi.fn() }, user: { findMany: vi.fn() }, auditLog: { create: vi.fn() },
  };
  prisma.$transaction = vi.fn(callback => callback(prisma));
  return { prisma };
});
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => { req.user = { id: 'user', primaryRole: req.headers['x-role'] || 'admin' }; next(); } }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: (...roles) => (req, res, next) => roles.includes(req.user.primaryRole) ? next() : res.sendStatus(403), requirePermission: () => (req, res, next) => next() }));
import { prisma } from '../src/config/database.js';
import { createApp } from '../src/app.js';
import { eventImageInput, withProposalReviewNote } from '../src/utils/eventImage.js';

const app = createApp();
const input = { eventId: '00000000-0000-4000-8000-000000000001', locationId: '00000000-0000-4000-8000-000000000002', title: 'Event with image', kind: 'talkshow', startAt: '2030-10-20T09:00:00+07:00', endAt: '2030-10-20T11:00:00+07:00' };
beforeEach(() => {
  vi.clearAllMocks();
  prisma.event.findFirst.mockResolvedValue({ id: input.eventId, startAt: new Date('2030-10-01'), endAt: new Date('2030-11-01') });
  prisma.location.findFirst.mockResolvedValue({ id: input.locationId });
  prisma.eventLocation.findUnique.mockResolvedValue({});
  prisma.eventSettings.findUnique.mockResolvedValue(null);
  prisma.partnerApplication.findFirst.mockResolvedValue({ status: 'approved' });
  prisma.organizationMember.findFirst.mockResolvedValue({ organization: { id: 'org', name: 'Publisher' } });
  prisma.activity.create.mockImplementation(async ({ data }) => ({ id: 'activity', ...data }));
  prisma.activityProposal.create.mockImplementation(async ({ data }) => ({ id: 'proposal', ...data, devices: [] }));
  prisma.user.findMany.mockResolvedValue([]);
});

describe('event registration images', () => {
  it('accepts an uploaded image above the old URL limit on the actual admin endpoint', async () => {
    // 8 MiB becomes more than 10 MiB JSON, also exercising the larger body parser.
    const imageUrl = 'data:image/png;base64,' + Buffer.alloc(8 * 1024 * 1024).toString('base64');
    const response = await request(app).post('/api/admin/activities').send({ ...input, imageUrl });
    expect(response.status).toBe(200);
    expect(prisma.activity.create.mock.calls[0][0].data.imageUrl).toBe(imageUrl);
  });
  it('preserves the uploaded image in a partner registration and its response', async () => {
    const imageUrl = 'data:image/png;base64,' + Buffer.alloc(4096).toString('base64');
    const response = await request(app).post('/api/partner/activity-proposals').set('x-role', 'partner').send({ ...input, imageUrl });
    expect(response.status).toBe(200);
    expect(response.body.data.imageUrl).toBe(imageUrl);
    expect(JSON.parse(prisma.activityProposal.create.mock.calls[0][0].data.managementNotes).imageUrl).toBe(imageUrl);
  });
  it('keeps image metadata when adding an approval or review note', () => {
    expect(JSON.parse(withProposalReviewNote(JSON.stringify({ imageUrl: 'data:image/png;base64,abc', schedule: [] }), 'Approved'))).toMatchObject({ imageUrl: 'data:image/png;base64,abc', schedule: [], reviewNote: 'Approved' });
  });
  it('accepts a 20 MiB image and rejects one above the new limit with a readable error', () => {
    expect(eventImageInput.safeParse('data:image/png;base64,' + Buffer.alloc(20 * 1024 * 1024).toString('base64')).success).toBe(true);
    const result = eventImageInput.safeParse('data:image/png;base64,' + Buffer.alloc(21 * 1024 * 1024).toString('base64'));
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('20 MB');
  });
});
