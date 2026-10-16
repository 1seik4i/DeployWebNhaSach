import { prisma } from '../../config/database.js';
import { config } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { AuthService } from './auth.service.js';

const roleCodes = {
  partner: 'USR-PARTNER-01',
  admin: 'USR-ADMIN-01',
};
const enabled = () => process.env.DEMO_QUICK_LOGIN === 'true'
  || (config.nodeEnv !== 'production' && process.env.DEMO_QUICK_LOGIN !== 'false');

export const QuickLoginService = {
  async listAccounts() {
    if (!enabled()) return [];
    const users = await prisma.user.findMany({
      where: { code: { in: Object.values(roleCodes) }, status: 'active', isDeleted: false },
      select: { code: true, primaryRole: true, email: true },
    });
    return Object.entries(roleCodes).flatMap(([role, code]) => {
      const user = users.find(item => item.code === code && item.primaryRole === role);
      return user ? [{ role, email: user.email }] : [];
    });
  },

  async login(roleInput) {
    if (!enabled()) throw ApiError.notFound('Đăng nhập nhanh không khả dụng');
    const role = String(roleInput || '');
    const code = roleCodes[role];
    if (!code) throw ApiError.validation([{ field: 'role', message: 'Vai trò đăng nhập nhanh không hợp lệ' }]);
    const user = await prisma.user.findFirst({
      where: { code, primaryRole: role, status: 'active', isDeleted: false },
    });
    if (!user) throw ApiError.notFound('Tài khoản đăng nhập nhanh chưa có trong database');
    return AuthService.login({ email: user.email, password: '123456' });
  },
};
