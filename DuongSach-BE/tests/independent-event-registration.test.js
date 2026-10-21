import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/database.js', () => {
  const prisma = {
    setting: { findUnique: vi.fn() },
    userStallAssignment: { findFirst: vi.fn() }, booth: { findMany: vi.fn() },
    publicEventRegistration: { aggregate: vi.fn() }, feedback: { findMany: vi.fn() },
    boothAssignment: { count: vi.fn() },
    event: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    location: { findFirst: vi.fn() }, eventLocation: { upsert: vi.fn() },
    eventSettings: { findUnique: vi.fn() }, partnerApplication: { findFirst: vi.fn(), upsert: vi.fn(), findMany: vi.fn() },
    organizationMember: { findFirst: vi.fn(), findMany: vi.fn() }, activity: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    activityProposal: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    activityReview: { create: vi.fn() }, user: { findMany: vi.fn() },
    notification: { createMany: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() }, auditLog: { create: vi.fn() },
  };
  prisma.$transaction = vi.fn(callback => callback(prisma));
  return { prisma };
});
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => { req.user = { id: 'actor', primaryRole: req.headers['x-role'] || 'admin' }; next(); } }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: (...roles) => (req, res, next) => roles.includes(req.user.primaryRole) ? next() : res.sendStatus(403), requirePermission: () => (req, res, next) => next() }));
import { prisma } from '../src/config/database.js';
import { createApp } from '../src/app.js';
import { checkIndependentSchedule } from '../src/modules/event/independent-event.js';
import { publishIndependentRegistration } from '../src/modules/event/independent-event.js';
import { publishApprovedProposal } from '../src/modules/event/independent-event.js';
import { syncApprovedActivities } from '../src/modules/proposal/sync-approved-activities.js';

const app = createApp();
const proposalId = '00000000-0000-4000-8000-000000000010';
const input = { targetAudience: 'Readers and students', title: 'Independent event', kind: 'talkshow', locationId: '00000000-0000-4000-8000-000000000002', startAt: '2026-10-21T09:00:00+07:00', endAt: '2026-10-22T23:00:00+07:00', capacity: 30 };
let events, proposal;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-20T18:00:00+07:00'));
  vi.clearAllMocks(); events = []; proposal = null;
  prisma.event.findFirst.mockRejectedValue(new Error('Must not inspect another event'));
  prisma.event.findUnique.mockResolvedValue({ coverImageUrl: '/event-cover.jpg' });
  prisma.activity.findFirst.mockResolvedValue(null);
  prisma.location.findFirst.mockResolvedValue({ id: input.locationId, venueId: 'venue' });
  prisma.organizationMember.findFirst.mockResolvedValue({ organization: { id: 'org', name: 'Publisher' } });
  prisma.organizationMember.findMany.mockResolvedValue([{ userId: 'partner-user' }]);
  prisma.event.create.mockImplementation(async ({ data }) => { const event = { id: `new-event-${events.length + 1}`, ...data }; events.push(event); return event; });
  prisma.event.update.mockImplementation(async ({ where, data }) => Object.assign(events.find(event => event.id === where.id) || {}, data));
  prisma.activity.create.mockImplementation(async ({ data }) => ({ id: 'new-program', ...data }));
  prisma.activityProposal.create.mockImplementation(async ({ data }) => { proposal = { id: proposalId, ...data }; return proposal; });
  prisma.activityProposal.findUnique.mockImplementation(async () => proposal);
  prisma.activityProposal.update.mockImplementation(async ({ data }) => Object.assign(proposal, data));
  prisma.activityReview.create.mockResolvedValue({ id: 'review' });
  prisma.user.findMany.mockResolvedValue([]);
  prisma.partnerApplication.upsert.mockResolvedValue({ id: 'participation', status: 'approved' });
});

