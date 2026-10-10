/** Katalog layanan, harga, dan tarif fee psikolog per layanan. */
const { Op } = require('sequelize');
const { sequelize, Layanan, LayananFee, KategoriFee, TemplateLaporan, SesiAsesmen } = require('../models');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');

const FIELDS = ['nama_layanan', 'kategori', 'deskripsi', 'harga', 'durasi_menit', 'jenis_intake', 'id_template', 'is_active'];
const PUBLIC_ATTR = ['id_layanan', 'nama_layanan', 'kategori', 'deskripsi', 'harga', 'durasi_menit', 'jenis_intake'];

async function listPublic(query) {
  const where = { is_active: true };
  if (query.kategori) where.kategori = query.kategori;
  return Layanan.findAll({ where, attributes: PUBLIC_ATTR, order: [['kategori', 'ASC'], ['nama_layanan', 'ASC']], limit: 100 });
}

async function getPublic(id) {
  const l = await Layanan.findOne({ where: { id_layanan: id, is_active: true }, attributes: PUBLIC_ATTR });
  if (!l) throw AppError.notFound('Layanan tidak ditemukan');
  return l;
}

async function listAdmin(query) {
  const pg = getPagination(query);
  const where = {};
  if (query.kategori) where.kategori = query.kategori;
  if (query.q) where.nama_layanan = { [Op.like]: `%${query.q}%` };
  if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
  const { rows, count } = await Layanan.findAndCountAll({
    where,
    include: [{ model: TemplateLaporan, as: 'template', attributes: ['id_template', 'kode', 'nama_template'] }],
    order: [['id_layanan', 'ASC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function getAdmin(id) {
  const l = await Layanan.findByPk(id, {
    include: [
      { model: TemplateLaporan, as: 'template', attributes: ['id_template', 'kode', 'nama_template'] },
      { model: LayananFee, as: 'tarifFee', include: [{ model: KategoriFee, as: 'kategori', attributes: ['id_kategori_fee', 'nama_kategori', 'nominal_default'] }] },
    ],
  });
  if (!l) throw AppError.notFound('Layanan tidak ditemukan');
  return l;
}

async function assertTemplate(idTemplate) {
  if (idTemplate === null || idTemplate === undefined) return;
  const t = await TemplateLaporan.findByPk(idTemplate, { attributes: ['id_template', 'is_active'] });
  if (!t || !t.is_active) throw AppError.badRequest('Template laporan tidak ditemukan atau tidak aktif');
}

async function create(data) {
  await assertTemplate(data.id_template);
  return Layanan.create(pick(data, FIELDS));
}

async function update(id, data) {
  const l = await Layanan.findByPk(id);
  if (!l) throw AppError.notFound('Layanan tidak ditemukan');
  await assertTemplate(data.id_template);
  await l.update(pick(data, FIELDS));
  return getAdmin(id);
}

/** Hapus permanen hanya jika belum pernah dipakai; jika sudah, nonaktifkan (soft delete). */
async function remove(id) {
  const l = await Layanan.findByPk(id);
  if (!l) throw AppError.notFound('Layanan tidak ditemukan');
  const used = await SesiAsesmen.count({ where: { id_layanan: id } });
  if (used > 0) {
    await l.update({ is_active: false });
    return { dihapus: false, dinonaktifkan: true };
  }
  await l.destroy();
  return { dihapus: true, dinonaktifkan: false };
}

/** Mengganti seluruh tarif fee layanan: [{ id_kategori_fee, nominal }] */
async function setTarifFee(id, items) {
  const l = await Layanan.findByPk(id, { attributes: ['id_layanan'] });
  if (!l) throw AppError.notFound('Layanan tidak ditemukan');
  const ids = items.map((i) => i.id_kategori_fee);
  if (new Set(ids).size !== ids.length) throw AppError.badRequest('Kategori fee tidak boleh duplikat');
  const found = await KategoriFee.count({ where: { id_kategori_fee: ids } });
  if (found !== ids.length) throw AppError.badRequest('Ada kategori fee yang tidak ditemukan');
  await sequelize.transaction(async (t) => {
    await LayananFee.destroy({ where: { id_layanan: id }, transaction: t });
    if (items.length) {
      await LayananFee.bulkCreate(items.map((i) => ({ id_layanan: id, id_kategori_fee: i.id_kategori_fee, nominal: i.nominal })), { transaction: t });
    }
  });
  return getAdmin(id);
}

module.exports = { listPublic, getPublic, listAdmin, getAdmin, create, update, remove, setTarifFee };
