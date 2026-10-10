/** Konfigurasi yang dapat diubah Admin (rekening, link Google Form, dll). */
const { Pengaturan } = require('../models');
const AppError = require('../utils/AppError');

async function getAll() {
  return Pengaturan.findAll({ order: [['kunci', 'ASC']] });
}

async function getPublic() {
  const rows = await Pengaturan.findAll({ where: { is_public: true }, attributes: ['kunci', 'nilai'] });
  return Object.fromEntries(rows.map((r) => [r.kunci, r.nilai]));
}

async function getValue(kunci, fallback = null) {
  const row = await Pengaturan.findByPk(kunci);
  return row ? row.nilai : fallback;
}

async function getNumber(kunci, fallback) {
  const n = Number(await getValue(kunci));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function updateMany(items) {
  const existing = await Pengaturan.findAll({ where: { kunci: items.map((i) => i.kunci) } });
  const known = new Set(existing.map((e) => e.kunci));
  const unknown = items.filter((i) => !known.has(i.kunci)).map((i) => i.kunci);
  if (unknown.length) throw AppError.badRequest(`Kunci pengaturan tidak dikenal: ${unknown.join(', ')}`);
  for (const item of items) {
    await Pengaturan.update({ nilai: String(item.nilai) }, { where: { kunci: item.kunci } });
  }
  return getAll();
}

module.exports = { getAll, getPublic, getValue, getNumber, updateMany };
