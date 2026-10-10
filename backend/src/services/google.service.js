/**
 * Login dengan akun Google (OpenID Connect, authorization code flow) (KF-28).
 * - Hanya klien yang dapat mendaftar sendiri lewat Google; psikolog, Admin, dan Super Admin
 *   harus sudah didaftarkan dengan email yang sama, lalu akunnya otomatis tertaut.
 * - Email wajib terverifikasi Google, akun nonaktif ditolak, dan hak akses tetap mengikuti role di database.
 */
const env = require('../config/env');
const { sequelize, User, Klien } = require('../models');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const { generateNomorRekam } = require('../utils/codes');
const auth = require('./auth.service');

const aktif = () => Boolean(env.google.clientId && env.google.clientSecret);

function urlMasuk(state) {
  const q = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `${env.google.authUrl}?${q}`;
}

/** Klaim id_token. Token diterima langsung dari Google lewat HTTPS (back-channel), sehingga cukup validasi klaimnya. */
function bacaIdToken(idToken) {
  const [, payload] = String(idToken || '').split('.');
  if (!payload) throw AppError.unauthorized('Respons Google tidak valid');
  const c = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!env.google.issuers.includes(c.iss) || c.aud !== env.google.clientId) throw AppError.unauthorized('Token Google tidak ditujukan untuk aplikasi ini');
  if (!c.exp || c.exp * 1000 < Date.now()) throw AppError.unauthorized('Token Google sudah kedaluwarsa');
  return c;
}

async function tukarKode(code) {
  const res = await fetch(env.google.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: env.google.clientId, client_secret: env.google.clientSecret,
      redirect_uri: env.google.redirectUri, grant_type: 'authorization_code',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id_token) throw AppError.unauthorized('Gagal memverifikasi akun Google. Silakan coba lagi');
  return bacaIdToken(data.id_token);
}

/** Mencari atau membuat akun dari klaim Google, lalu mengembalikan token sesi seperti login biasa. */
async function masuk(klaim) {
  const verified = klaim.email_verified === true || klaim.email_verified === 'true';
  if (!klaim.email || !verified) throw AppError.forbidden('Email akun Google belum terverifikasi');
  const email = String(klaim.email).toLowerCase();

  let user = await User.scope('withPassword').findOne({ where: { google_id: klaim.sub } })
    || await User.scope('withPassword').findOne({ where: { email } });
  let baru = false;

  if (user) {
    if (!user.is_active) throw AppError.forbidden('Akun dinonaktifkan. Hubungi admin AROFTA PADC');
    if (user.google_id && user.google_id !== klaim.sub) throw AppError.conflict('Email ini sudah tertaut dengan akun Google lain');
    await user.update({ google_id: klaim.sub, failed_login_attempts: 0, locked_until: null, last_login: new Date() });
  } else {
    // Pendaftaran mandiri lewat Google hanya untuk klien. Persetujuan privasi diminta saat pertama masuk.
    user = await sequelize.transaction(async (t) => {
      const u = await User.create({ email, password: null, google_id: klaim.sub, role: ROLES.KLIEN, last_login: new Date() }, { transaction: t });
      const k = await Klien.create({
        id_user: u.id_user, hubungan_akun: 'Diri Sendiri', nama_lengkap: String(klaim.name || email.split('@')[0]).slice(0, 150),
      }, { transaction: t });
      await k.update({ nomor_rekam_psikologi: generateNomorRekam(k.id_klien) }, { transaction: t });
      await auth.notifKlienBaru(k.nama_lengkap, email, 'akun Google', t);
      return u;
    });
    baru = true;
  }
  return { token: auth.signToken(user), user: await auth.profile(user.id_user), baru };
}

module.exports = { aktif, urlMasuk, tukarKode, masuk, bacaIdToken };
