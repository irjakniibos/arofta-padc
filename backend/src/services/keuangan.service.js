/** Pengeluaran operasional & laporan keuangan bulanan (pemasukan, pengeluaran, surplus). */
const { Op } = require('sequelize');
const { sequelize, Pengeluaran, User } = require('../models');
const { STATUS_BAYAR, STATUS_FEE } = require('../config/constants');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');
const { toDateString, BULAN } = require('../utils/date');
const { periode } = require('./fee.service');

const FIELDS = ['tanggal', 'kategori', 'keterangan', 'nominal'];

async function listPengeluaran(query) {
  const pg = getPagination(query);
  const p = periode(query);
  const where = { tanggal: { [Op.gte]: toDateString(p.awal), [Op.lt]: toDateString(p.akhir) } };
  if (query.kategori) where.kategori = query.kategori;
  const { rows, count } = await Pengeluaran.findAndCountAll({
    where, include: [{ model: User, as: 'pencatat', attributes: ['email'] }],
    order: [['tanggal', 'DESC'], ['id_pengeluaran', 'DESC']], limit: pg.limit, offset: pg.offset,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function createPengeluaran(data, idUser) {
  return Pengeluaran.create({ ...pick(data, FIELDS), dicatat_oleh: idUser });
}

async function updatePengeluaran(id, data) {
  const row = await Pengeluaran.findByPk(id);
  if (!row) throw AppError.notFound('Data pengeluaran tidak ditemukan');
  return row.update(pick(data, FIELDS));
}

async function deletePengeluaran(id) {
  const n = await Pengeluaran.destroy({ where: { id_pengeluaran: id } });
  if (!n) throw AppError.notFound('Data pengeluaran tidak ditemukan');
}

async function sum(sql, replacements) {
  const [row] = await sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });
  return Number(row.total || 0);
}

async function laporanBulanan(query) {
  const p = periode(query);
  const r = { awal: p.awal, akhir: p.akhir, awalTgl: toDateString(p.awal), akhirTgl: toDateString(p.akhir) };
  const pemasukan = await sum('SELECT SUM(total_bayar) AS total FROM pembayaran WHERE status_pembayaran = :lunas AND tanggal_verifikasi >= :awal AND tanggal_verifikasi < :akhir', { ...r, lunas: STATUS_BAYAR.LUNAS });
  const fee = await sum('SELECT SUM(nominal_fee) AS total FROM rekap_fee WHERE status_distribusi = :sudah AND tanggal_pencairan >= :awal AND tanggal_pencairan < :akhir', { ...r, sudah: STATUS_FEE.SUDAH });
  const operasional = await sum('SELECT SUM(nominal) AS total FROM pengeluaran WHERE tanggal >= :awalTgl AND tanggal < :akhirTgl', r);
  const feeTerutang = await sum('SELECT SUM(nominal_fee) AS total FROM rekap_fee WHERE status_distribusi = :belum AND created_at < :akhir', { ...r, belum: STATUS_FEE.BELUM });

  const perLayanan = await sequelize.query(`
    SELECT l.nama_layanan, COUNT(*) AS jumlah_transaksi, SUM(p.total_bayar) AS total
    FROM pembayaran p JOIN sesi_asesmen s ON s.id_sesi = p.id_sesi JOIN layanan l ON l.id_layanan = s.id_layanan
    WHERE p.status_pembayaran = :lunas AND p.tanggal_verifikasi >= :awal AND p.tanggal_verifikasi < :akhir
    GROUP BY l.id_layanan, l.nama_layanan ORDER BY total DESC`, { replacements: { ...r, lunas: STATUS_BAYAR.LUNAS }, type: sequelize.QueryTypes.SELECT });
  const perKategori = await sequelize.query(`
    SELECT kategori, SUM(nominal) AS total FROM pengeluaran WHERE tanggal >= :awalTgl AND tanggal < :akhirTgl
    GROUP BY kategori ORDER BY total DESC`, { replacements: r, type: sequelize.QueryTypes.SELECT });

  const totalPengeluaran = fee + operasional;
  return {
    periode: { tahun: p.tahun, bulan: p.bulan, nama_bulan: `${BULAN[p.bulan - 1]} ${p.tahun}` },
    pemasukan,
    pengeluaran: { fee_psikolog: fee, operasional, total: totalPengeluaran },
    surplus: pemasukan - totalPengeluaran,
    fee_belum_dicairkan: feeTerutang,
    rincian_pemasukan_per_layanan: perLayanan.map((x) => ({ ...x, jumlah_transaksi: Number(x.jumlah_transaksi), total: Number(x.total) })),
    rincian_pengeluaran_per_kategori: perKategori.map((x) => ({ ...x, total: Number(x.total) })),
  };
}

async function ringkasanTahunan(query) {
  const tahun = Number(query.tahun) || new Date().getFullYear();
  const out = [];
  for (let bulan = 1; bulan <= 12; bulan += 1) {
    const l = await laporanBulanan({ tahun, bulan });
    out.push({ bulan, nama_bulan: BULAN[bulan - 1], pemasukan: l.pemasukan, pengeluaran: l.pengeluaran.total, surplus: l.surplus });
  }
  return { tahun, bulan: out };
}

module.exports = { listPengeluaran, createPengeluaran, updatePengeluaran, deletePengeluaran, laporanBulanan, ringkasanTahunan };
