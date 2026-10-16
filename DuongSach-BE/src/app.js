import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';
import { ApiResponse } from './utils/ApiResponse.js';
import routes from './routes/index.js';
import { swaggerDocument, swaggerMiddleware } from './docs/swagger.js';

export const createApp = () => {
  const app = express();

  // Basic security and performance middlewares
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (curl, mobile app, cùng origin qua proxy)
      if (!origin || config.nodeEnv === 'development') {
        return callback(null, true);
      }
      // Nếu cấu hình '*' hoặc origin nằm trong danh sách CORS_ORIGINS
      const allowedOrigins = config.corsOrigins.map(o => o.trim());
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      callback(new Error('Blocked by CORS'));
    },
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Tạm thời không áp dụng rate limit trong giai đoạn kiểm thử.

  // Render probes the service root by default. Respond here so GET / and HEAD /
  // are valid health probes instead of producing noisy 404 logs.
  app.get('/', (_req, res) => {
    ApiResponse.success(res, {
      status: 'healthy',
      service: 'Book Street Event Management API',
      healthCheck: '/api/health',
      docs: '/api/docs',
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    ApiResponse.success(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Book Street Event Management API',
      version: '2.0.0',
    });
  });

  app.get('/api/openapi.json', (_req, res) => res.json(swaggerDocument));
  app.use('/api/docs', swaggerMiddleware);

  // Main API Router
  app.use('/api', routes);

  // 404 & Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
