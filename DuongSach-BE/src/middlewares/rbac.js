import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';

export const requirePermission = code => async (req, _res, next) => {
  try {
    if (req.user?.primaryRole === 'admin') return next();
    const role = await prisma.role.findUnique({ where: { code: req.user.primaryRole }, include: { rolePerms: { include: { permission: true } } } });
    if (!role?.rolePerms.some(row => row.permission.code === code)) throw ApiError.forbidden('Tài khoản chưa được cấp quyền ' + code);
    next();
  } catch (error) { next(error); }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Bạn chưa đăng nhập'));
    }

    if (!allowedRoles.includes(req.user.primaryRole)) {
      return next(ApiError.forbidden(`Vai trò '${req.user.primaryRole}' không được phép truy cập chức năng này`));
    }

    next();
  };
};
