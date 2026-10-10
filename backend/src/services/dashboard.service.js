/** Statistik dashboard per role (KF-05, KF-07). */
const { Op } = require('sequelize');
const { sequelize, Klien, Psikolog, User, SesiAsesmen, Pembayaran, LaporanAsesmen, Layanan, Notifikasi, RekapFee } = require('../models');
const { STATUS_SESI, STATUS_BAYAR, STATUS_LAPORAN, STATUS_FEE } = require('../config/constants');
const { toDateString } = require('../utils/date');
const sesiService = require('./sesi.service');
const keuangan = require('./keuangan.service');

const SESI_RINGKAS = {
  attributes: ['id_sesi', 'kode_booking', 'tanggal', 'waktu', 'tipe_sesi', 'status_asesmen', 'tautan_zoom', 'lokasi_ruangan'],
  include: [
    { model: Klien, as: 'klien', attributes: ['nama_lengkap'] },
    { model: Psikolog, as: 'psikolog', attributes: ['nama_lengkap'] },
    { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] },
  ],
};

async function admin() {
  const today = toDateString();
  const in7 = toDateString(new Date(Date.now() + 7 * 86400000));
  const [totalKlien, psikologAktif, statusSesi, menungguVerifikasi, laporanTertunda, sesiHariIni, sesiMendatang, keuanganBulanIni] = await Promise.all([
    Klien.count(),
    Psikolog.count({ include: [{ model: User, as: 'akun', where: { is_active: true }, attributes: [] }] }),
    sesiService.ringkasanStatus(),
    Pembayaran.count({ where: { status_pembayaran: STATUS_BAYAR.MENUNGGU_VERIFIKASI } }),
    sequelize.query(
      `SELECT COUNT(*) AS n FROM sesi_asesmen s LEFT JOIN laporan_asesmen l ON l.id_sesi = s.id_sesi
       JOIN layanan ly ON ly.id_layanan = s.id_layanan
       WHERE s.status_asesmen = :selesai AND ly.id_template IS NOT NULL AND (l.id_laporan IS NULL OR l.status_laporan <> :final)`,
      { replacements: { selesai: STATUS_SESI.SELESAI, final: STATUS_LAPORAN.FINAL }, type: sequelize.QueryTypes.SELECT },
    ).then(([r]) => Number(r.n)),
    SesiAsesmen.findAll({ ...SESI_RINGKAS, where: { tanggal: today, status_asesmen: { [Op.ne]: STATUS_SESI.BATAL } }, order: [['waktu', 'ASC']], limit: 50 }),
    SesiAsesmen.count({ where: { tanggal: { [Op.gt]: today, [Op.lte]: in7 }, status_asesmen: STATUS_SESI.TERDAFTAR } }),
    keuangan.laporanBulanan({}),
  ]);
  return {
    total_klien: totalKlien,
    psikolog_aktif: psikologAktif,
    sesi_per_status: statusSesi,
    sesi_aktif: statusSesi[STATUS_SESI.TERDAFTAR] + statusSesi[STATUS_SESI.BERJALAN],
    pembayaran_menunggu_verifikasi: menungguVerifikasi,
    laporan_belum_final: laporanTertunda,
    sesi_7_hari_ke_depan: sesiMendatang,
    sesi_hari_ini: sesiHariIni,
    keuangan_bulan_ini: { pemasukan: keuanganBulanIni.pemasukan, pengeluaran: keuanganBulanIni.pengeluaran.total, surplus: keuanganBulanIni.surplus },
  };
}

async function psikolog(idPsikolog) {
  const today = toDateString();
  const now = new Date();
  const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1);
  const [statusSesi, sesiHariIni, laporanTertunda, fee] = await Promise.all([
    sesiService.ringkasanStatus({ id_psikolog: idPsikolog }),
    SesiAsesmen.findAll({ ...SESI_RINGKAS, where: { id_psikolog: idPsikolog, tanggal: today, status_asesmen: { [Op.ne]: STATUS_SESI.BATAL } }, order: [['waktu', 'ASC']] }),
    sequelize.query(
      `SELECT COUNT(*) AS n FROM sesi_asesmen s LEFT JOIN laporan_asesmen l ON l.id_sesi = s.id_sesi JOIN layanan ly ON ly.id_layanan = s.id_layanan
       WHERE s.id_psikolog = :id AND s.status_asesmen = :selesai AND ly.id_template IS NOT NULL AND (l.id_laporan IS NULL OR l.status_laporan <> :final)`,
      { replacements: { id: idPsikolog, selesai: STATUS_SESI.SELESAI, final: STATUS_LAPORAN.FINAL }, type: sequelize.QueryTypes.SELECT },
    ).then(([r]) => Number(r.n)),
    RekapFee.findAll({
      where: { id_psikolog: idPsikolog, created_at: { [Op.gte]: awalBulan } },
      attributes: ['status_distribusi', [sequelize.fn('SUM', sequelize.col('nominal_fee')), 'total']],
      group: ['status_distribusi'], raw: true,
    }),
  ]);
  const feeMap = Object.fromEntries(fee.map((f) => [f.status_distribusi, Number(f.total)]));
  return {
    sesi_per_status: statusSesi,
    sesi_hari_ini: sesiHariIni,
    laporan_belum_final: laporanTertunda,
    fee_bulan_ini: { belum_dibayar: feeMap[STATUS_FEE.BELUM] || 0, sudah_dibayar: feeMap[STATUS_FEE.SUDAH] || 0 },
  };
}

async function klien(idUser) {
  const today = toDateString();
  const klienIds = (await Klien.findAll({ where: { id_user: idUser }, attributes: ['id_klien'] })).map((k) => k.id_klien);
  const [mendatang, menungguBayar, laporan, notifBelumDibaca] = await Promise.all([
    SesiAsesmen.findAll({ ...SESI_RINGKAS, attributes: SESI_RINGKAS.attributes.filter((a) => a !== 'tautan_zoom'), where: { id_klien: klienIds, tanggal: { [Op.gte]: today }, status_asesmen: [STATUS_SESI.TERDAFTAR, STATUS_SESI.BERJALAN] }, order: [['tanggal', 'ASC'], ['waktu', 'ASC']], limit: 5 }),
    Pembayaran.count({ where: { status_pembayaran: [STATUS_BAYAR.MENUNGGU_PEMBAYARAN, STATUS_BAYAR.DITOLAK] }, include: [{ model: SesiAsesmen, as: 'sesi', where: { id_klien: klienIds }, attributes: [] }] }),
    LaporanAsesmen.count({ where: { status_laporan: STATUS_LAPORAN.FINAL }, include: [{ model: SesiAsesmen, as: 'sesi', where: { id_klien: klienIds }, attributes: [] }] }),
    Notifikasi.count({ where: { id_user: idUser, is_read: false } }),
  ]);
  return { sesi_mendatang: mendatang, tagihan_belum_dibayar: menungguBayar, laporan_tersedia: laporan, notifikasi_belum_dibaca: notifBelumDibaca };
}

module.exports = { admin, psikolog, klien };
