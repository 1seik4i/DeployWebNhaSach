import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

// Never make a deployed instance predictable when configuration is missing.
if (nodeEnv === 'production' && (!accessSecret || !refreshSecret)) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production');
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    accessSecret: accessSecret || 'development-only-access-secret',
    refreshSecret: refreshSecret || 'development-only-refresh-secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'http://localhost:5173',
  publicWebUrl: process.env.PUBLIC_WEB_URL || process.env.PUBLIC_SITE_URL || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || '5', 10),
  qrDefaultSize: parseInt(process.env.QR_DEFAULT_SIZE || '512', 10),
  boothHoldMinutes: parseInt(process.env.BOOTH_HOLD_DEFAULT_MINUTES || '60', 10),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  tz: process.env.TZ || 'Asia/Ho_Chi_Minh',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Đường Sách TP.HCM <no-reply@duongsach.vn>',
  },
};
