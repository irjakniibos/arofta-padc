/** Data psikolog: profil publik, kelola akun oleh Admin, dan profil milik psikolog. */
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, User, Psikolog, SesiAsesmen } = require('../models');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hashPassword } = require('./auth.service');

const PROFILE_FIELDS = ['nama_lengkap', 'sipp', 'str', 'spesialisasi', 'pengalaman_tahun', 'profil_singkat', 'no_hp'];
// Tambahkan 'foto_path' ke PUBLIC_ATTR
const PUBLIC_ATTR = ['id_psikolog', 'nama_lengkap', 'spesialisasi', 'pengalaman_tahun', 'profil_singkat', 'foto_updated_at', 'foto_path'];

const FOTO_DIR = path.join(__dirname, '..', '..', 'storage', 'foto');
const ALT_FOTO_DIR = path.join(__dirname, '..', '..', 'storage', 'uploads', 'foto-psikolog');
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png' };
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function listPublic() {
  return Psikolog.findAll({
    attributes: PUBLIC_ATTR,
    include: [{ model: User, as: 'akun', attributes: [], where: { is_active: true } }],
    order: [['nama_lengkap', 'ASC']],
    limit: 100,
  });
}

async function getPublic(id) {
  const p = await Psikolog.findByPk(id, {
    attributes: PUBLIC_ATTR,
    include: [{ model: User, as: 'akun', attributes: [], where: { is_active: true } }],
  });
  if (!p) throw AppError.notFound('Psikolog tidak ditemukan');
  return p;
}

