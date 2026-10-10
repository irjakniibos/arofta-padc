/** Pembatasan jumlah request untuk mitigasi brute force & overload (SOP poin 1 & 4). */
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const message = (msg) => ({ success: false, message: msg });

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 10000 : env.apiRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Terlalu banyak permintaan, coba lagi beberapa saat'),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Terlalu banyak percobaan login dari perangkat ini, coba lagi 15 menit lagi'),
});

const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isTest ? 1000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Terlalu banyak permintaan, coba lagi nanti'),
});

module.exports = { apiLimiter, loginLimiter, sensitiveLimiter };
