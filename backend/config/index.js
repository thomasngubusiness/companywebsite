'use strict';
require('dotenv').config();
const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  env: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5500')
    .split(',').map(s => s.trim()).filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'dev_insecure_secret_change_me',
  jwtExpires: process.env.JWT_EXPIRES || '15m',
  admin: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  recaptcha: { siteKey: process.env.RECAPTCHA_SITE_KEY || '', secret: process.env.RECAPTCHA_SECRET || '' },
  databaseUrl: process.env.DATABASE_URL || '',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'database', 'enquiries.db'),
  mail: {
    host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER, pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'no-reply@example.com',
    admin: process.env.MAIL_ADMIN || 'sales@example.com',
  },
};
