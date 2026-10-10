/**
 * Autentikasi JWT. Token dibaca dari httpOnly cookie (utama)
 * atau header Authorization: Bearer (untuk Postman/testing).
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User, Psikolog } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');

function extractToken(req) {
  if (req.cookies && req.cookies[env.auth.cookieName]) return req.cookies[env.auth.cookieName];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.auth.jwtSecret);
  } catch (e) {
    throw AppError.unauthorized('Sesi login berakhir, silakan login kembali');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.is_active) throw AppError.unauthorized('Akun tidak aktif');

  req.user = { id_user: user.id_user, email: user.email, role: user.role };
  if (user.role === ROLES.PSIKOLOG) {
    const psikolog = await Psikolog.findOne({ where: { id_user: user.id_user }, attributes: ['id_psikolog'] });
    if (!psikolog) throw AppError.forbidden('Profil psikolog belum dibuat');
    req.user.id_psikolog = psikolog.id_psikolog;
  }
  next();
});

module.exports = { authenticate, extractToken };