async function listAdmin(query) {
  const pg = getPagination(query);
  const where = {};
  if (query.q) where.nama_lengkap = { [Op.like]: `%${query.q}%` };
  const { rows, count } = await Psikolog.findAndCountAll({
    where,
    attributes: [...PUBLIC_ATTR, 'sipp', 'str', 'no_hp', 'created_at',
      [sequelize.literal('(SELECT COUNT(*) FROM sesi_asesmen s WHERE s.id_psikolog = Psikolog.id_psikolog)'), 'jumlah_sesi']],
    include: [{ model: User, as: 'akun', attributes: ['id_user', 'email', 'is_active', 'last_login'] }],
    order: [['nama_lengkap', 'ASC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function getById(id) {
  const p = await Psikolog.findByPk(id, { include: [{ model: User, as: 'akun', attributes: ['id_user', 'email', 'is_active', 'last_login'] }] });
  if (!p) throw AppError.notFound('Psikolog tidak ditemukan');
  return p;
}

async function create(data) {
  if (await User.findOne({ where: { email: data.email }, attributes: ['id_user'] })) throw AppError.conflict('Email sudah terdaftar');
  return sequelize.transaction(async (t) => {
    const user = await User.create({ email: data.email, password: data.password ? await hashPassword(data.password) : null, role: ROLES.PSIKOLOG }, { transaction: t });
    const p = await Psikolog.create({ id_user: user.id_user, ...pick(data, PROFILE_FIELDS) }, { transaction: t });
    return { id_psikolog: p.id_psikolog, id_user: user.id_user, email: user.email };
  });
}

async function update(id, data) {
  const p = await Psikolog.findByPk(id);
  if (!p) throw AppError.notFound('Psikolog tidak ditemukan');
  await p.update(pick(data, PROFILE_FIELDS));
  return getById(id);
}

async function setActive(id, isActive) {
  const p = await Psikolog.findByPk(id, { attributes: ['id_psikolog', 'id_user'] });
  if (!p) throw AppError.notFound('Psikolog tidak ditemukan');
  if (!isActive) {
    const aktif = await SesiAsesmen.count({ where: { id_psikolog: id, status_asesmen: ['Terdaftar', 'Berjalan'] } });
    if (aktif) throw AppError.conflict(`Psikolog masih memiliki ${aktif} sesi aktif. Alihkan sesi terlebih dahulu`);
  }
  await User.update({ is_active: isActive }, { where: { id_user: p.id_user } });
  return getById(id);
}

/** Profil milik psikolog. Path file foto tidak dikirim ke frontend, hanya penanda punya_foto + foto_versi (cache-buster). */
async function getOwnProfile(idPsikolog) {
  const p = await Psikolog.findByPk(idPsikolog, { include: [{ model: User, as: 'akun', attributes: ['email'] }] });
  if (!p) return null;
  const json = p.toJSON();
  const punyaFoto = Boolean(json.foto_path);
  const fotoVersi = json.foto_updated_at ? new Date(json.foto_updated_at).getTime() : null;
  delete json.foto_path;
  delete json.foto_mime;
  delete json.foto_updated_at;
  return { ...json, punya_foto: punyaFoto, foto_versi: fotoVersi };
}

async function updateOwnProfile(idPsikolog, data) {
  const fields = PROFILE_FIELDS.filter((f) => f !== 'sipp' && f !== 'str'); // SIPP/STR diverifikasi Admin
  await Psikolog.update(pick(data, fields), { where: { id_psikolog: idPsikolog } });
  return getOwnProfile(idPsikolog);
}

// ---------- Foto profil ----------

const isGambarAsli = (buf, mime) => {
  if (!buf || !Buffer.isBuffer(buf)) return false;
  return (
    (mime === 'image/jpeg' && buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    || (mime === 'image/png' && buf.length > 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE))
  );
};

const hapusBerkas = async (nama) => {
  if (!nama) return;
  const fileName = path.basename(nama);
  await fs.unlink(path.join(FOTO_DIR, fileName)).catch(() => {});
  await fs.unlink(path.join(ALT_FOTO_DIR, fileName)).catch(() => {});
};

async function uploadFoto(idPsikolog, file) {
  if (!file) throw AppError.badRequest('File foto wajib diunggah');
  const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
  if (!buffer || !isGambarAsli(buffer, file.mimetype)) throw AppError.badRequest('Isi file tidak sesuai dengan formatnya');
  const p = await Psikolog.findByPk(idPsikolog, { attributes: ['id_psikolog', 'foto_path'] });
  if (!p) throw AppError.notFound('Profil psikolog tidak ditemukan');

  await fs.mkdir(FOTO_DIR, { recursive: true });
  const nama = `psikolog_${idPsikolog}_${crypto.randomBytes(8).toString('hex')}${EXT_BY_MIME[file.mimetype]}`;
  await fs.writeFile(path.join(FOTO_DIR, nama), buffer);

  const lama = p.foto_path;
  try {
    await p.update({ foto_path: nama, foto_mime: file.mimetype, foto_updated_at: new Date() });
  } catch (e) {
    await hapusBerkas(nama); // rollback berkas jika DB gagal
    throw e;
  }
  await hapusBerkas(lama);
  return getOwnProfile(idPsikolog);
}

async function deleteFoto(idPsikolog) {
  const p = await Psikolog.findByPk(idPsikolog, { attributes: ['id_psikolog', 'foto_path'] });
  if (!p) throw AppError.notFound('Profil psikolog tidak ditemukan');
  if (!p.foto_path) throw AppError.notFound('Belum ada foto profil');
  const lama = p.foto_path;
  await p.update({ foto_path: null, foto_mime: null, foto_updated_at: null });
  await hapusBerkas(lama);
  return getOwnProfile(idPsikolog);
}

/** Untuk endpoint publik: hanya psikolog aktif yang fotonya tampil. */
async function getFotoFile(idPsikolog) {
  const p = await Psikolog.findByPk(idPsikolog, {
    attributes: ['foto_path', 'foto_mime'],
    include: [{ model: User, as: 'akun', attributes: [], where: { is_active: true } }],
  });
  if (!p || !p.foto_path) throw AppError.notFound('Foto tidak ditemukan');

  const fileName = path.basename(p.foto_path);
  let filePath = path.join(FOTO_DIR, fileName);

  try {
    await fs.access(filePath);
  } catch {
    // Fallback pencarian ke folder uploads jika file fisik berada di direktori alternatif
    const altPath = path.join(ALT_FOTO_DIR, fileName);
    try {
      await fs.access(altPath);
      filePath = altPath;
    } catch {
      throw AppError.notFound('File foto fisik tidak ditemukan di server');
    }
  }

  return { path: filePath, mime: p.foto_mime || 'image/jpeg' };
}

module.exports = {
  listPublic, getPublic, listAdmin, getById, create, update, setActive, getOwnProfile, updateOwnProfile,
  uploadFoto, deleteFoto, getFotoFile,
};