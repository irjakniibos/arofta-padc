const { KategoriFee, LayananFee, RekapFee } = require('../models');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');

const FIELDS = ['nama_kategori', 'nominal_default', 'keterangan', 'is_active'];

async function list(query) {
  const where = {};
  if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
  return KategoriFee.findAll({ where, order: [['id_kategori_fee', 'ASC']], limit: 200 });
}

async function create(data) { return KategoriFee.create(pick(data, FIELDS)); }

async function update(id, data) {
  const k = await KategoriFee.findByPk(id);
  if (!k) throw AppError.notFound('Kategori fee tidak ditemukan');
  return k.update(pick(data, FIELDS));
}

async function remove(id) {
  const k = await KategoriFee.findByPk(id);
  if (!k) throw AppError.notFound('Kategori fee tidak ditemukan');
  const used = (await LayananFee.count({ where: { id_kategori_fee: id } })) + (await RekapFee.count({ where: { id_kategori_fee: id } }));
  if (used) {
    await k.update({ is_active: false });
    return { dihapus: false, dinonaktifkan: true };
  }
  await k.destroy();
  return { dihapus: true, dinonaktifkan: false };
}

module.exports = { list, create, update, remove };
