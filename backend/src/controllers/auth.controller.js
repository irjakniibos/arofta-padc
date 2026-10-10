const jwt = require('jsonwebtoken');
const env = require('../config/env');
const authService = require('../services/auth.service');
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

exports.logout = async (req, res) => {
  res.clearCookie(env.auth.cookieName, { path: '/', sameSite: env.auth.cookieSameSite, secure: env.auth.cookieSecure, httpOnly: true });
  return ok(res, null, 'Logout berhasil');
};

exports.me = async (req, res) => ok(res, await authService.profile(req.user.id_user));

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