describe('independent event registration', () => {
  it('repairs an old approved proposal once and links it to a published calendar activity', async () => {
    await request(app).post('/api/partner/event-registrations').set('x-role', 'partner').send(input);
    proposal.status = 'approved'; proposal.managementNotes = '{}'; proposal.reviews = [{ reviewerId: 'reviewer' }];
    prisma.activityProposal.findMany.mockImplementation(async () => proposal.publishedActivityId ? [] : [{ id: proposalId }]);
    expect(await syncApprovedActivities()).toBe(1);
    expect(proposal.publishedActivityId).toBe('new-program');
    expect(prisma.activity.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'published', createdBy: 'reviewer', imageUrl: '/event-cover.jpg' }) });
    expect(await syncApprovedActivities()).toBe(0);
    expect(prisma.activity.create).toHaveBeenCalledTimes(1);
  });
  it('publishes an ordinary proposal immediately on approval using the event image and proposal schedule', async () => {
    await request(app).post('/api/partner/event-registrations').set('x-role', 'partner').send(input);
    proposal.managementNotes = '{}';
    const response = await request(app).post(`/api/admin/activity-proposals/${proposalId}/approve`).send({});
    expect(response.status).toBe(200);
    expect(prisma.activity.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      eventId: events[0].id, proposalId, organizationId: 'org', imageUrl: '/event-cover.jpg',
      status: 'published', startAt: new Date(input.startAt), endAt: new Date(input.endAt), locationId: input.locationId,
    }) });
    expect(proposal.publishedActivityId).toBe('new-program');
    expect(prisma.partnerApplication.upsert).not.toHaveBeenCalled();
  });
  it('reuses an existing draft activity when synchronizing an old approval', async () => {
    prisma.activity.findFirst.mockResolvedValue({ id: 'existing-activity', status: 'draft' });
    expect(await publishApprovedProposal(prisma, { id: proposalId, eventId: 'event', managementNotes: '{}' }, { id: 'actor' })).toBe('existing-activity');
    expect(prisma.activity.create).not.toHaveBeenCalled();
    expect(prisma.activity.update).toHaveBeenCalledWith({ where: { id: 'existing-activity' }, data: expect.objectContaining({ status: 'published', imageUrl: '/event-cover.jpg' }) });
  });
  it.each([
    ['approve', 'Sự kiện đăng ký đã được duyệt'],
    ['reject', 'Sự kiện đăng ký không được duyệt'],
    ['request-supplement', 'Sự kiện đăng ký cần bổ sung'],
  ])('sends an accurate %s notification only to the submitting organization', async (action, title) => {
    await request(app).post('/api/partner/event-registrations').set('x-role', 'partner').send(input);
    const response = await request(app).post(`/api/admin/activity-proposals/${proposalId}/${action}`).send({ note: 'Review note' });
    expect(response.status).toBe(200);
    expect(prisma.organizationMember.findMany).toHaveBeenCalledWith({ where: { organizationId: 'org' }, select: { userId: true } });
    expect(prisma.notification.createMany).toHaveBeenCalledExactlyOnceWith({ data: [expect.objectContaining({
      userId: 'partner-user', title, kind: 'event',
      message: expect.stringContaining('Review note'),
      link: action === 'approve' ? `/partner/events?eventId=${events[0].id}` : `/partner/activities/${proposalId}`,
    })] });
  });
  it('reads and marks notifications only for the authenticated account', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    expect((await request(app).get('/api/partner/notifications').set('x-role', 'partner')).status).toBe(200);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'actor' } }));
    expect((await request(app).patch(`/api/partner/notifications/${proposalId}/read`).set('x-role', 'partner')).status).toBe(200);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({ where: { id: proposalId, userId: 'actor' }, data: { isRead: true } });
  });
  it('lists every approved partner event and scopes aggregate reports to those events', async () => {
    const approvedEvents = [{ id: 'approved-event', title: 'Upcoming' }, { id: 'past-event', title: 'Completed' }];
    prisma.event.findMany.mockResolvedValue(approvedEvents);
    prisma.activity.findMany.mockResolvedValue([]);
    prisma.publicEventRegistration.aggregate.mockResolvedValue({ _sum: { attendeesCount: 12 } });
    prisma.feedback.findMany.mockResolvedValue([]);
    prisma.boothAssignment.count.mockResolvedValue(0);
    const response = await request(app).get('/api/partner/reports').set('x-role', 'partner');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ availableEvents: approvedEvents, totalParticipants: 12, eventId: '' });
    expect(prisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isDeleted: false, status: { not: 'draft' }, OR: [
        { applications: { some: { organizationId: 'org', status: 'approved' } } },
        { proposals: { some: { organizationId: 'org', status: 'approved' } } },
      ] },
    }));
    expect(prisma.publicEventRegistration.aggregate).toHaveBeenCalledWith(expect.objectContaining({ where: { eventId: { in: ['approved-event', 'past-event'] } } }));
  });
  it('rejects direct report access to an unapproved or unrelated event', async () => {
    prisma.event.findMany.mockResolvedValue([]);
    const response = await request(app).get(`/api/partner/reports?eventId=${proposalId}`).set('x-role', 'partner');
    expect(response.status).toBe(403);
    expect(prisma.activity.findMany).not.toHaveBeenCalled();
    expect(prisma.publicEventRegistration.aggregate).not.toHaveBeenCalled();
  });
  it('loads the chosen approved event report', async () => {
    prisma.event.findMany.mockResolvedValue([{ id: proposalId, title: 'Approved event' }]);
    prisma.event.findUnique = vi.fn().mockResolvedValue({ id: proposalId, title: 'Approved event' });
    prisma.activity.findMany.mockResolvedValue([]);
    prisma.publicEventRegistration.aggregate.mockResolvedValue({ _sum: { attendeesCount: 3 } });
    prisma.feedback.findMany.mockResolvedValue([]);
    prisma.boothAssignment.count.mockResolvedValue(0);
    const response = await request(app).get(`/api/partner/reports?eventId=${proposalId}`).set('x-role', 'partner');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ eventId: proposalId, eventName: 'Approved event', totalParticipants: 3 });
    expect(prisma.activity.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org', eventId: proposalId } }));
  });
  it('recognizes a booth assigned directly to the account without an event application', async () => {
    prisma.userStallAssignment.findFirst.mockResolvedValue({ stallId: 'my-stall' });
    prisma.booth.findMany.mockResolvedValue([{
      id: 'my-stall', code: 'B01', name: 'Assigned booth', location: { zone: 'A' },
      assignments: [], requests: [], opStatus: 'available',
    }]);
    const response = await request(app).get('/api/partner/booths').set('x-role', 'partner');
    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ id: 'my-stall', status: 'assigned', assignedOrgId: 'org', assignedOrgName: 'Publisher' });
    expect(prisma.partnerApplication.findFirst).not.toHaveBeenCalled();
  });
  it('prefers the current organization when a booth has assignments in several events', async () => {
    prisma.userStallAssignment.findFirst.mockResolvedValue(null);
    prisma.booth.findMany.mockResolvedValue([{
      id: 'my-stall', code: 'B01', location: { zone: 'A' }, requests: [],
      assignments: [
        { organizationId: 'other', organization: { name: 'Other partner' }, event: { title: 'Other event' } },
        { organizationId: 'org', organization: { name: 'Publisher' }, event: { title: 'My event' } },
      ],
    }]);
    const response = await request(app).get('/api/partner/booths').set('x-role', 'partner');
    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ assignedOrgId: 'org', relatedEventTitle: 'My event' });
  });
  it('shows the submitting partner as joined and names the host in the calendar', async () => {
    prisma.event.findMany.mockResolvedValue([{
      id: 'own-event', title: input.title, startAt: new Date(input.startAt), endAt: new Date(input.endAt),
      status: 'published', venue: { name: 'Book Street' }, applications: [],
      proposals: [{ organizationId: 'org', managementNotes: JSON.stringify({ standaloneEvent: true }), organization: { name: 'Publisher' } }],
    }]);
    prisma.activity.findMany.mockResolvedValue([]);
    const response = await request(app).get('/api/partner/schedule').set('x-role', 'partner');
    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ id: 'event:own-event', hostOrgName: 'Publisher', participationStatus: 'approved' });
  });
  it('labels the event owner as organizer and other applicants as participants for admin', async () => {
    const event = { proposals: [{ organizationId: 'org', managementNotes: JSON.stringify({ standaloneEvent: true }) }] };
    prisma.partnerApplication.findMany.mockResolvedValue([
      { id: 'owner', organizationId: 'org', event },
      { id: 'guest', organizationId: 'other-org', event },
    ]);
    const response = await request(app).get('/api/admin/partner-applications');
    expect(response.status).toBe(200);
    expect(response.body.data.map(row => row.participationRole)).toEqual(['organizer', 'participant']);
  });
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
    expect(prisma.partnerApplication.upsert).not.toHaveBeenCalled();
    const approved = await request(app).post(`/api/admin/activity-proposals/${proposalId}/approve`).send({});
    expect(approved.status).toBe(200);
    expect(events[0]).toMatchObject({ status: 'published', visibility: 'public' });
    expect(proposal).toMatchObject({ status: 'approved', publishedActivityId: 'new-program' });
    expect(prisma.partnerApplication.upsert).toHaveBeenCalledExactlyOnceWith({
      where: { eventId_organizationId: { eventId: events[0].id, organizationId: 'org' } },
      create: expect.objectContaining({ eventId: events[0].id, organizationId: 'org', status: 'approved', reviewedBy: 'actor' }),
      update: expect.objectContaining({ status: 'approved', reviewedBy: 'actor' }),
    });
    expect(prisma.activity.create.mock.calls[0][0].data).toMatchObject({ eventId: events[0].id, startAt: new Date(input.startAt), endAt: new Date(input.endAt), status: 'published' });
  });
  it.each([input.startAt, '2026-10-20T09:00:00+07:00'])('rejects end-before-start without writing an event', async endAt => {
    const response = await request(app).post('/api/admin/event-registrations').send({ ...input, endAt });
    expect(response.status).toBe(422);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });
  it('does not enroll a partner when their event is rejected', async () => {
    await request(app).post('/api/partner/event-registrations').set('x-role', 'partner').send(input);
    prisma.organizationMember.findMany = vi.fn().mockResolvedValue([]);
    const response = await request(app).post(`/api/admin/activity-proposals/${proposalId}/reject`).send({});
    expect(response.status).toBe(200);
    expect(prisma.partnerApplication.upsert).not.toHaveBeenCalled();
  });
  it('does not auto-enroll ordinary activity proposals in another event', async () => {
    expect(await publishIndependentRegistration(prisma, { managementNotes: null }, { id: 'actor' })).toBeNull();
    expect(prisma.partnerApplication.upsert).not.toHaveBeenCalled();
  });
  it('ensures participation even when the independent event already has a published activity', async () => {
    await publishIndependentRegistration(prisma, {
      id: proposalId, eventId: 'own-event', organizationId: 'org',
      managementNotes: JSON.stringify({ standaloneEvent: true }), publishedActivityId: 'existing-program',
    }, { id: 'actor' });
    expect(prisma.activity.create).not.toHaveBeenCalled();
    expect(prisma.partnerApplication.upsert).toHaveBeenCalledOnce();
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

it('rejects a partner registration for yesterday in Vietnam before any write', async () => {
  vi.setSystemTime(new Date('2026-10-22T00:01:00+07:00'));
  const response = await request(app).post('/api/partner/event-registrations').set('x-role', 'partner').send(input);
  expect(response.status).toBe(422);
  expect(prisma.event.create).not.toHaveBeenCalled();
});
it('allows partner registration without target audience', async () => {
  const response = await request(app).post('/api/partner/event-registrations').set('x-role', 'partner').send({ ...input, targetAudience: undefined });
  expect(response.status).toBe(200);
  expect(prisma.activityProposal.create).toHaveBeenCalled();
});
