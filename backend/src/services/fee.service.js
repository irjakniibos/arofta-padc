/** Fee Psikolog: rekap per psikolog per bulan, detail per sesi, dan pencatatan pencairan (KF-10). */
const { Op } = require('sequelize');
const { sequelize, RekapFee, Psikolog, SesiAsesmen, Klien, Layanan, KategoriFee } = require('../models');
const { STATUS_FEE, TIPE_NOTIF } = require('../config/constants');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/pagination');
const notif = require('./notifikasi.service');
const { rupiah } = require('./booking.service');

function periode(query) {
  const now = new Date();
  const tahun = Number(query.tahun) || now.getFullYear();
  const bulan = Number(query.bulan) || now.getMonth() + 1;
  const awal = new Date(tahun, bulan - 1, 1);
  const akhir = new Date(tahun, bulan, 1);
  return { tahun, bulan, awal, akhir };
}

async function rekapPerPsikolog(query) {
  const p = periode(query);
  const rows = await sequelize.query(`
    SELECT ps.id_psikolog, ps.nama_lengkap,
      COUNT(DISTINCT f.id_sesi) AS jumlah_sesi,
      COALESCE(SUM(f.nominal_fee), 0) AS total_fee,
      COALESCE(SUM(CASE WHEN f.status_distribusi = :belum THEN f.nominal_fee ELSE 0 END), 0) AS belum_dibayar,
      COALESCE(SUM(CASE WHEN f.status_distribusi = :sudah THEN f.nominal_fee ELSE 0 END), 0) AS sudah_dibayar
    FROM psikolog ps
    LEFT JOIN rekap_fee f ON f.id_psikolog = ps.id_psikolog AND f.created_at >= :awal AND f.created_at < :akhir
    GROUP BY ps.id_psikolog, ps.nama_lengkap
    ORDER BY total_fee DESC, ps.nama_lengkap ASC
    LIMIT 200`, {
    replacements: { belum: STATUS_FEE.BELUM, sudah: STATUS_FEE.SUDAH, awal: p.awal, akhir: p.akhir },
    type: sequelize.QueryTypes.SELECT,
  });
  const total = rows.reduce((a, r) => ({
    total_fee: a.total_fee + Number(r.total_fee), belum_dibayar: a.belum_dibayar + Number(r.belum_dibayar), sudah_dibayar: a.sudah_dibayar + Number(r.sudah_dibayar),
  }), { total_fee: 0, belum_dibayar: 0, sudah_dibayar: 0 });
  return { periode: { tahun: p.tahun, bulan: p.bulan }, ringkasan: total, psikolog: rows };
}

async function detailPsikolog(idPsikolog, query) {
  const psikolog = await Psikolog.findByPk(idPsikolog, { attributes: ['id_psikolog', 'nama_lengkap', 'sipp', 'no_hp'] });
  if (!psikolog) throw AppError.notFound('Psikolog tidak ditemukan');
  const p = periode(query);
  const pg = getPagination(query);
  const where = { id_psikolog: idPsikolog, created_at: { [Op.gte]: p.awal, [Op.lt]: p.akhir } };
  if (query.status) where.status_distribusi = query.status;
  const { rows, count } = await RekapFee.findAndCountAll({
    where,
    include: [
      { model: KategoriFee, as: 'kategori', attributes: ['nama_kategori'] },
      {
        model: SesiAsesmen, as: 'sesi', attributes: ['id_sesi', 'kode_booking', 'tanggal'],
        include: [{ model: Klien, as: 'klien', attributes: ['nama_lengkap'] }, { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] }],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: pg.limit, offset: pg.offset,
  });
  const [sum] = await RekapFee.findAll({
    where: { id_psikolog: idPsikolog, created_at: { [Op.gte]: p.awal, [Op.lt]: p.akhir } },
    attributes: [
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('nominal_fee')), 0), 'total_fee'],
      [sequelize.literal(`COALESCE(SUM(CASE WHEN status_distribusi = '${STATUS_FEE.BELUM}' THEN nominal_fee ELSE 0 END), 0)`), 'belum_dibayar'],
    ],
    raw: true,
  });
  return { psikolog, periode: { tahun: p.tahun, bulan: p.bulan }, ringkasan: sum, rows, meta: buildMeta(pg, count) };
}

/** Menandai fee sudah dicairkan (transfer manual ke psikolog). */
async function bayar(ids, catatan) {
  const fees = await RekapFee.findAll({ where: { id_fee: ids }, include: [{ model: Psikolog, as: 'psikolog', attributes: ['id_user', 'nama_lengkap'] }] });
  if (fees.length !== ids.length) throw AppError.badRequest('Ada data fee yang tidak ditemukan');
  const sudah = fees.filter((f) => f.status_distribusi === STATUS_FEE.SUDAH);
  if (sudah.length) throw AppError.conflict(`Fee ${sudah.map((f) => f.id_fee).join(', ')} sudah dibayar`);
  const now = new Date();
  await sequelize.transaction(async (t) => {
    await RekapFee.update({ status_distribusi: STATUS_FEE.SUDAH, tanggal_pencairan: now, catatan: catatan || null }, { where: { id_fee: ids }, transaction: t });
    const perUser = new Map();
    for (const f of fees) perUser.set(f.psikolog.id_user, (perUser.get(f.psikolog.id_user) || 0) + Number(f.nominal_fee));
    for (const [idUser, total] of perUser) {
      await notif.kirim({ idUser, tipe: TIPE_NOTIF.FEE, transaction: t, judul: 'Fee telah dicairkan', pesan: `Fee sebesar ${rupiah(total)} telah ditransfer oleh Direksi AROFTA PADC.${catatan ? `\nCatatan: ${catatan}` : ''}` });
    }
  });
  return { jumlah: fees.length, total: fees.reduce((a, f) => a + Number(f.nominal_fee), 0) };
}

module.exports = { rekapPerPsikolog, detailPsikolog, bayar, periode };
