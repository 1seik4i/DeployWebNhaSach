import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, statusCode = 422) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) {
      try {
        req.query = parsed.query;
      } catch {
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    }
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    const details = error.errors ? error.errors.map(err => ({
      field: err.path.slice(1).join('.'),
      message: err.message,
    })) : [];
    const validationError = ApiError.validation('Dữ liệu không hợp lệ', details);
    validationError.statusCode = statusCode;
    next(validationError);
  }
};
