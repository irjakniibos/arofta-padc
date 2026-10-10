/**
 * Alur booking klien: pilih layanan + slot -> sesi Terdaftar + tagihan transfer manual,
 * konfirmasi "sudah transfer", dan pembatalan (KF-02, KF-10).
 */
const { Op, Transaction } = require('sequelize');
const {
  sequelize, Klien, Layanan, JadwalPsikolog, Psikolog, User, SesiAsesmen, Pembayaran, LaporanAsesmen, Ulasan,
} = require('../models');
const { STATUS_SESI, STATUS_BAYAR, STATUS_SLOT, TIPE_SESI, TIPE_NOTIF, SETTING, STATUS_LAPORAN } = require('../config/constants');
const AppError = require('../utils/AppError');
const { generateKodeBooking } = require('../utils/codes');
const { combineDateTime, addHours, formatTanggalIndo, toDateString } = require('../utils/date');
const { getPagination, buildMeta } = require('../utils/pagination');
const klienService = require('./klien.service');
const pengaturan = require('./pengaturan.service');
const notif = require('./notifikasi.service');

const rupiah = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;

async function infoPembayaran() {
  const p = await pengaturan.getPublic();
  return {
    bank_nama: p[SETTING.BANK_NAMA],
    bank_no_rekening: p[SETTING.BANK_REKENING],
    bank_atas_nama: p[SETTING.BANK_ATAS_NAMA],
    link_form_bukti_bayar: p[SETTING.LINK_FORM_BUKTI],
    kontak_whatsapp: p[SETTING.KONTAK_WA],
  };
}

async function create(idUser, data) {
  const klien = await klienService.assertOwner(idUser, data.id_klien);
  const layanan = await Layanan.findOne({ where: { id_layanan: data.id_layanan, is_active: true } });
  if (!layanan) throw AppError.notFound('Layanan tidak ditemukan atau tidak aktif');
  await klienService.assertIntakeLengkap(klien.id_klien, layanan.jenis_intake);

  const batasJam = await pengaturan.getNumber(SETTING.BATAS_BAYAR_JAM, 24);

  const result = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (t) => {
    // Kunci baris slot agar tidak bisa dipesan dua klien bersamaan
    const slot = await JadwalPsikolog.findByPk(data.id_jadwal, { transaction: t, lock: t.LOCK.UPDATE });
    if (!slot || slot.status_slot !== STATUS_SLOT.TERSEDIA) throw AppError.conflict('Slot jadwal sudah tidak tersedia, silakan pilih jadwal lain');
    const mulai = combineDateTime(slot.tanggal, slot.jam_mulai);
    if (mulai <= addHours(new Date(), 2)) throw AppError.badRequest('Booking paling lambat 2 jam sebelum jadwal dimulai');
    if (slot.tipe_sesi !== TIPE_SESI.KEDUANYA && slot.tipe_sesi !== data.tipe_sesi) {
      throw AppError.badRequest(`Slot ini hanya untuk sesi ${slot.tipe_sesi}`);
    }
    const psikolog = await Psikolog.findByPk(slot.id_psikolog, { include: [{ model: User, as: 'akun', attributes: ['id_user', 'is_active'] }], transaction: t });
    if (!psikolog || !psikolog.akun.is_active) throw AppError.conflict('Psikolog tidak tersedia');

    const bentrok = await SesiAsesmen.findOne({
      where: { id_klien: klien.id_klien, tanggal: slot.tanggal, waktu: slot.jam_mulai, status_asesmen: { [Op.ne]: STATUS_SESI.BATAL } },
      transaction: t,
    });
    if (bentrok) throw AppError.conflict('Profil ini sudah memiliki sesi pada jadwal yang sama');

    let kode;
    for (let i = 0; i < 5; i += 1) {
      kode = generateKodeBooking();
      if (!(await SesiAsesmen.count({ where: { kode_booking: kode }, transaction: t }))) break;
    }

    const sesi = await SesiAsesmen.create({
      kode_booking: kode,
      id_klien: klien.id_klien,
      id_psikolog: slot.id_psikolog,
      id_layanan: layanan.id_layanan,
      id_jadwal: slot.id_jadwal,
      tanggal: slot.tanggal,
      waktu: slot.jam_mulai,
      tipe_sesi: data.tipe_sesi,
      catatan_klien: data.catatan_klien || null,
    }, { transaction: t });
    await slot.update({ status_slot: STATUS_SLOT.DIPESAN }, { transaction: t });

    // Batas bayar tidak boleh melewati 3 jam sebelum sesi
    const batas = new Date(Math.min(addHours(new Date(), batasJam).getTime(), addHours(mulai, -3).getTime()));
    const bayar = await Pembayaran.create({ id_sesi: sesi.id_sesi, total_bayar: layanan.harga, batas_bayar: batas }, { transaction: t });

    const info = await infoPembayaran();
    await notif.kirim({
      idUser, idSesi: sesi.id_sesi, tipe: TIPE_NOTIF.PEMBAYARAN, transaction: t,
      judul: `Booking ${kode} berhasil — selesaikan pembayaran`,
      pesan: `Layanan: ${layanan.nama_layanan}\nJadwal: ${formatTanggalIndo(slot.tanggal)} pukul ${String(slot.jam_mulai).slice(0, 5)} WIB (${data.tipe_sesi})\n`
        + `Total: ${rupiah(layanan.harga)}\nTransfer ke ${info.bank_nama} ${info.bank_no_rekening} a.n. ${info.bank_atas_nama}, lalu unggah bukti melalui: ${info.link_form_bukti_bayar}\n`
        + 'Setelah itu tekan tombol "Saya Sudah Transfer" di halaman pembayaran.',
    });
    await notif.kirimKeAdmin({
      idSesi: sesi.id_sesi, tipe: TIPE_NOTIF.JADWAL, transaction: t,
      judul: `Booking baru ${kode}`,
      pesan: `${klien.nama_lengkap} memesan ${layanan.nama_layanan} pada ${formatTanggalIndo(slot.tanggal)} ${String(slot.jam_mulai).slice(0, 5)}.`,
    });
    return { sesi, bayar };
  });

  return detailMilik(idUser, result.sesi.id_sesi);
}

