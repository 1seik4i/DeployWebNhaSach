import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const errorHandler = (err, req, res, _next) => {
  if (err.code === 'P2002' || err.code === 'P2034') return ApiResponse.error(res, ApiError.conflict('Dữ liệu trùng hoặc đã được thay đổi; vui lòng tải lại'));
  if (err.code === 'P2025') return ApiResponse.error(res, ApiError.notFound());
  if (err.code === 'P2003') return ApiResponse.error(res, ApiError.conflict('Dữ liệu tham chiếu không hợp lệ hoặc đang được sử dụng'));
  if (err instanceof ApiError) {
    logger.warn({ err, path: req.path, method: req.method }, `ApiError: ${err.message}`);
    return ApiResponse.error(res, err);
  }

  // Bắt lỗi Postgres 23P01 (exclusion_violation)
  if (err.code === '23P01' || err?.meta?.code === '23P01') {
    const apiErr = ApiError.conflict(
      'Gian hàng này đã được giữ chỗ hoặc phân bổ trong khoảng thời gian diễn ra sự kiện',
      'BOOTH_HOLD_CONFLICT'
    );
    logger.warn({ err, path: req.path }, `Exclusion constraint violated: ${apiErr.code}`);
    return ApiResponse.error(res, apiErr);
  }

  // Bắt lỗi trigger bất biến slug di sản (SLUG_IMMUTABLE - 23514)
  if (err.message?.includes('SLUG_IMMUTABLE')) {
    const apiErr = ApiError.badRequest('Slug di sản là định danh cố định không thể thay đổi', 'SLUG_IMMUTABLE');
    return ApiResponse.error(res, apiErr);
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled Exception');
  return ApiResponse.error(res, new ApiError(500, err.message || 'Lỗi hệ thống máy chủ', 'INTERNAL_ERROR'));
};

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}`));
};
