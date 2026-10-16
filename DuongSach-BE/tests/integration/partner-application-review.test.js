import { afterAll, beforeAll, expect, it } from 'vitest';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { config } from '../../src/config/env.js';

const app = createApp();
const prefix = `review-${crypto.randomUUID()}`;
let admin, partner, org, event, approved, rejected, server;
const call = async (method, path, user, body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method: method.toUpperCase(), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: user.id }, config.jwt.accessSecret, { expiresIn: '1h' })}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
};
beforeAll(async () => {
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  for (const role of ['admin', 'partner']) {
    const user = await prisma.user.create({ data: { fullName: prefix, email: `${role}-${prefix}@example.test`, primaryRole: role, status: 'active', passwordHash: 'unused' } });
    if (role === 'admin') admin = user; else partner = user;
  }
  org = await prisma.organization.create({ data: { name: prefix, representativeName: prefix, email: partner.email, phone: '0901234567', members: { create: { userId: partner.id } } } });
  event = await prisma.event.create({ data: { title: prefix, slug: prefix, startAt: new Date(), endAt: new Date(Date.now() + 86400000), status: 'published' } });
  approved = await prisma.partnerApplication.create({ data: { eventId: event.id, organizationId: org.id, status: 'submitted', submittedAt: new Date() } });
});
afterAll(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (event) {
    await prisma.partnerApplication.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  }
  if (org) {
    await prisma.organizationMember.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  }
  const ids = [admin?.id, partner?.id].filter(Boolean);
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});
it('loads actual applications, restricts reviews and persists approval exactly once', async () => {
  const list = await call('get', `/admin/partner-applications?eventId=${event.id}`, admin);
  expect(list.status).toBe(200);
  expect(list.body.data[0]).toMatchObject({ id: approved.id, organization: { name: prefix }, event: { title: prefix } });
  expect((await call('post', `/admin/partner-applications/${approved.id}/approve`, partner, {})).status).toBe(403);
  expect((await call('post', `/admin/partner-applications/${approved.id}/approve`, admin, {})).status).toBe(200);
  expect((await prisma.partnerApplication.findUnique({ where: { id: approved.id } })).status).toBe('approved');
  expect((await call('post', `/admin/partner-applications/${approved.id}/approve`, admin, {})).status).toBe(409);
  expect(await prisma.notification.count({ where: { userId: partner.id, title: 'Kết quả đăng ký sự kiện' } })).toBe(1);
});
it('requires a rejection reason and stores it with the reviewer', async () => {
  await prisma.partnerApplication.delete({ where: { id: approved.id } });
  rejected = await prisma.partnerApplication.create({ data: { eventId: event.id, organizationId: org.id, status: 'submitted', submittedAt: new Date() } });
  expect((await call('post', `/admin/partner-applications/${rejected.id}/reject`, admin, { note: ' ' })).status).toBe(422);
  expect((await call('post', `/admin/partner-applications/${rejected.id}/reject`, admin, { note: 'Hồ sơ thiếu thông tin' })).status).toBe(200);
  expect(await prisma.partnerApplication.findUnique({ where: { id: rejected.id } })).toMatchObject({ status: 'rejected', reviewNote: 'Hồ sơ thiếu thông tin', reviewedBy: admin.id });
});
