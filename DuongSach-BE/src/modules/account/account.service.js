import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { organization, parse } from '../../utils/contract.js';
import { z } from 'zod';
import { imageSource, supportPhone, webUrl } from '../../utils/input.validation.js';
const validName = z.string().trim().min(2).max(160).regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u);
const validPhone = z.string().trim().transform(value => value.replace(/[\s.-]/g, '')).pipe(z.string().regex(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/));

const profileSelect = {
  id: true, code: true, fullName: true, email: true, phone: true, primaryRole: true,
  department: true, avatarUrl: true, totalPoints: true, emailNotifications: true, lastActiveAt: true,
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
      const data = parse(z.object({ name: z.string().trim().min(2).max(200).optional(), representativeName: validName.optional(), fullName: validName.optional(), shortDesc: z.string().max(5000).optional(), email: z.string().trim().email().max(200).optional(), phone: supportPhone.optional(), address: z.string().max(1000).optional(), website: webUrl.or(z.literal('')).optional(), logoUrl: imageSource.optional(), avatarUrl: imageSource.optional(), categories: z.array(z.string().max(100)).max(50).optional() }).strict(), input);
      const { fullName, avatarUrl, ...fields } = data;
      const updated = await prisma.organization.update({ where: { id: org.id }, data: { ...fields, ...(fullName ? { representativeName: fullName } : {}), ...(avatarUrl ? { logoUrl: avatarUrl } : {}) } });
      return { ...updated, email: current.email };
    }
    const fields = parse(z.object({
      fullName: validName.optional(),
      email: z.string().trim().toLowerCase().email().max(200).optional(),
      phone: validPhone.or(z.literal('')).optional(),
      department: z.string().trim().max(200).optional(),
      avatarUrl: imageSource.optional(),
      emailNotifications: z.boolean().optional(),
    }).strict(), input);
    const data = { ...fields };
    if (fields.email !== undefined) {
      const duplicate = await prisma.user.findFirst({ where: { email: fields.email, id: { not: userId } } });
      if (duplicate) throw ApiError.conflict('Email đã được sử dụng bởi tài khoản khác');
    }
    if (fields.phone === '') data.phone = null;
    if (fields.avatarUrl === '') data.avatarUrl = null;
    if (!Object.keys(data).length) throw ApiError.validation([{ field: 'profile', message: 'Chưa có thông tin cần cập nhật' }]);
    return prisma.user.update({ where: { id: userId }, data, select: profileSelect });
  },
};
