import { beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';

vi.mock('../src/config/database.js', () => {
  const prisma = {
    user: { findFirst: vi.fn(), update: vi.fn() },
    setting: { findUnique: vi.fn() },
    passwordReset: { updateMany: vi.fn(), create: vi.fn() },
    refreshToken: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  prisma.$transaction = vi.fn(fn => fn(prisma));
  return { prisma };
});
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (r, s, next) => {
  if (!r.headers['x-test-role']) return s.sendStatus(401);
  r.user = { id: 'admin', primaryRole: r.headers['x-test-role'] }; next();
} }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: (...roles) => (r, s, next) => roles.includes(r.user.primaryRole) ? next() : s.sendStatus(403) }));
import { prisma } from '../src/config/database.js';
import accounts from '../src/modules/account/management.routes.js';
const app = express();
app.use(express.json(), accounts);
app.use((err, r, s, next) => s.status(err.statusCode || 500).json({ message: err.message }));
const id = '00000000-0000-4000-8000-000000000001';
const path = `/admin/users/${id}/password`;
beforeEach(() => {
  vi.clearAllMocks();
  prisma.setting.findUnique.mockResolvedValue(null);
  prisma.user.findFirst.mockResolvedValue({ id });
});
it('saves a usable hash and invalidates prior sessions and reset tokens without exposing the password', async () => {
  const response = await request(app).post(path).set('x-test-role', 'admin').send({ newPassword: 'New-password42!' });
  expect(response.status).toBe(200);
  const update = prisma.user.update.mock.calls[0][0];
  expect(await bcrypt.compare('New-password42!', update.data.passwordHash)).toBe(true);
  expect(update.data.passwordChangedAt).toBeInstanceOf(Date);
  expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: id, revokedAt: null } }));
  expect(prisma.passwordReset.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: id, usedAt: null } }));
  expect(prisma.passwordReset.create).not.toHaveBeenCalled();
  expect(JSON.stringify(response.body)).not.toContain('New-password42!');
  expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain('New-password42!');
});
it('requires admin authentication', async () => {
  expect((await request(app).post(path).send({ newPassword: 'New-password42!' })).status).toBe(401);
  expect((await request(app).post(path).set('x-test-role', 'partner').send({ newPassword: 'New-password42!' })).status).toBe(403);
  expect(prisma.user.update).not.toHaveBeenCalled();
});
it('rejects missing, short, and multibyte oversized passwords', async () => {
  for (const body of [{}, { newPassword: 'short' }, { newPassword: 'ệ'.repeat(25) }]) {
    expect((await request(app).post(path).set('x-test-role', 'admin').send(body)).status).toBe(422);
  }
  expect(prisma.user.update).not.toHaveBeenCalled();
});
it('enforces configured password policy', async () => {
  prisma.setting.findUnique.mockResolvedValue({ value: { security: { minPasswordLength: 12, requireSpecialChar: true } } });
  expect((await request(app).post(path).set('x-test-role', 'admin').send({ newPassword: 'abcdefghijkl' })).status).toBe(422);
  expect(prisma.user.update).not.toHaveBeenCalled();
});
it('rejects a missing or deleted account', async () => {
  prisma.user.findFirst.mockResolvedValue(null);
  expect((await request(app).post(path).set('x-test-role', 'admin').send({ newPassword: 'New-password42!' })).status).toBe(404);
  expect(prisma.user.update).not.toHaveBeenCalled();
});
