/**
 * Autentikasi: registrasi klien, login dengan penguncian akun (anti brute force),
 * ganti password, dan reset password via email.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../config/env');
const { sequelize, User, Klien, Psikolog, PasswordReset } = require('../models');
const { ROLES, VERSI_PERSETUJUAN } = require('../config/constants');
const AppError = require('../utils/AppError');
const { generateNomorRekam, generateToken, hashToken } = require('../utils/codes');
const mail = require('./mail.service');

// Hash dummy agar waktu respons login sama walau email tidak terdaftar (mencegah user enumeration)
const DUMMY_HASH = bcrypt.hashSync('dummy-password-untuk-timing', 10);

function hashPassword(plain) {
  return bcrypt.hash(plain, env.auth.bcryptRounds);
}

function signToken(user) {
  return jwt.sign({ sub: user.id_user, role: user.role }, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpiresIn });
}

async function register(data) {
  const exists = await User.findOne({ where: { email: data.email }, attributes: ['id_user'] });
  if (exists) throw AppError.conflict('Email sudah terdaftar');

  return sequelize.transaction(async (t) => {
    const user = await User.create({
      email: data.email,
      password: await hashPassword(data.password),
      role: ROLES.KLIEN,
      privasi_disetujui_at: new Date(),
      privasi_versi: VERSI_PERSETUJUAN.PRIVASI,
    }, { transaction: t });
    const klien = await Klien.create({
      id_user: user.id_user,
      hubungan_akun: 'Diri Sendiri',
      nama_lengkap: data.nama_lengkap,
      no_hp: data.no_hp || null,
    }, { transaction: t });
    await klien.update({ nomor_rekam_psikologi: generateNomorRekam(klien.id_klien) }, { transaction: t });
    return { id_user: user.id_user, email: user.email, role: user.role, id_klien: klien.id_klien };
  });
}

async function login(email, password) {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  const invalid = AppError.unauthorized('Email atau password salah');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw invalid;
  }
  if (!user.is_active) throw AppError.forbidden('Akun dinonaktifkan. Hubungi admin AROFTA PADC');
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AppError(`Akun terkunci sementara karena terlalu banyak percobaan login. Coba lagi setelah ${env.auth.lockMinutes} menit`, 423);
  }

  // Akun yang hanya masuk dengan Google belum punya password: perlakukan sebagai password salah (tanpa membocorkan info akun)
  const match = await bcrypt.compare(password, user.password || DUMMY_HASH) && Boolean(user.password);
  if (!match) {
    const attempts = user.failed_login_attempts + 1;
    const update = { failed_login_attempts: attempts };
    if (attempts >= env.auth.maxLoginAttempts) {
      update.failed_login_attempts = 0;
      update.locked_until = new Date(Date.now() + env.auth.lockMinutes * 60000);
    }
    await user.update(update);
    throw invalid;
  }

  await user.update({ failed_login_attempts: 0, locked_until: null, last_login: new Date() });
  return { token: signToken(user), user: await profile(user.id_user) };
}

async function profile(idUser) {
  const user = await User.findByPk(idUser, {
    attributes: ['id_user', 'email', 'role', 'last_login', 'created_at', 'privasi_disetujui_at', 'privasi_versi'],
  });
  if (!user) throw AppError.notFound('User tidak ditemukan');
  const data = user.toJSON();
  data.perlu_persetujuan_privasi = user.privasi_versi !== VERSI_PERSETUJUAN.PRIVASI;
  const kredensial = await User.scope('withPassword').findByPk(idUser, { attributes: ['password', 'google_id'] });
  data.punya_password = Boolean(kredensial.password);
  data.google_terhubung = Boolean(kredensial.google_id);
  if (user.role === ROLES.KLIEN) {
    data.profil_klien = await Klien.findAll({
      where: { id_user: idUser },
      attributes: ['id_klien', 'nama_lengkap', 'hubungan_akun', 'nomor_rekam_psikologi'],
      order: [['id_klien', 'ASC']],
    });
  } else if (user.role === ROLES.PSIKOLOG) {
    data.psikolog = await Psikolog.findOne({
      where: { id_user: idUser },
      attributes: ['id_psikolog', 'nama_lengkap', 'sipp', 'spesialisasi'],
    });
  }
  return data;
}

/** Persetujuan Kebijakan Privasi untuk akun lama, akun buatan Admin, atau setelah versi kebijakan berubah. */
async function setujuiPrivasi(idUser) {
  await User.update({ privasi_disetujui_at: new Date(), privasi_versi: VERSI_PERSETUJUAN.PRIVASI }, { where: { id_user: idUser } });
  return profile(idUser);
}

