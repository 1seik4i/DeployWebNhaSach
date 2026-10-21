import { beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
vi.mock('../src/config/database.js', () => ({ prisma: {
  organizationMember: { findFirst: vi.fn() }, activityProposal: { findFirst: vi.fn(), findMany: vi.fn() },
  activityRegistration: { findMany: vi.fn() }, eventRegistration: { findMany: vi.fn() }, publicEventRegistration: { findMany: vi.fn() },
} }));
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => { req.user = { id: 'user', primaryRole: 'partner' }; next(); } }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: () => (req, res, next) => next(), requirePermission: () => (req, res, next) => next() }));
import { prisma } from '../src/config/database.js';
import routes from '../src/modules/event/operations.routes.js';
const app = express(); app.use(express.json(), routes);
app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
const id = '00000000-0000-4000-8000-000000000001';
beforeEach(() => {
  vi.clearAllMocks();
  prisma.organizationMember.findFirst.mockResolvedValue({ organization: { id: 'org' } });
  prisma.activityRegistration.findMany.mockResolvedValue([]);
});
it.each(['pending', 'rejected', 'need_revision', 'withdrawn'])('TC12: %s proposals have no participants', async status => {
  prisma.activityProposal.findFirst.mockResolvedValue({ id, eventId: 'event', status });
  const response = await request(app).get(`/partner/activity-proposals/${id}/participants`);
  expect(response.status).toBe(200); expect(response.body.data).toEqual([]);
  expect(prisma.eventRegistration.findMany).not.toHaveBeenCalled();
  expect(prisma.publicEventRegistration.findMany).not.toHaveBeenCalled();
  expect(prisma.activityRegistration.findMany).not.toHaveBeenCalled();
});
it('does not attach parent event registrations to an ordinary approved proposal', async () => {
  prisma.activityProposal.findFirst.mockResolvedValue({ id, eventId: 'event', status: 'approved' });
  const response = await request(app).get(`/partner/activity-proposals/${id}/participants`);
  expect(response.status).toBe(200); expect(response.body.data).toEqual([]);
  expect(prisma.eventRegistration.findMany).not.toHaveBeenCalled();
  expect(prisma.publicEventRegistration.findMany).not.toHaveBeenCalled();
});
it('TC12: rejected proposal summary reports zero even if its event has registrations', async () => {
  prisma.activityProposal.findMany.mockResolvedValue([{ id, status: 'rejected', event: { registrations: [{ id: 'other' }], publicRegistrations: [{ attendeesCount: 5 }] } }]);
  const response = await request(app).get('/partner/activity-proposals');
  expect(response.status).toBe(200); expect(response.body.data[0].registeredCount).toBe(0);
});
