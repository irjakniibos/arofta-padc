const jwt = require('jsonwebtoken');
const env = require('../config/env');
const crypto = require('crypto');
const authService = require('../services/auth.service');
const google = require('../services/google.service');
const { HOME_ROLE } = require('../config/constants');
const logger = require('../utils/logger');
const audit = require('../services/audit.service');
const { ok, created } = require('../utils/response');

function cookieOptions(token) {
  const { exp } = jwt.decode(token);
  return {
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: env.auth.cookieSameSite,
    path: '/',
    expires: new Date(exp * 1000),
  };
}

exports.register = async (req, res) => {
  const data = await authService.register(req.validated);
  req.user = { id_user: data.id_user };
  await audit.log(req, 'REGISTER', 'users', data.id_user);
  return created(res, data, 'Registrasi berhasil, silakan login');
};

exports.login = async (req, res) => {
  const { token, user } = await authService.login(req.validated.email, req.validated.password);
  res.cookie(env.auth.cookieName, token, cookieOptions(token));
  req.user = { id_user: user.id_user, role: user.role };
  await audit.log(req, 'LOGIN', 'users', user.id_user);
  return ok(res, user, 'Login berhasil');
};

// ---------- Login dengan Google
const OAUTH_COOKIE = `${env.auth.cookieName}_oauth`;
const oauthCookieOptions = { httpOnly: true, secure: env.auth.cookieSecure, sameSite: 'lax', path: '/', maxAge: 10 * 60000 };
/** Hanya alamat relatif di aplikasi ini (mencegah open redirect). */
const lanjutAman = (p) => (typeof p === 'string' && /^\/(?!\/)[\w\-/?=&.%]*$/.test(p) && p.length <= 200 ? p : '');
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Redirect lewat halaman HTML (bukan 302) agar cookie login tetap terkirim walau SameSite=Strict. */
function arahkan(res, path) {
  const url = escapeHtml(`${env.frontendUrl}${path}`);
  res.set('Cache-Control', 'no-store');
  return res.type('html').send(`<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${url}"><title>Mengalihkan</title><a href="${url}">Lanjutkan</a>`);
}

exports.googleStatus = async (req, res) => ok(res, { aktif: google.aktif() });

exports.googleMulai = async (req, res) => {
  if (!google.aktif()) return arahkan(res, '/masuk?google=nonaktif');
  const state = crypto.randomBytes(24).toString('hex');
  res.cookie(OAUTH_COOKIE, `${state}|${lanjutAman(req.query.lanjut)}`, oauthCookieOptions);
  return res.redirect(google.urlMasuk(state));
};

exports.googleCallback = async (req, res) => {
  const [stateCookie, lanjut] = String(req.cookies?.[OAUTH_COOKIE] || '').split('|');
  res.clearCookie(OAUTH_COOKIE, { ...oauthCookieOptions, maxAge: undefined });
  if (req.query.error) return arahkan(res, '/masuk?google=batal');
  if (!stateCookie || typeof req.query.state !== 'string' || req.query.state !== stateCookie || typeof req.query.code !== 'string') {
    return arahkan(res, '/masuk?google=sesi');
  }
  try {
    const { token, user, baru } = await google.masuk(await google.tukarKode(req.query.code));
    res.cookie(env.auth.cookieName, token, cookieOptions(token));
    req.user = { id_user: user.id_user, role: user.role };
    await audit.log(req, baru ? 'REGISTER_GOOGLE' : 'LOGIN_GOOGLE', 'users', user.id_user);
    const tujuan = lanjutAman(lanjut);
    return arahkan(res, tujuan && tujuan.startsWith(HOME_ROLE[user.role]) ? tujuan : HOME_ROLE[user.role]);
  } catch (e) {
    logger.error('Login Google gagal:', e.message);
    const kode = e.statusCode === 403 && /nonaktif/i.test(e.message) ? 'nonaktif-akun' : e.statusCode === 403 ? 'email' : 'gagal';
    return arahkan(res, `/masuk?google=${kode}`);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie(env.auth.cookieName, { path: '/', sameSite: env.auth.cookieSameSite, secure: env.auth.cookieSecure, httpOnly: true });
  return ok(res, null, 'Logout berhasil');
};

exports.me = async (req, res) => ok(res, await authService.profile(req.user.id_user));

exports.setujuiPrivasi = async (req, res) => {
  const d = await authService.setujuiPrivasi(req.user.id_user);
  await audit.log(req, 'PERSETUJUAN', 'users', req.user.id_user, `Kebijakan Privasi v${d.privasi_versi}`);
  return ok(res, d, 'Persetujuan Kebijakan Privasi tersimpan');
};

exports.changePassword = async (req, res) => {
  await authService.changePassword(req.user.id_user, req.validated.password_lama, req.validated.password_baru);
  await audit.log(req, 'CHANGE_PASSWORD', 'users', req.user.id_user);
  return ok(res, null, 'Password berhasil diubah');
};

exports.forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.validated.email);
  return ok(res, null, 'Jika email terdaftar, tautan reset password telah dikirim');
};

exports.resetPassword = async (req, res) => {
  await authService.resetPassword(req.validated.token, req.validated.password_baru);
  return ok(res, null, 'Password berhasil diatur ulang, silakan login');
};
