import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Vui lòng cung cấp Access Token hợp lệ');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        code: true,
        email: true,
        fullName: true,
        primaryRole: true,
        status: true,
        isDeleted: true,
        passwordChangedAt: true,
      },
    });

    if (!user || user.isDeleted) {
      throw ApiError.unauthorized('Tài khoản người dùng không tồn tại hoặc đã bị xóa');
    }

    if (user.status === 'locked') {
      throw ApiError.forbidden('Tài khoản của bạn hiện đang bị khóa');
    }
    if (user.status !== 'active' || (user.passwordChangedAt && decoded.passwordVersion !== user.passwordChangedAt.getTime())) {
      throw ApiError.unauthorized('Phiên đăng nhập không còn hiệu lực');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Phiên đăng nhập đã hết hạn. Vui lòng làm mới token'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Token xác thực không hợp lệ'));
    }
    next(error);
  }
};