async function changePassword(idUser, oldPassword, newPassword) {
  const user = await User.scope('withPassword').findByPk(idUser);
  if (user && !user.password) {
    throw AppError.badRequest('Akun Anda masuk dengan Google dan belum memiliki password. Buat password melalui menu Lupa password');
  }
  if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
    throw AppError.badRequest('Password lama tidak sesuai');
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    throw AppError.badRequest('Password baru tidak boleh sama dengan password lama');
  }
  await user.update({ password: await hashPassword(newPassword) });
}

/** Membuat token atur password (sekali pakai) dan mengembalikan URL halaman reset password. */
async function buatTautanPassword(idUser, menit, transaction = null) {
  await PasswordReset.update({ used_at: new Date() }, { where: { id_user: idUser, used_at: null }, transaction });
  const token = generateToken();
  await PasswordReset.create({
    id_user: idUser,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + menit * 60000),
  }, { transaction });
  return `${env.frontendUrl}/reset-password?token=${token}`;
}

async function forgotPassword(email) {
  const user = await User.findOne({ where: { email, is_active: true } });
  if (!user) return; // respons tetap sama agar email terdaftar tidak bisa ditebak

  const url = await buatTautanPassword(user.id_user, env.auth.resetTokenMinutes);
  await mail.send({
    to: user.email,
    subject: 'Reset Password Akun AROFTA PADC',
    text: `Kami menerima permintaan reset password untuk akun Anda.
Tautan berlaku ${env.auth.resetTokenMinutes} menit. Abaikan email ini jika Anda tidak memintanya.`,
    cta: { label: 'Atur Password Baru', url },
  });
}

const UNDANGAN_JAM = 72;

/** Email undangan untuk akun klien yang dibuatkan Admin: klien mengatur password sendiri. */
async function kirimUndangan(user, url) {
  await mail.send({
    to: user.email,
    subject: 'Akun AROFTA PADC Anda sudah dibuat',
    text: `Admin AROFTA PADC telah membuatkan akun untuk Anda dengan email ${user.email}.
`
      + `Silakan atur password melalui tautan berikut (berlaku ${UNDANGAN_JAM} jam). Setelah itu Anda dapat masuk untuk melihat jadwal, `
      + 'melengkapi formulir, dan mengunduh laporan hasil.',
    cta: { label: 'Atur Password', url },
  });
}

async function resetPassword(token, newPassword) {
  const record = await PasswordReset.findOne({
    where: { token_hash: hashToken(token), used_at: null, expires_at: { [Op.gt]: new Date() } },
  });
  if (!record) throw AppError.badRequest('Tautan reset password tidak valid atau sudah kedaluwarsa');
  await sequelize.transaction(async (t) => {
    await User.update(
      { password: await hashPassword(newPassword), failed_login_attempts: 0, locked_until: null },
      { where: { id_user: record.id_user }, transaction: t },
    );
    await record.update({ used_at: new Date() }, { transaction: t });
  });
}

module.exports = {
  register, login, signToken, profile, setujuiPrivasi, changePassword, forgotPassword, resetPassword, hashPassword, buatTautanPassword, kirimUndangan, UNDANGAN_JAM,
};
