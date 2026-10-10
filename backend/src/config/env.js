/**
 * Membaca dan memvalidasi variabel lingkungan (.env).
 * Aplikasi berhenti saat start jika ada konfigurasi wajib yang kosong,
 * sehingga tidak ada nilai rahasia yang di-hardcode di source code.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const isTest = process.env.NODE_ENV === 'test';

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Konfigurasi .env wajib diisi: ${name}`);
  }
  return value;
}

function bool(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
}

function normalizeBasePath(p) {
  if (!p || p === '/') return '';
  return `/${p.replace(/^\/+|\/+$/g, '')}`;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest,
  port: Number(process.env.PORT || 5000),
  apiBasePath: normalizeBasePath(process.env.API_BASE_PATH || '/api/v1'),
  corsOrigins: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  frontendUrl: (process.env.FRONTEND_URL || '').replace(/\/+$/, ''),
  trustProxy: Number(process.env.TRUST_PROXY || 0),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: isTest ? required('DB_NAME_TEST') : required('DB_NAME'),
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD || '',
    timezone: process.env.DB_TIMEZONE || '+07:00',
  },

  auth: {
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    cookieName: process.env.COOKIE_NAME || 'arofta_token',
    cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
    cookieSecure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
    maxLoginAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
    lockMinutes: Number(process.env.LOGIN_LOCK_MINUTES || 15),
    resetTokenMinutes: Number(process.env.RESET_TOKEN_MINUTES || 30),
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: bool(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM || 'AROFTA PADC <no-reply@localhost>',
  },

  storage: {
    root: path.resolve(__dirname, '../..', process.env.STORAGE_PATH || './storage'),
    uploadMaxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB || 2),
  },

  report: {
    sofficePath: process.env.SOFFICE_PATH || '',
    city: process.env.REPORT_CITY || 'Surakarta',
  },

  enableCron: bool(process.env.ENABLE_CRON, true) && !isTest,
  // Batas permintaan API per IP per 15 menit (satu kantor dengan IP bersama butuh nilai lebih besar)
  apiRateLimit: Number(process.env.API_RATE_LIMIT) || 1500,
};

if (env.auth.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET minimal 32 karakter');
}

module.exports = env;
