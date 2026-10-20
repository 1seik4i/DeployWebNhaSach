import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../src/config/database.js', () => {
  const prisma = {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    organizationMember: { findFirst: vi.fn() },
    organization: { update: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  prisma.$transaction = vi.fn(callback => callback(prisma));
  return { prisma };
});
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => { req.user = { id: 'current-user', primaryRole: req.headers['x-test-role'] || 'partner' }; next(); } }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: (...roles) => (req, res, next) => roles.includes(req.user.primaryRole) ? next() : res.sendStatus(403) }));
import { prisma } from '../src/config/database.js';
import profiles from '../src/modules/account/account.routes.js';
import accounts from '../src/modules/account/management.routes.js';

const app = express();
app.use(express.json());
app.use('/api', profiles, accounts);
app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
beforeEach(() => {
  vi.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue({ id: 'current-user', primaryRole: 'partner', email: 'old@example.test' });
  prisma.user.findFirst.mockResolvedValue(null);
  prisma.user.update.mockResolvedValue({ id: 'current-user', email: 'new@example.test' });
  prisma.organizationMember.findFirst.mockResolvedValue({ organization: { id: 'organization' } });
  prisma.organization.update.mockResolvedValue({ id: 'organization', name: 'Updated name' });
});

describe('email editing permissions', () => {
  it('shows the admin-managed account email instead of stale organization contact email', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'current-user', primaryRole: 'partner', email: 'new@example.test' });
    prisma.organizationMember.findFirst.mockResolvedValue({ organization: { id: 'organization', email: 'stale@example.test' } });
    const response = await request(app).get('/api/partner/profile');
    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('new@example.test');
  });
  it('blocks partner email changes at the profile API', async () => {
    expect((await request(app).patch('/api/partner/profile').send({ email: 'new@example.test' })).status).toBe(403);
    expect(prisma.organization.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('allows a partner organization contact landline', async () => {
    const response = await request(app).patch('/api/partner/profile').send({ phone: '(028) 3829 5123' });
    expect(response.status).toBe(200);
    expect(prisma.organization.update).toHaveBeenCalledWith(expect.objectContaining({ data: { phone: '02838295123' } }));
  });
  it('continues to allow partner edits to other profile fields', async () => {
    const response = await request(app).patch('/api/partner/profile').send({ name: 'Updated name' });
    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('old@example.test');
    expect(prisma.organization.update).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Updated name' } }));
  });
  it('allows admins to edit an account email', async () => {
    const response = await request(app).patch('/api/admin/users/00000000-0000-4000-8000-000000000001').set('x-test-role', 'admin').send({ email: 'new@example.test' });
    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { email: 'new@example.test' } }));
    expect(prisma.organization.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { members: { some: { userId: '00000000-0000-4000-8000-000000000001', roleInOrg: 'owner' } }, isDeleted: false },
      data: { email: 'new@example.test' },
    }));
  });
  it('denies partner access to the admin email edit endpoint', async () => {
    expect((await request(app).patch('/api/admin/users/00000000-0000-4000-8000-000000000001').send({ email: 'new@example.test' })).status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('rejects invalid email from admin', async () => {
    expect((await request(app).patch('/api/admin/users/00000000-0000-4000-8000-000000000001').set('x-test-role', 'admin').send({ email: 'invalid' })).status).toBe(422);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
