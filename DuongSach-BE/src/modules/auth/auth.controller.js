import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { prisma } from '../../config/database.js';

export class AuthController {
  static login = async (req, res) => {
    const result = await AuthService.login(req.body, req.ip);
    return ApiResponse.success(res, result);
  };

  static refresh = async (req, res) => {
    const result = await AuthService.refreshToken(req.body.refreshToken);
    return ApiResponse.success(res, result);
  };

  static logout = async (req, res) => {
    await AuthService.logout(req.body.refreshToken);
    return ApiResponse.success(res, { message: 'Đăng xuất thành công' });
  };

  static me = async (req, res) => {
    const [user, assignment, role] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      prisma.userStallAssignment.findUnique({ where: { userId: req.user.id }, include: { stall: true } }),
      prisma.role.findUnique({ where: { code: req.user.primaryRole }, include: { rolePerms: { include: { permission: true } } } }),
    ]);
    return ApiResponse.success(res, { user: { ...AuthService.mapUser(user), assignedStall: assignment?.stall || null, permissions: role?.rolePerms.map(r => r.permission.code) || [] } });
  };

  static forgotPassword = async (req, res) => {
    const result = await AuthService.forgotPassword(req.body.email);
    return ApiResponse.success(res, result);
  };

  static verifyResetToken = async (req, res) => {
    const result = await AuthService.verifyResetToken(req.query.token);
    return ApiResponse.success(res, result);
  };

  static resetPassword = async (req, res) => {
    const result = await AuthService.resetPassword(req.body);
    return ApiResponse.success(res, result);
  };
}
