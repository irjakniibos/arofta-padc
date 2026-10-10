/** Verifikasi pembayaran transfer manual oleh Admin/Direksi & pembatalan otomatis tagihan kedaluwarsa. */
const { Op } = require('sequelize');
const { sequelize, Pembayaran, SesiAsesmen, Klien, Layanan, Psikolog, User } = require('../models');
const { STATUS_BAYAR, STATUS_SESI, TIPE_NOTIF } = require('../config/constants');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { formatTanggalIndo } = require('../utils/date');
const notif = require('./notifikasi.service');
const booking = require('./booking.service');
const logger = require('../utils/logger');

const INCLUDE = [{
  model: SesiAsesmen, as: 'sesi', attributes: ['id_sesi', 'kode_booking', 'tanggal', 'waktu', 'tipe_sesi', 'status_asesmen'],
  include: [
    { model: Klien, as: 'klien', attributes: ['id_klien', 'id_user', 'nama_lengkap', 'no_hp'] },
    { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] },
    { model: Psikolog, as: 'psikolog', attributes: ['id_psikolog', 'id_user', 'nama_lengkap'] },
  ],
}, { model: User, as: 'verifikator', attributes: ['email'] }];

async function list(query) {
  const pg = getPagination(query);
  const where = {};
  if (query.status) where.status_pembayaran = query.status;
  const { rows, count } = await Pembayaran.findAndCountAll({
    where, include: INCLUDE, order: [['updated_at', 'DESC']], limit: pg.limit, offset: pg.offset, distinct: true,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function detail(id) {
  const p = await Pembayaran.findByPk(id, { include: INCLUDE });
  if (!p) throw AppError.notFound('Pembayaran tidak ditemukan');
  return p;
}

/** status: 'Lunas' | 'Ditolak' */
async function verifikasi(id, { status, catatan_admin: catatan }, adminUser) {
  const allowedFrom = [STATUS_BAYAR.MENUNGGU_VERIFIKASI, STATUS_BAYAR.MENUNGGU_PEMBAYARAN, STATUS_BAYAR.DITOLAK];
  await sequelize.transaction(async (t) => {
    const p = await Pembayaran.findByPk(id, { include: INCLUDE, transaction: t, lock: t.LOCK.UPDATE });
    if (!p) throw AppError.notFound('Pembayaran tidak ditemukan');
    if (p.sesi.status_asesmen === STATUS_SESI.BATAL) throw AppError.conflict('Sesi sudah dibatalkan');
    if (!allowedFrom.includes(p.status_pembayaran)) throw AppError.conflict(`Pembayaran berstatus ${p.status_pembayaran} tidak dapat diverifikasi`);
    if (status === STATUS_BAYAR.DITOLAK && !catatan) throw AppError.badRequest('Alasan penolakan wajib diisi');

    await p.update({ status_pembayaran: status, catatan_admin: catatan || null, diverifikasi_oleh: adminUser.id_user, tanggal_verifikasi: new Date() }, { transaction: t });

    const s = p.sesi;
    const jadwal = `${formatTanggalIndo(s.tanggal)} pukul ${String(s.waktu).slice(0, 5)} WIB`;
    if (status === STATUS_BAYAR.LUNAS) {
      await notif.kirim({
        idUser: s.klien.id_user, idSesi: s.id_sesi, tipe: TIPE_NOTIF.PEMBAYARAN, transaction: t,
        judul: `Pembayaran ${s.kode_booking} terverifikasi`,
        pesan: `Pembayaran Anda untuk ${s.layanan.nama_layanan} telah diterima. Jadwal sesi: ${jadwal} (${s.tipe_sesi}). `
          + (s.tipe_sesi === 'Online' ? 'Tautan sesi daring akan dikirim sebelum jadwal.' : 'Detail lokasi akan dikirim sebelum jadwal.'),
      });
      await notif.kirim({
        idUser: s.psikolog.id_user, idSesi: s.id_sesi, tipe: TIPE_NOTIF.JADWAL, transaction: t,
        judul: `Jadwal sesi baru ${s.kode_booking}`,
        pesan: `Sesi ${s.layanan.nama_layanan} bersama ${s.klien.nama_lengkap} pada ${jadwal} (${s.tipe_sesi}) telah dikonfirmasi.`,
      });
    } else {
      await notif.kirim({
        idUser: s.klien.id_user, idSesi: s.id_sesi, tipe: TIPE_NOTIF.PEMBAYARAN, transaction: t,
        judul: `Pembayaran ${s.kode_booking} belum dapat diverifikasi`,
        pesan: `Alasan: ${catatan}\nSilakan periksa kembali bukti transfer Anda, lalu konfirmasi ulang di halaman pembayaran.`,
      });
    }
  });
  return detail(id);
}

/** Job: tagihan yang melewati batas bayar dibatalkan otomatis dan slot dibuka kembali. */
async function batalkanKedaluwarsa() {
  const expired = await Pembayaran.findAll({
    where: { status_pembayaran: STATUS_BAYAR.MENUNGGU_PEMBAYARAN, batas_bayar: { [Op.lt]: new Date() } },
    attributes: ['id_pembayaran', 'id_sesi'],
    limit: 100,
  });
  let jumlah = 0;
  for (const e of expired) {
    try {
      await sequelize.transaction(async (t) => {
        const sesi = await SesiAsesmen.findByPk(e.id_sesi, { include: [{ model: Klien, as: 'klien', attributes: ['id_user'] }], transaction: t, lock: t.LOCK.UPDATE });
        if (!sesi || sesi.status_asesmen !== STATUS_SESI.TERDAFTAR) return;
        await booking.batalkan(sesi, 'Dibatalkan otomatis: melewati batas waktu pembayaran', t);
        await notif.kirim({
          idUser: sesi.klien.id_user, idSesi: sesi.id_sesi, tipe: TIPE_NOTIF.PEMBAYARAN, transaction: t,
          judul: `Booking ${sesi.kode_booking} dibatalkan`,
          pesan: 'Booking dibatalkan otomatis karena pembayaran tidak dikonfirmasi sampai batas waktu. Silakan lakukan booking ulang.',
        });
      });
      jumlah += 1;
    } catch (err) {
      logger.error('Gagal membatalkan tagihan kedaluwarsa', e.id_pembayaran, err.message);
    }
  }
  return jumlah;
}

module.exports = { list, detail, verifikasi, batalkanKedaluwarsa };
