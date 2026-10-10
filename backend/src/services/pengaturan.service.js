/** Konfigurasi yang dapat diubah Admin (rekening, nomor WhatsApp, aturan waktu booking, dll). */
const { Pengaturan } = require('../models');
const { SETTING, POLA_NO_HP } = require('../config/constants');
const AppError = require('../utils/AppError');

// Batas nilai pengaturan berupa angka bulat: [min, maks, label]
const ANGKA = {
  [SETTING.BATAS_BAYAR_JAM]: [1, 168, 'Batas bayar setelah booking'],
  [SETTING.BATAS_BAYAR_SEBELUM_SESI_JAM]: [1, 24, 'Batas bayar sebelum sesi'],
  [SETTING.BATAS_BOOKING_JAM]: [1, 72, 'Batas waktu booking online'],
  [SETTING.MAKS_BOOKING_BELUM_BAYAR]: [1, 20, 'Maksimal booking belum dibayar'],
  [SETTING.REMINDER_JAM]: [1, 72, 'Waktu pengingat jadwal'],
};

function validasiNilai(items, existing) {
  const nilai = Object.fromEntries(existing.map((e) => [e.kunci, e.nilai]));
  for (const { kunci, nilai: v } of items) {
    if (ANGKA[kunci]) {
      const [min, max, label] = ANGKA[kunci];
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) throw AppError.badRequest(`${label} harus angka bulat ${min}-${max}`);
    }
    if (kunci === SETTING.KONTAK_WA && !POLA_NO_HP.test(String(v).replace(/[\s-]/g, ''))) {
      throw AppError.badRequest('Nomor WhatsApp tidak valid (contoh: 082228885529)');
    }
    nilai[kunci] = v;
  }
  if (Number(nilai[SETTING.BATAS_BOOKING_JAM]) <= Number(nilai[SETTING.BATAS_BAYAR_SEBELUM_SESI_JAM])) {
    throw AppError.badRequest('Batas waktu booking online harus lebih besar dari batas bayar sebelum sesi, agar klien sempat membayar');
  }
}

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
  validasiNilai(items, await Pengaturan.findAll({ attributes: ['kunci', 'nilai'] }));
  for (const item of items) {
    await Pengaturan.update({ nilai: String(item.nilai) }, { where: { kunci: item.kunci } });
  }
  return getAll();
}

module.exports = { getAll, getPublic, getValue, getNumber, updateMany };
