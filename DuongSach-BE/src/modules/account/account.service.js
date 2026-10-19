import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { organization, parse } from '../../utils/contract.js';
import { z } from 'zod';

const profileSelect = {
  id: true, code: true, fullName: true, email: true, phone: true, primaryRole: true,
  avatarUrl: true, totalPoints: true, emailNotifications: true, lastActiveAt: true,
};

export const AccountService = {
  async getProfile(userId) {
    const user = await prisma.user.findFirst({ where: { id: userId, isDeleted: false }, select: profileSelect });
    if (!user) throw ApiError.notFound('Không tìm thấy tài khoản');
    if (user.primaryRole === 'partner') {
      const member = await prisma.organizationMember.findFirst({ where: { userId, organization: { isDeleted: false } }, include: { organization: true } });
      if (member) return { ...user, ...member.organization, email: user.email, userId: user.id, primaryRole: user.primaryRole };
    }
    return user;
  },

  async updateProfile(userId, input) {
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (current?.primaryRole === 'partner') {
      if (Object.prototype.hasOwnProperty.call(input, 'email')) {
        throw ApiError.forbidden('Chỉ Admin được thay đổi email của đối tác.');
      }
      const org = await organization(userId);
      const data = parse(z.object({ name: z.string().trim().min(1).max(200).optional(), representativeName: z.string().trim().min(1).max(160).optional(), fullName: z.string().trim().min(1).max(160).optional(), shortDesc: z.string().max(5000).optional(), email: z.string().email().optional(), phone: z.string().max(20).optional(), address: z.string().max(1000).optional(), website: z.string().url().or(z.literal('')).optional(), logoUrl: z.string().max(2000).optional(), avatarUrl: z.string().max(2000).optional(), categories: z.array(z.string().max(100)).max(50).optional() }).strict(), input);
      const { fullName, avatarUrl, ...fields } = data;
      const updated = await prisma.organization.update({ where: { id: org.id }, data: { ...fields, ...(fullName ? { representativeName: fullName } : {}), ...(avatarUrl ? { logoUrl: avatarUrl } : {}) } });
      return { ...updated, email: current.email };
    }
    const data = {};
    if (input.fullName !== undefined) {
      const fullName = String(input.fullName).trim();
      if (fullName.length < 2 || fullName.length > 160) throw ApiError.validation([{ field: 'fullName', message: 'Họ tên phải có từ 2 đến 160 ký tự' }]);
      data.fullName = fullName;
    }
    if (input.email !== undefined) {
      const email = String(input.email).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw ApiError.validation([{ field: 'email', message: 'Email không hợp lệ' }]);
      const duplicate = await prisma.user.findFirst({ where: { email, id: { not: userId } } });
      if (duplicate) throw ApiError.conflict('Email đã được sử dụng bởi tài khoản khác');
      data.email = email;
    }
    if (input.phone !== undefined) data.phone = input.phone ? String(input.phone).trim().slice(0, 20) : null;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl ? String(input.avatarUrl).trim() : null;
    if (input.emailNotifications !== undefined) data.emailNotifications = Boolean(input.emailNotifications);
    if (!Object.keys(data).length) throw ApiError.validation([{ field: 'profile', message: 'Chưa có thông tin cần cập nhật' }]);
    return prisma.user.update({ where: { id: userId }, data, select: profileSelect });
  },
};
