/**
 * Ulasan klien: diberikan setelah sesi Selesai (1 ulasan per sesi).
 * Nama klien disamarkan di tampilan publik untuk menjaga kerahasiaan klien layanan psikologi.
 */
const { sequelize, Ulasan, SesiAsesmen, Klien, Psikolog, Layanan, User } = require('../models');
const { STATUS_SESI, TIPE_NOTIF } = require('../config/constants');
const notif = require('./notifikasi.service');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/pagination');

/** "Rina Ayu Lestari" -> "R***a" */
function samarkan(nama) {
  const first = String(nama || '').trim().split(/\s+/)[0] || '';
  if (first.length <= 2) return `${first.charAt(0)}***`;
  return `${first.charAt(0)}***${first.charAt(first.length - 1)}`;
}

async function buat(idUser, idSesi, { rating, komentar }) {
  const sesi = await SesiAsesmen.findOne({
    where: { id_sesi: idSesi },
    include: [{ model: Klien, as: 'klien', where: { id_user: idUser }, attributes: ['id_klien'] }],
  });
  if (!sesi) throw AppError.notFound('Sesi tidak ditemukan');
  if (sesi.status_asesmen !== STATUS_SESI.SELESAI) throw AppError.conflict('Ulasan dapat diberikan setelah sesi selesai');
  if (await Ulasan.count({ where: { id_sesi: idSesi } })) throw AppError.conflict('Sesi ini sudah diberi ulasan');
  const ulasan = await Ulasan.create({ id_sesi: idSesi, id_klien: sesi.id_klien, id_psikolog: sesi.id_psikolog, rating, komentar: komentar || null });
  const psikolog = await Psikolog.findByPk(sesi.id_psikolog, { attributes: ['id_user'] });
  const isi = { idSesi, tipe: TIPE_NOTIF.SISTEM, judul: `Ulasan baru untuk sesi ${sesi.kode_booking}`, pesan: `Rating ${rating} dari 5.${komentar ? ` Komentar: ${komentar}` : ''}` };
  await notif.kirim({ idUser: psikolog?.id_user, ...isi });
  await notif.kirimKeAdmin(isi);
  return ulasan;
}

async function ringkasanRating(idPsikolog) {
  const [r] = await Ulasan.findAll({
    where: { id_psikolog: idPsikolog, is_tampil: true },
    attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'rata_rata'], [sequelize.fn('COUNT', sequelize.col('id_ulasan')), 'jumlah']],
    raw: true,
  });
  return { rata_rata: r.rata_rata ? Number(Number(r.rata_rata).toFixed(1)) : null, jumlah: Number(r.jumlah) };
}

/** Ulasan publik untuk satu psikolog (hanya yang ditampilkan, nama disamarkan). */
async function listPublik(idPsikolog, query) {
  const p = await Psikolog.findByPk(idPsikolog, { attributes: ['id_psikolog', 'nama_lengkap'], include: [{ model: User, as: 'akun', attributes: [], where: { is_active: true } }] });
  if (!p) throw AppError.notFound('Psikolog tidak ditemukan');
  const pg = getPagination(query);
  const { rows, count } = await Ulasan.findAndCountAll({
    where: { id_psikolog: idPsikolog, is_tampil: true },
    attributes: ['id_ulasan', 'rating', 'komentar', 'created_at'],
    include: [
      { model: Klien, as: 'klien', attributes: ['nama_lengkap'] },
      { model: SesiAsesmen, as: 'sesi', attributes: ['id_sesi'], include: [{ model: Layanan, as: 'layanan', attributes: ['nama_layanan'] }] },
    ],
    order: [['created_at', 'DESC']],
    limit: pg.limit, offset: pg.offset,
  });
  return {
    ringkasan: await ringkasanRating(idPsikolog),
    rows: rows.map((u) => ({
      id_ulasan: u.id_ulasan, rating: u.rating, komentar: u.komentar, created_at: u.created_at,
      nama_klien: samarkan(u.klien && u.klien.nama_lengkap), layanan: u.sesi && u.sesi.layanan ? u.sesi.layanan.nama_layanan : null,
    })),
    meta: buildMeta(pg, count),
  };
}

/** Rata-rata rating banyak psikolog sekaligus (untuk daftar psikolog publik). */
async function ratingBanyak(ids) {
  if (!ids.length) return {};
  const rows = await Ulasan.findAll({
    where: { id_psikolog: ids, is_tampil: true },
    attributes: ['id_psikolog', [sequelize.fn('AVG', sequelize.col('rating')), 'rata_rata'], [sequelize.fn('COUNT', sequelize.col('id_ulasan')), 'jumlah']],
    group: ['id_psikolog'], raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r.id_psikolog, { rata_rata: Number(Number(r.rata_rata).toFixed(1)), jumlah: Number(r.jumlah) }]));
}

async function listAdmin(query, scope = {}) {
  const pg = getPagination(query);
  const where = { ...scope };
  if (query.is_tampil !== undefined) where.is_tampil = query.is_tampil === 'true';
  if (query.id_psikolog) where.id_psikolog = query.id_psikolog;
  if (query.rating) where.rating = query.rating;
  const { rows, count } = await Ulasan.findAndCountAll({
    where,
    include: [
      { model: Klien, as: 'klien', attributes: ['id_klien', 'nama_lengkap'] },
      { model: Psikolog, as: 'psikolog', attributes: ['id_psikolog', 'nama_lengkap'] },
      { model: SesiAsesmen, as: 'sesi', attributes: ['id_sesi', 'kode_booking', 'tanggal'], include: [{ model: Layanan, as: 'layanan', attributes: ['nama_layanan'] }] },
    ],
    order: [['created_at', 'DESC']],
    limit: pg.limit, offset: pg.offset,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function setTampil(id, isTampil) {
  const u = await Ulasan.findByPk(id);
  if (!u) throw AppError.notFound('Ulasan tidak ditemukan');
  return u.update({ is_tampil: isTampil });
}

module.exports = { buat, listPublik, ringkasanRating, ratingBanyak, listAdmin, setTampil, samarkan };
