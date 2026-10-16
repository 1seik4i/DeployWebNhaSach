import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`🚀 Server running in ${config.nodeEnv} mode at http://localhost:${config.port}`);
  logger.info(`📖 Health check: http://localhost:${config.port}/api/health`);
});

const handleShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
