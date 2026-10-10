/**
 * Pengelolaan sesi asesmen: monitoring status (KF-05/06), alokasi psikolog (KF-03),
 * tautan sesi daring (KF-15..17), perubahan status, dan pembuatan fee otomatis.
 */
const { Op } = require('sequelize');
const {
  sequelize, SesiAsesmen, Klien, Layanan, Psikolog, Pembayaran, LaporanAsesmen, JadwalPsikolog, LayananFee, RekapFee,
  AnamnesisSesi, ObservasiMental, CatatanSoap, KategoriFee,
} = require('../models');
const { STATUS_SESI, TRANSISI_SESI, STATUS_BAYAR, STATUS_SLOT, TIPE_SESI, TIPE_NOTIF } = require('../config/constants');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { formatTanggalIndo, combineDateTime } = require('../utils/date');
const klienService = require('./klien.service');
const notif = require('./notifikasi.service');
const booking = require('./booking.service');

const LIST_INCLUDE = [
  { model: Klien, as: 'klien', attributes: ['id_klien', 'nama_lengkap', 'nomor_rekam_psikologi'] },
  { model: Layanan, as: 'layanan', attributes: ['id_layanan', 'nama_layanan', 'kategori'] },
  { model: Psikolog, as: 'psikolog', attributes: ['id_psikolog', 'nama_lengkap'] },
  { model: Pembayaran, as: 'pembayaran', attributes: ['id_pembayaran', 'status_pembayaran', 'total_bayar'] },
  { model: LaporanAsesmen, as: 'laporan', attributes: ['id_laporan', 'status_laporan'] },
];

function buildWhere(query) {
  const where = {};
  if (query.status) where.status_asesmen = query.status;
  if (query.tipe_sesi) where.tipe_sesi = query.tipe_sesi;
  if (query.id_psikolog) where.id_psikolog = query.id_psikolog;
  if (query.id_layanan) where.id_layanan = query.id_layanan;
  if (query.dari || query.sampai) {
    where.tanggal = {};
    if (query.dari) where.tanggal[Op.gte] = query.dari;
    if (query.sampai) where.tanggal[Op.lte] = query.sampai;
  }
  if (query.q) {
    where[Op.or] = [
      { kode_booking: { [Op.like]: `%${query.q}%` } },
      { '$klien.nama_lengkap$': { [Op.like]: `%${query.q}%` } },
    ];
  }
  return where;
}

