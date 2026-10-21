import { beforeEach, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
vi.mock('../src/config/database.js', () => ({ prisma: {
  user: { findFirst: vi.fn(), update: vi.fn() }, setting: { findUnique: vi.fn() },
  refreshToken: { create: vi.fn() },
} }));
import { prisma } from '../src/config/database.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { loginSchema, resetPasswordSchema } from '../src/modules/auth/auth.validation.js';
import { validatePassword } from '../src/modules/auth/security-policy.js';
beforeEach(() => { vi.clearAllMocks(); prisma.setting.findUnique.mockResolvedValue(null); });
it('TC24: rejects legacy six-character login and reset passwords', async () => {
  expect(loginSchema.safeParse({ body: { email: 'demo', password: '123456' } }).success).toBe(false);
  expect(resetPasswordSchema.safeParse({ body: { token: 'token', newPassword: '123456' } }).success).toBe(false);
  await expect(AuthService.login({ email: 'demo', password: '123456' })).rejects.toMatchObject({ statusCode: 422 });
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
});
it('TC24: a stored configuration cannot weaken the eight-character minimum', async () => {
  prisma.setting.findUnique.mockResolvedValue({ value: { security: { minPasswordLength: 6 } } });
  await expect(validatePassword('123456')).rejects.toMatchObject({ statusCode: 422 });
});
it('TC25: successful login persists and returns the new timestamp', async () => {
  const user = { id: 'user', email: 'demo@example.com', primaryRole: 'admin', status: 'active', passwordHash: await bcrypt.hash('Demo2026!', 4), lastActiveAt: new Date('2020-01-01') };
  prisma.user.findFirst.mockResolvedValue(user);
  prisma.user.update.mockImplementation(async ({ data }) => ({ ...user, ...data }));
  const before = Date.now();
  const result = await AuthService.login({ email: user.email, password: 'Demo2026!' });
  expect(result.user.lastActiveAt.getTime()).toBeGreaterThanOrEqual(before);
  expect(result.user.lastActiveAt).toEqual(prisma.user.update.mock.calls[0][0].data.lastActiveAt);
});
