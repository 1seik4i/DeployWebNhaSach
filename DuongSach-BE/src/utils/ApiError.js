export class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = []) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static validation(messageOrDetails = 'Dữ liệu không hợp lệ', details = []) {
    if (Array.isArray(messageOrDetails)) {
      return new ApiError(422, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', messageOrDetails);
    }
    return new ApiError(422, messageOrDetails, 'VALIDATION_ERROR', details);
  }

  static unauthorized(message = 'Không có quyền truy cập') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Truy cập bị từ chối') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Không tìm thấy tài nguyên') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static internal(message = 'Lỗi hệ thống máy chủ') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}
