const { body } = require('express-validator');
const v = require('./common');

module.exports = {
  register: [
    v.nama('nama_lengkap'),
    v.email(),
    v.password(),
    body('konfirmasi_password').custom((val, { req }) => val === req.body.password).withMessage('Konfirmasi password tidak sama'),
    v.noHp('no_hp'),
    v.setuju('setuju_privasi', 'Anda harus menyetujui Kebijakan Privasi untuk mendaftar'),
  ],
  login: [
    v.email(),
    body('password').isString().notEmpty().withMessage('Password wajib diisi').isLength({ max: 72 }),
  ],
  changePassword: [
    body('password_lama').isString().notEmpty().withMessage('Password lama wajib diisi').isLength({ max: 72 }),
    v.password('password_baru'),
    body('konfirmasi_password').custom((val, { req }) => val === req.body.password_baru).withMessage('Konfirmasi password tidak sama'),
  ],
  forgotPassword: [v.email()],
  resetPassword: [
    body('token').isString().isLength({ min: 64, max: 64 }).isHexadecimal().withMessage('Token tidak valid'),
    v.password('password_baru'),
    body('konfirmasi_password').custom((val, { req }) => val === req.body.password_baru).withMessage('Konfirmasi password tidak sama'),
  ],
};