const SESI_INCLUDE = [
  { model: Klien, as: 'klien', attributes: ['id_klien', 'nama_lengkap', 'nomor_rekam_psikologi', 'id_user'] },
  { model: Layanan, as: 'layanan', attributes: ['id_layanan', 'nama_layanan', 'kategori', 'durasi_menit'] },
  { model: Psikolog, as: 'psikolog', attributes: ['id_psikolog', 'nama_lengkap', 'spesialisasi'] },
  { model: Pembayaran, as: 'pembayaran', attributes: { exclude: ['diverifikasi_oleh'] } },
  { model: LaporanAsesmen, as: 'laporan', attributes: ['id_laporan', 'status_laporan', 'tanggal_final'] },
  { model: Ulasan, as: 'ulasan', attributes: ['id_ulasan', 'rating', 'komentar', 'created_at'] },
];

async function listMilik(idUser, query) {
  const pg = getPagination(query);
  const where = {};
  if (query.status) where.status_asesmen = query.status;
  if (query.id_klien) where.id_klien = query.id_klien;
  if (query.waktu === 'mendatang') where.tanggal = { [Op.gte]: toDateString() };
  if (query.waktu === 'lampau') where.tanggal = { [Op.lt]: toDateString() };
  const { rows, count } = await SesiAsesmen.findAndCountAll({
    where,
    attributes: ['id_sesi', 'kode_booking', 'tanggal', 'waktu', 'tipe_sesi', 'status_asesmen', 'created_at'],
    include: SESI_INCLUDE.map((inc) => (inc.as === 'klien' ? { ...inc, where: { id_user: idUser } } : inc)),
    order: [['tanggal', 'DESC'], ['waktu', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
    distinct: true,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function findMilik(idUser, idSesi, t) {
  const sesi = await SesiAsesmen.findOne({
    where: { id_sesi: idSesi },
    include: [{ model: Klien, as: 'klien', where: { id_user: idUser }, attributes: ['id_klien', 'id_user', 'nama_lengkap'] }],
    transaction: t,
    lock: t ? t.LOCK.UPDATE : undefined,
  });
  if (!sesi) throw AppError.notFound('Sesi tidak ditemukan');
  return sesi;
}

async function detailMilik(idUser, idSesi) {
  await findMilik(idUser, idSesi);
  const sesi = await SesiAsesmen.findByPk(idSesi, {
    attributes: { exclude: ['reminder_terkirim', 'id_jadwal'] },
    include: SESI_INCLUDE,
  });
  const data = sesi.toJSON();
  const lunas = data.pembayaran && data.pembayaran.status_pembayaran === STATUS_BAYAR.LUNAS;
  if (!lunas) data.tautan_zoom = null; // tautan hanya untuk sesi yang sudah lunas
  if (data.laporan && data.laporan.status_laporan !== STATUS_LAPORAN.FINAL) data.laporan = { status_laporan: 'Diproses' };
  data.info_pembayaran = await infoPembayaran();
  return data;
}

async function konfirmasiBayar(idUser, idSesi) {
  const sesi = await findMilik(idUser, idSesi);
  const bayar = await Pembayaran.findOne({ where: { id_sesi: sesi.id_sesi } });
  if (sesi.status_asesmen === STATUS_SESI.BATAL) throw AppError.conflict('Sesi sudah dibatalkan');
  if (![STATUS_BAYAR.MENUNGGU_PEMBAYARAN, STATUS_BAYAR.DITOLAK].includes(bayar.status_pembayaran)) {
    throw AppError.conflict(`Status pembayaran saat ini: ${bayar.status_pembayaran}`);
  }
  await bayar.update({ status_pembayaran: STATUS_BAYAR.MENUNGGU_VERIFIKASI, tanggal_konfirmasi: new Date() });
  await notif.kirimKeAdmin({
    idSesi: sesi.id_sesi, tipe: TIPE_NOTIF.PEMBAYARAN, email: true,
    judul: `Konfirmasi transfer ${sesi.kode_booking}`,
    pesan: `${sesi.klien.nama_lengkap} menyatakan sudah transfer ${rupiah(bayar.total_bayar)}. Silakan cek bukti di Google Form lalu verifikasi.`,
  });
  return detailMilik(idUser, idSesi);
}

async function batalOlehKlien(idUser, idSesi, alasan) {
  await sequelize.transaction(async (t) => {
    const sesi = await findMilik(idUser, idSesi, t);
    const bayar = await Pembayaran.findOne({ where: { id_sesi: sesi.id_sesi }, transaction: t });
    if (sesi.status_asesmen !== STATUS_SESI.TERDAFTAR) throw AppError.conflict('Sesi tidak dapat dibatalkan');
    if (bayar && [STATUS_BAYAR.LUNAS, STATUS_BAYAR.MENUNGGU_VERIFIKASI].includes(bayar.status_pembayaran)) {
      throw AppError.conflict('Pembayaran sudah dikirim/terverifikasi. Hubungi admin untuk pembatalan dan pengembalian dana');
    }
    await batalkan(sesi, alasan || 'Dibatalkan oleh klien', t);
  });
  return detailMilik(idUser, idSesi);
}

/** Membatalkan sesi: status Batal, tagihan Batal (jika belum lunas), slot dibuka kembali. */
async function batalkan(sesi, alasan, t) {
  await sesi.update({ status_asesmen: STATUS_SESI.BATAL, alasan_batal: alasan }, { transaction: t });
  await Pembayaran.update(
    { status_pembayaran: STATUS_BAYAR.BATAL },
    { where: { id_sesi: sesi.id_sesi, status_pembayaran: { [Op.ne]: STATUS_BAYAR.LUNAS } }, transaction: t },
  );
  if (sesi.id_jadwal) {
    const slot = await JadwalPsikolog.findByPk(sesi.id_jadwal, { transaction: t });
    const masihAkanDatang = slot && combineDateTime(slot.tanggal, slot.jam_mulai) > new Date();
    await sesi.update({ id_jadwal: null }, { transaction: t });
    if (slot) await slot.update({ status_slot: masihAkanDatang ? STATUS_SLOT.TERSEDIA : STATUS_SLOT.DITUTUP }, { transaction: t });
  }
}

module.exports = { create, listMilik, detailMilik, konfirmasiBayar, batalOlehKlien, batalkan, infoPembayaran, rupiah };
