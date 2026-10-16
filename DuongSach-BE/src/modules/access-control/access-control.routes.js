import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { z } from 'zod';

const router = Router();
const adminOnly = [authenticate, authorize('admin')];

router.get('/roles', ...adminOnly, asyncHandler(async (_req, res) => {
  const roles = await prisma.role.findMany({ include: { rolePerms: { include: { permission: true } } }, orderBy: { code: 'asc' } });
  return ApiResponse.success(res, roles);
}));
router.get('/permissions', ...adminOnly, asyncHandler(async (_req, res) => {
  const permissions = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
  return ApiResponse.success(res, permissions);
}));
router.put('/roles/:id/permissions', ...adminOnly, asyncHandler(async (req, res) => {
  const permissionCodes = Array.isArray(req.body?.permissionCodes) ? [...new Set(req.body.permissionCodes.map(String))] : null;
  if (!permissionCodes) throw ApiError.validation([{ field: 'permissionCodes', message: 'Danh sách quyền không hợp lệ' }]);
  const role = await prisma.role.findFirst({ where: z.string().uuid().safeParse(req.params.id).success ? { id: req.params.id } : { code: req.params.id } });
  if (!role) throw ApiError.notFound('Không tìm thấy vai trò');
  const adminExclusive = ['users.manage', 'roles.manage', 'library.moderate', 'library.taxonomy.manage', 'stalls.manage', 'account.create', 'account.lock'];
  if (role.code !== 'admin' && permissionCodes.some(code => adminExclusive.includes(code))) throw ApiError.forbidden('Không thể cấp quyền độc quyền Admin cho vai trò khác');
  const permissions = await prisma.permission.findMany({ where: { code: { in: permissionCodes } } });
  if (permissions.length !== permissionCodes.length) throw ApiError.validation([{ field: 'permissionCodes', message: 'Có quyền không tồn tại' }]);
  const updated = await prisma.$transaction(async tx => {
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length) await tx.rolePermission.createMany({ data: permissions.map(permission => ({ roleId: role.id, permissionId: permission.id })) });
    return tx.role.findUnique({ where: { id: role.id }, include: { rolePerms: { include: { permission: true } } } });
  });
  return ApiResponse.success(res, updated);
}));

export default router;
