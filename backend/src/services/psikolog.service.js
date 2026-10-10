/** Data psikolog: profil publik, kelola akun oleh Admin, dan profil milik psikolog. */
const { Op } = require('sequelize');
const { sequelize, User, Psikolog, SesiAsesmen } = require('../models');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hashPassword } = require('./auth.service');

const PROFILE_FIELDS = ['nama_lengkap', 'sipp', 'str', 'spesialisasi', 'pengalaman_tahun', 'profil_singkat', 'no_hp'];
const PUBLIC_ATTR = ['id_psikolog', 'nama_lengkap', 'spesialisasi', 'pengalaman_tahun', 'profil_singkat'];

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
    const user = await User.create({ email: data.email, password: await hashPassword(data.password), role: ROLES.PSIKOLOG }, { transaction: t });
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

async function getOwnProfile(idPsikolog) {
  return Psikolog.findByPk(idPsikolog, { include: [{ model: User, as: 'akun', attributes: ['email'] }] });
}

async function updateOwnProfile(idPsikolog, data) {
  const fields = PROFILE_FIELDS.filter((f) => f !== 'sipp' && f !== 'str'); // SIPP/STR diverifikasi Admin
  await Psikolog.update(pick(data, fields), { where: { id_psikolog: idPsikolog } });
  return getOwnProfile(idPsikolog);
}

module.exports = { listPublic, getPublic, listAdmin, getById, create, update, setActive, getOwnProfile, updateOwnProfile };
