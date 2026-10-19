import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../../src/config/database.js';
import { config } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';

const app = createApp();
let admin;
let partnerId;
let token;
const email = `partner-${crypto.randomUUID()}@example.test`;
const call = (method, path, body) => request(app)[method](`/api/admin/users${path}`)
  .set('Authorization', `Bearer ${token}`).send(body);

describe('admin partner contact validation', () => {
  beforeAll(async () => {
    admin = await prisma.user.create({ data: {
      fullName: 'Test Admin', email: `admin-${crypto.randomUUID()}@example.test`,
      passwordHash: await bcrypt.hash('Test-pass-123!', 4), primaryRole: 'admin', status: 'active',
    } });
    token = jwt.sign({ userId: admin.id }, config.jwt.accessSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    if (admin) await prisma.auditLog.deleteMany({ where: { actorId: admin.id } });
    if (partnerId) {
      await prisma.organizationMember.deleteMany({ where: { userId: partnerId } });
      await prisma.organization.deleteMany({ where: { email: { in: [email, `updated-${email}`] } } });
      await prisma.userRoleAssignment.deleteMany({ where: { userId: partnerId } });
      await prisma.user.delete({ where: { id: partnerId } });
    }
    if (admin) await prisma.user.delete({ where: { id: admin.id } });
  });

  it('rejects malformed contact fields and creates a partner with a generated UUID', async () => {
    const invalid = await call('post', '', { fullName: '1234', email, phone: '123', role: 'partner', password: 'Test-pass-123!' });
    expect(invalid.status).toBe(422);
    const created = await call('post', '', { fullName: 'Nguyễn Văn An', email, phone: '0912 345 678', role: 'partner', password: 'Test-pass-123!' });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    partnerId = created.body.data.id;
    expect(partnerId).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.body.data.code).toBeNull();
    expect(created.body.data.phone).toBe('0912345678');
  });

  it('updates the login email and linked organization contact together', async () => {
    const bad = await call('patch', `/${partnerId}`, { email: 'bad-email', phone: '123' });
    expect(bad.status).toBe(422);
    const updated = await call('patch', `/${partnerId}`, { email: `updated-${email}`, phone: '0987654321' });
    expect(updated.status, JSON.stringify(updated.body)).toBe(200);
    const user = await prisma.user.findUnique({ where: { id: partnerId } });
    const organization = await prisma.organization.findFirst({ where: { members: { some: { userId: partnerId } } } });
    expect(user.email).toBe(`updated-${email}`);
    expect(organization.email).toBe(user.email);
    expect(organization.phone).toBe('0987654321');
  });
  it.each(['/admin/events', '/admin/proposals', '/admin/venues', '/admin/assets'])(
    'rejects malformed pagination on %s', async path => {
      for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=2abc', 'limit=101', 'limit=abc', 'page=1&page=2']) {
        const response = await request(app).get(`/api${path}?${query}`).set('Authorization', `Bearer ${token}`);
        expect(response.status, `${path}?${query}: ${JSON.stringify(response.body)}`).toBe(422);
      }
      const valid = await request(app).get(`/api${path}?page=1&limit=10`).set('Authorization', `Bearer ${token}`);
      expect(valid.status, JSON.stringify(valid.body)).toBe(200);
    });

  it('validates query length and trims whitespace consistently', async () => {
    for (const path of ['/admin/users', '/admin/events', '/admin/venues']) {
      const bad = await request(app).get(`/api${path}`).query({ search: 'x'.repeat(201) }).set('Authorization', `Bearer ${token}`);
      expect(bad.status, path).toBe(422);
      const empty = await request(app).get(`/api${path}`).query({ search: '   ' }).set('Authorization', `Bearer ${token}`);
      expect(empty.status, JSON.stringify(empty.body)).toBe(200);
    }
  });

  it('rejects malformed visit statistics filters', async () => {
    for (const query of ['year=2026abc', 'month=1.5', 'month=0', 'month=13', 'year=2026&year=2027']) {
      const result = await request(app).get(`/api/admin/visit-stats?${query}`).set('Authorization', `Bearer ${token}`);
      expect(result.status, `${query}: ${JSON.stringify(result.body)}`).toBe(422);
    }
    const valid = await request(app).get('/api/admin/visit-stats?year=2026&month=10').set('Authorization', `Bearer ${token}`);
    expect(valid.status, JSON.stringify(valid.body)).toBe(200);
  });

  it('rejects invalid venue coordinates/capacity before writing', async () => {
    for (const fields of [{ capacity: -1 }, { capacity: 1.5 }, { capacity: '10' }, { x: 101 }, { y: -1 }]) {
      const result = await request(app).post('/api/admin/venues').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Validation venue', code: 'VAL', campus: 'Main', capacity: 20, ...fields });
      expect(result.status, JSON.stringify(result.body)).toBe(422);
    }
  });

  it('rejects incorrect profile types and persists department', async () => {
    for (const fields of [{ fullName: 123 }, { emailNotifications: 'false' }, { avatarUrl: 'javascript:alert(1)' }, { department: 'x'.repeat(201) }]) {
      const result = await request(app).patch('/api/admin/profile').set('Authorization', `Bearer ${token}`).send(fields);
      expect(result.status, JSON.stringify(result.body)).toBe(422);
    }
    const valid = await request(app).patch('/api/admin/profile').set('Authorization', `Bearer ${token}`).send({ department: ' Operations ', emailNotifications: false });
    expect(valid.status, JSON.stringify(valid.body)).toBe(200);
    expect(valid.body.data.department).toBe('Operations');
    expect((await prisma.user.findUnique({ where: { id: admin.id } })).emailNotifications).toBe(false);
  });

  it('rejects invalid settings and article calendar dates', async () => {
    const badSettings = await request(app).put('/api/admin/settings').set('Authorization', `Bearer ${token}`)
      .send({ 'admin.system': { security: { minPasswordLength: 7, requireSpecialChar: true, maxFailedAttempts: 3, sessionTimeoutMinutes: 121, twoFactorEnabled: false } } });
    expect(badSettings.status).toBe(422);
    const badArticle = await request(app).post('/api/admin/content').set('Authorization', `Bearer ${token}`)
      .send({ slug: 'invalid-test', kind: 'news', title: 'Test', status: 'draft', data: { articles: [{ id: '1', titleVi: 'Title', publishedDate: '31/02/2026' }] } });
    expect(badArticle.status, JSON.stringify(badArticle.body)).toBe(422);
  });

});
