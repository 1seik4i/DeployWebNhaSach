import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

// Keep database diagnostics in server logs, using the existing response envelope.
export const heritageFeedbackErrors = (error, req, res, next) => {
  if (error instanceof ApiError) return next(error);
  if (error.code === 'P2002') return next(ApiError.conflict('Slug hoặc mã di sản đã tồn tại'));
  if (error.code === 'P2025') return next(ApiError.notFound());
  logger.error({ err: error, path: req.path }, 'Heritage/Feedback request failed');
  return next(ApiError.internal());
};
