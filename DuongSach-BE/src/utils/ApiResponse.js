export class ApiResponse {
  static success(res, data = {}, meta = null, warnings = [], statusCode = 200) {
    const response = {
      success: true,
      data,
    };
    if (meta) {
      response.meta = meta;
      response.pagination = meta;
    }
    response.warnings = warnings;
    return res.status(statusCode).json(response);
  }

  static error(res, error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Lỗi máy chủ nội bộ',
        details: error.details || [],
      },
    });
  }
}