async function list(query, scope = {}) {
  const pg = getPagination(query);
  const where = { ...buildWhere(query), ...scope };
  const include = LIST_INCLUDE.map((i) => {
    if (i.as === 'pembayaran' && query.status_pembayaran) return { ...i, where: { status_pembayaran: query.status_pembayaran } };
    return i;
  });
  const { rows, count } = await SesiAsesmen.findAndCountAll({
    where,
    attributes: ['id_sesi', 'kode_booking', 'tanggal', 'waktu', 'tipe_sesi', 'status_asesmen', 'tautan_zoom', 'lokasi_ruangan', 'created_at'],
    include,
    order: query.urut === 'terbaru' ? [['created_at', 'DESC']] : [['tanggal', 'ASC'], ['waktu', 'ASC']],
    limit: pg.limit,
    offset: pg.offset,
    distinct: true,
    subQuery: false,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function ringkasanStatus(scope = {}) {
  const rows = await SesiAsesmen.findAll({
    where: scope,
    attributes: ['status_asesmen', [sequelize.fn('COUNT', sequelize.col('id_sesi')), 'jumlah']],
    group: ['status_asesmen'],
    raw: true,
  });
  const out = Object.fromEntries(Object.values(STATUS_SESI).map((s) => [s, 0]));
  rows.forEach((r) => { out[r.status_asesmen] = Number(r.jumlah); });
  return out;
}

async function findSesi(idSesi, scope = {}) {
  const s = await SesiAsesmen.findOne({ where: { id_sesi: idSesi, ...scope } });
  if (!s) throw AppError.notFound('Sesi tidak ditemukan');
  return s;
}

async function detail(idSesi, scope = {}) {
  const s = await findSesi(idSesi, scope);
  const sesi = await SesiAsesmen.findByPk(s.id_sesi, {
    include: [
      ...LIST_INCLUDE.filter((i) => !['klien', 'pembayaran', 'layanan'].includes(i.as)),
      { model: Layanan, as: 'layanan', attributes: ['id_layanan', 'nama_layanan', 'kategori', 'jenis_intake'] },
      { model: Pembayaran, as: 'pembayaran' },
      { model: AnamnesisSesi, as: 'anamnesis' },
      { model: ObservasiMental, as: 'observasi' },
      { model: CatatanSoap, as: 'soap' },
    ],
  });
  const data = sesi.toJSON();
  data.klien = await klienService.getDetailLengkap(sesi.id_klien);
  data.riwayat_sesi_klien = await klienService.riwayatSesi(sesi.id_klien);
  return data;
}

/** Membuat rekap fee psikolog dari tarif fee layanan saat sesi selesai. */
async function buatFee(sesi, t) {
  const tarif = await LayananFee.findAll({ where: { id_layanan: sesi.id_layanan }, include: [{ model: KategoriFee, as: 'kategori', attributes: ['nama_kategori'] }], transaction: t });
  for (const f of tarif) {
    await RekapFee.findOrCreate({
      where: { id_sesi: sesi.id_sesi, id_kategori_fee: f.id_kategori_fee },
      defaults: { id_psikolog: sesi.id_psikolog, nominal_fee: f.nominal },
      transaction: t,
    });
  }
  return tarif.reduce((sum, f) => sum + Number(f.nominal), 0);
}

async function ubahStatus(idSesi, statusBaru, scope = {}, alasan = null) {
  return sequelize.transaction(async (t) => {
    const sesi = await SesiAsesmen.findOne({
      where: { id_sesi: idSesi, ...scope },
      include: [
        { model: Pembayaran, as: 'pembayaran' },
        { model: Klien, as: 'klien', attributes: ['id_user', 'nama_lengkap'] },
        { model: Psikolog, as: 'psikolog', attributes: ['id_user'] },
        { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!sesi) throw AppError.notFound('Sesi tidak ditemukan');
    const allowed = TRANSISI_SESI[sesi.status_asesmen] || [];
    if (!allowed.includes(statusBaru)) throw AppError.conflict(`Status ${sesi.status_asesmen} tidak dapat diubah menjadi ${statusBaru}`);

    if (statusBaru === STATUS_SESI.BATAL) {
      await booking.batalkan(sesi, alasan || 'Dibatalkan oleh admin', t);
      await notif.kirim({
        idUser: sesi.klien.id_user, idSesi, tipe: TIPE_NOTIF.JADWAL, transaction: t,
        judul: `Sesi ${sesi.kode_booking} dibatalkan`,
        pesan: `Sesi ${sesi.layanan.nama_layanan} dibatalkan. Alasan: ${alasan || '-'}. Hubungi admin untuk penjadwalan ulang atau pengembalian dana.`,
      });
      await notif.kirim({ idUser: sesi.psikolog.id_user, idSesi, tipe: TIPE_NOTIF.JADWAL, transaction: t, email: false, judul: `Sesi ${sesi.kode_booking} dibatalkan`, pesan: `Alasan: ${alasan || '-'}` });
      return { status_asesmen: STATUS_SESI.BATAL };
    }

    if (!sesi.pembayaran || sesi.pembayaran.status_pembayaran !== STATUS_BAYAR.LUNAS) {
      throw AppError.conflict('Sesi belum dapat dimulai karena pembayaran belum lunas');
    }
    if (statusBaru === STATUS_SESI.BERJALAN && combineDateTime(sesi.tanggal, sesi.waktu) > new Date(Date.now() + 60 * 60000)) {
      throw AppError.conflict('Sesi baru dapat dimulai maksimal 1 jam sebelum jadwal');
    }

    await sesi.update({ status_asesmen: statusBaru }, { transaction: t });
    let totalFee = 0;
    if (statusBaru === STATUS_SESI.SELESAI) {
      totalFee = await buatFee(sesi, t);
      await notif.kirim({
        idUser: sesi.psikolog.id_user, idSesi, tipe: TIPE_NOTIF.FEE, email: false, transaction: t,
        judul: `Fee sesi ${sesi.kode_booking} tercatat`,
        pesan: `Fee sebesar ${booking.rupiah(totalFee)} tercatat dan menunggu pencairan oleh Direksi.`,
      });
    }
    return { status_asesmen: statusBaru, total_fee: totalFee };
  });
}

/** Admin mengalokasikan/mengganti psikolog dan slot jadwal sesi (KF-03). */
async function alokasi(idSesi, { id_jadwal: idJadwal }) {
  await sequelize.transaction(async (t) => {
    const sesi = await SesiAsesmen.findByPk(idSesi, {
      include: [{ model: Klien, as: 'klien', attributes: ['id_user'] }, { model: Psikolog, as: 'psikolog', attributes: ['id_user'] }],
      transaction: t, lock: t.LOCK.UPDATE,
    });
    if (!sesi) throw AppError.notFound('Sesi tidak ditemukan');
    if (sesi.status_asesmen !== STATUS_SESI.TERDAFTAR) throw AppError.conflict('Hanya sesi berstatus Terdaftar yang dapat dijadwalkan ulang');
    const slot = await JadwalPsikolog.findByPk(idJadwal, { transaction: t, lock: t.LOCK.UPDATE, include: [{ model: Psikolog, as: 'psikolog', attributes: ['id_user', 'nama_lengkap'] }] });
    if (!slot || slot.status_slot !== STATUS_SLOT.TERSEDIA) throw AppError.conflict('Slot tujuan tidak tersedia');
    if (combineDateTime(slot.tanggal, slot.jam_mulai) <= new Date()) throw AppError.badRequest('Slot tujuan sudah lewat');
    if (slot.tipe_sesi !== TIPE_SESI.KEDUANYA && slot.tipe_sesi !== sesi.tipe_sesi) throw AppError.badRequest(`Slot tujuan hanya untuk sesi ${slot.tipe_sesi}`);

    if (sesi.id_jadwal) await JadwalPsikolog.update({ status_slot: STATUS_SLOT.TERSEDIA }, { where: { id_jadwal: sesi.id_jadwal }, transaction: t });
    const psikologLama = sesi.psikolog.id_user;
    await sesi.update({ id_jadwal: null }, { transaction: t });
    await sesi.update({ id_jadwal: slot.id_jadwal, id_psikolog: slot.id_psikolog, tanggal: slot.tanggal, waktu: slot.jam_mulai, reminder_terkirim: false }, { transaction: t });
    await slot.update({ status_slot: STATUS_SLOT.DIPESAN }, { transaction: t });

    const jadwal = `${formatTanggalIndo(slot.tanggal)} pukul ${String(slot.jam_mulai).slice(0, 5)} WIB`;
    await notif.kirim({ idUser: sesi.klien.id_user, idSesi, tipe: TIPE_NOTIF.JADWAL, transaction: t, judul: `Perubahan jadwal sesi ${sesi.kode_booking}`, pesan: `Jadwal sesi Anda menjadi ${jadwal} bersama ${slot.psikolog.nama_lengkap}.` });
    await notif.kirim({ idUser: slot.psikolog.id_user, idSesi, tipe: TIPE_NOTIF.JADWAL, transaction: t, judul: `Penugasan sesi ${sesi.kode_booking}`, pesan: `Anda ditugaskan pada sesi ${jadwal}.` });
    if (psikologLama !== slot.psikolog.id_user) {
      await notif.kirim({ idUser: psikologLama, idSesi, tipe: TIPE_NOTIF.JADWAL, email: false, transaction: t, judul: `Sesi ${sesi.kode_booking} dialihkan`, pesan: 'Sesi ini dialihkan ke psikolog lain oleh admin.' });
    }
  });
  return detail(idSesi);
}

/** Admin menginput tautan Zoom (online) atau lokasi ruangan (offline), lalu dikirim ke klien & psikolog. */
async function setTautan(idSesi, data) {
  const sesi = await SesiAsesmen.findByPk(idSesi, {
    include: [
      { model: Pembayaran, as: 'pembayaran', attributes: ['status_pembayaran'] },
      { model: Klien, as: 'klien', attributes: ['id_user'] },
      { model: Psikolog, as: 'psikolog', attributes: ['id_user'] },
      { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] },
    ],
  });
  if (!sesi) throw AppError.notFound('Sesi tidak ditemukan');
  if ([STATUS_SESI.SELESAI, STATUS_SESI.BATAL].includes(sesi.status_asesmen)) throw AppError.conflict('Sesi sudah selesai/batal');
  if (!sesi.pembayaran || sesi.pembayaran.status_pembayaran !== STATUS_BAYAR.LUNAS) throw AppError.conflict('Tautan/lokasi dikirim setelah pembayaran lunas');

  const values = {};
  if (sesi.tipe_sesi === TIPE_SESI.ONLINE) {
    if (!data.tautan_zoom) throw AppError.badRequest('Tautan sesi daring wajib diisi untuk sesi Online');
    values.tautan_zoom = data.tautan_zoom;
  } else {
    if (!data.lokasi_ruangan) throw AppError.badRequest('Lokasi ruangan wajib diisi untuk sesi Offline');
    values.lokasi_ruangan = data.lokasi_ruangan;
  }
  await sesi.update(values);

  const jadwal = `${formatTanggalIndo(sesi.tanggal)} pukul ${String(sesi.waktu).slice(0, 5)} WIB`;
  const isi = sesi.tipe_sesi === TIPE_SESI.ONLINE ? `Tautan sesi daring: ${values.tautan_zoom}` : `Lokasi: ${values.lokasi_ruangan}`;
  for (const idUser of [sesi.klien.id_user, sesi.psikolog.id_user]) {
    await notif.kirim({
      idUser, idSesi, tipe: TIPE_NOTIF.TAUTAN,
      judul: `${sesi.tipe_sesi === TIPE_SESI.ONLINE ? 'Tautan' : 'Lokasi'} sesi ${sesi.kode_booking}`,
      pesan: `Sesi ${sesi.layanan.nama_layanan} pada ${jadwal}.\n${isi}`,
      cta: sesi.tipe_sesi === TIPE_SESI.ONLINE ? { label: 'Buka Tautan Sesi', url: values.tautan_zoom } : null,
    });
  }
  return detail(idSesi);
}

module.exports = { list, ringkasanStatus, detail, findSesi, ubahStatus, alokasi, setTautan, buatFee };
