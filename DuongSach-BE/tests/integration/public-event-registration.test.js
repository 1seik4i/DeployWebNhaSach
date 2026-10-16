import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../src/config/database.js';
import { config } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
const app = createApp();
const prefix = `guest-${randomUUID()}`;
let event, internal, expired, partner, admin, org, location, venue, proposal;
const auth = user => `Bearer ${jwt.sign({ userId: user.id }, config.jwt.accessSecret, { expiresIn: '5m' })}`;
const guest = { fullName: 'Khách đăng ký', email: `${prefix}@example.test`, phone: '0901234567', attendeesCount: 1000 };
beforeAll(async () => {
  admin = await prisma.user.create({ data: { fullName: prefix, email: `admin-${prefix}@example.test`, passwordHash: 'unused', primaryRole: 'admin', status: 'active' } });
  partner = await prisma.user.create({ data: { fullName: prefix, email: `partner-${prefix}@example.test`, passwordHash: 'unused', primaryRole: 'partner', status: 'active' } });
  org = await prisma.organization.create({ data: { name: prefix, representativeName: prefix, email: partner.email, phone: '0901234567', members: { create: { userId: partner.id } } } });
  venue = await prisma.venue.create({ data: { name: prefix, facility: prefix, capacity: 10 } });
  location = await prisma.location.create({ data: { name: prefix, code: prefix.slice(0,20), venueId: venue.id, kind: 'main_stage', capacity: 10 } });
  const startAt = new Date(Date.now() + 86400000), endAt = new Date(Date.now() + 2 * 86400000);
  event = await prisma.event.create({ data: { title: prefix, slug: prefix, startAt, endAt, venueId: venue.id, visibility: 'public', status: 'published' } });
  internal = await prisma.event.create({ data: { title: prefix, slug: `${prefix}-internal`, startAt, endAt, visibility: 'internal', status: 'published' } });
  expired = await prisma.event.create({ data: { title: prefix, slug: `${prefix}-expired`, startAt: new Date(Date.now()-2*86400000), endAt: new Date(Date.now()-86400000), visibility: 'public', status: 'published' } });
  proposal = await prisma.activityProposal.create({ data: { title: prefix, kind: 'workshop', eventId: event.id, organizationId: org.id, locationId: location.id, startAt, endAt, capacity: 10, status: 'approved' } });
});
afterAll(async () => {
  const ids = [event?.id, internal?.id, expired?.id].filter(Boolean);
  await prisma.publicEventRegistration.deleteMany({ where: { eventId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { targetId: { in: ids } } });
  if (proposal) await prisma.activityProposal.delete({ where: { id: proposal.id } });
  await prisma.event.deleteMany({ where: { id: { in: ids } } });
  if (location) await prisma.location.delete({ where: { id: location.id } });
  if (venue) await prisma.venue.delete({ where: { id: venue.id } });
  if (org) { await prisma.organizationMember.deleteMany({ where: { organizationId: org.id } }); await prisma.organization.delete({ where: { id: org.id } }); }
  await prisma.notification.deleteMany({ where: { OR: [{ userId: admin?.id }, { message: { contains: prefix } }] } });
  await prisma.user.deleteMany({ where: { id: { in: [admin?.id, partner?.id].filter(Boolean) } } });
  await prisma.$disconnect();
});
describe('public event registration and real participant data', () => {
  it('persists an unlimited group once and returns the same ticket on retries', async () => {
    const responses = await Promise.all([1,2].map(() => request(app).post(`/api/public/events/${event.id}/register`).send(guest)));
    for (const response of responses) expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(responses[0].body.data.registrationCode).toBe(responses[1].body.data.registrationCode);
    expect(await prisma.publicEventRegistration.count({ where: { eventId: event.id } })).toBe(1);
  });
  it('shows the guests and actual group size to the owning partner and report', async () => {
    const people = await request(app).get(`/api/partner/activity-proposals/${proposal.id}/participants`).set('Authorization', auth(partner));
    expect(people.status, JSON.stringify(people.body)).toBe(200);
    expect(people.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ fullName: guest.fullName, attendeesCount: 1000 })]));
    const report = await request(app).get(`/api/admin/reports?eventId=${event.id}`).set('Authorization', auth(admin));
    expect(report.status, JSON.stringify(report.body)).toBe(200);
    expect(report.body.data.totalParticipants).toBe(1000);
  });
  it('rejects invalid counts, internal and ended events', async () => {
    expect((await request(app).post(`/api/public/events/${event.id}/register`).send({ ...guest, attendeesCount: -1 })).status).toBe(422);
    expect((await request(app).post('/api/public/events/invalid-id/register').send(guest)).status).toBe(422);
    for (const id of [internal.id, expired.id]) expect((await request(app).post(`/api/public/events/${id}/register`).send(guest)).status).toBe(409);
  });
  it('rejects admin creation on a past Vietnam day', async () => {
    const response = await request(app).post('/api/admin/events').set('Authorization', auth(admin)).send({ title: prefix, startAt: new Date(Date.now()-2*86400000).toISOString(), endAt: new Date(Date.now()-86400000).toISOString() });
    expect(response.status, JSON.stringify(response.body)).toBe(422);
  });
});
