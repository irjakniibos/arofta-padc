/**
 * Alur booking: klien memilih layanan + slot -> sesi Terdaftar + tagihan transfer manual,
 * konfirmasi pembayaran via WhatsApp, pembatalan (KF-02, KF-10), dan booking oleh Admin
 * untuk kebutuhan mendesak/walk-in yang langsung Lunas (KF-29).
 */
const { Op, Transaction } = require('sequelize');
const {
  sequelize, Klien, Layanan, JadwalPsikolog, Psikolog, User, SesiAsesmen, Pembayaran, LaporanAsesmen, Ulasan,
} = require('../models');
const {
  ROLES, STATUS_SESI, STATUS_BAYAR, STATUS_SLOT, TIPE_SESI, TIPE_NOTIF, SETTING, STATUS_LAPORAN, VERSI_PERSETUJUAN,
} = require('../config/constants');
const AppError = require('../utils/AppError');
const { generateKodeBooking, generateNomorRekam, generateToken } = require('../utils/codes');
const { combineDateTime, addHours, formatTanggalIndo, formatWaktuIndo, toDateString } = require('../utils/date');
const { getPagination, buildMeta } = require('../utils/pagination');
const klienService = require('./klien.service');
const jadwalService = require('./jadwal.service');
const authService = require('./auth.service');
const pengaturan = require('./pengaturan.service');
const notif = require('./notifikasi.service');
const logger = require('../utils/logger');

const rupiah = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;
const jam = (waktu) => String(waktu).slice(0, 5);

async function infoPembayaran() {
  const p = await pengaturan.getPublic();
  return {
    bank_nama: p[SETTING.BANK_NAMA],
    bank_no_rekening: p[SETTING.BANK_REKENING],
    bank_atas_nama: p[SETTING.BANK_ATAS_NAMA],
    kontak_whatsapp: p[SETTING.KONTAK_WA],
  };
}

/** Aturan waktu booking & pembayaran yang dapat diubah Admin di menu Pengaturan. */
async function aturanBooking() {
  const [batasBookingJam, batasBayarJam, sebelumSesiJam, maksBelumBayar] = await Promise.all([
    pengaturan.getNumber(SETTING.BATAS_BOOKING_JAM, 3),
    pengaturan.getNumber(SETTING.BATAS_BAYAR_JAM, 24),
    pengaturan.getNumber(SETTING.BATAS_BAYAR_SEBELUM_SESI_JAM, 1),
    pengaturan.getNumber(SETTING.MAKS_BOOKING_BELUM_BAYAR, 5),
  ]);
  return { batasBookingJam, batasBayarJam, sebelumSesiJam, maksBelumBayar };
}

/**
 * Batas bayar = yang lebih dulu antara (sekarang + batasBayarJam) dan (mulai sesi - sebelumSesiJam),
 * tetapi tidak pernah kurang dari 30 menit dari sekarang agar tagihan tidak langsung kedaluwarsa.
 */
function hitungBatasBayar(mulai, aturan, dari = new Date()) {
  const batas = Math.min(addHours(dari, aturan.batasBayarJam).getTime(), addHours(mulai, -aturan.sebelumSesiJam).getTime());
  const minimal = Math.min(dari.getTime() + 30 * 60000, mulai.getTime());
  return new Date(Math.max(batas, minimal));
}

/** Jumlah booking akun klien yang masih menunggu pembayaran (dibatasi agar slot tidak ditimbun). */
async function hitungBelumBayar(idUser, t) {
  return SesiAsesmen.count({
    where: { status_asesmen: STATUS_SESI.TERDAFTAR },
    include: [
      { model: Klien, as: 'klien', where: { id_user: idUser }, attributes: [] },
      { model: Pembayaran, as: 'pembayaran', where: { status_pembayaran: [STATUS_BAYAR.MENUNGGU_PEMBAYARAN, STATUS_BAYAR.DITOLAK] }, attributes: [] },
    ],
    transaction: t,
  });
}

async function generateKodeUnik(t) {
  let kode;
  for (let i = 0; i < 5; i += 1) {
    kode = generateKodeBooking();
    if (!(await SesiAsesmen.count({ where: { kode_booking: kode }, transaction: t }))) break;
  }
  return kode;
}

async function assertPsikologAktif(idPsikolog, t) {
  const psikolog = await Psikolog.findByPk(idPsikolog, { include: [{ model: User, as: 'akun', attributes: ['id_user', 'is_active'] }], transaction: t });
  if (!psikolog || !psikolog.akun.is_active) throw AppError.conflict('Psikolog tidak tersedia');
  return psikolog;
}

function assertTipeSlot(slot, tipeSesi) {
  if (slot.tipe_sesi !== TIPE_SESI.KEDUANYA && slot.tipe_sesi !== tipeSesi) {
    throw AppError.badRequest(`Slot ini hanya untuk sesi ${slot.tipe_sesi}`);
  }
}

async function assertTidakBentrok(idKlien, slot, t) {
  const bentrok = await SesiAsesmen.findOne({
    where: { id_klien: idKlien, tanggal: slot.tanggal, waktu: slot.jam_mulai, status_asesmen: { [Op.ne]: STATUS_SESI.BATAL } },
    transaction: t,
  });
  if (bentrok) throw AppError.conflict('Profil ini sudah memiliki sesi pada jadwal yang sama');
}

async function create(idUser, data) {
  const klien = await klienService.assertOwner(idUser, data.id_klien);
  const layanan = await Layanan.findOne({ where: { id_layanan: data.id_layanan, is_active: true } });
  if (!layanan) throw AppError.notFound('Layanan tidak ditemukan atau tidak aktif');
  await klienService.assertIntakeLengkap(klien.id_klien, layanan.jenis_intake);
  const aturan = await aturanBooking();

  const result = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (t) => {
    if (await hitungBelumBayar(idUser, t) >= aturan.maksBelumBayar) {
      throw AppError.conflict(`Anda masih memiliki ${aturan.maksBelumBayar} booking yang belum dibayar. Selesaikan pembayaran atau batalkan salah satunya sebelum booking baru`);
    }
    // Kunci baris slot agar tidak bisa dipesan dua klien bersamaan
    const slot = await JadwalPsikolog.findByPk(data.id_jadwal, { transaction: t, lock: t.LOCK.UPDATE });
    if (!slot || slot.status_slot !== STATUS_SLOT.TERSEDIA) throw AppError.conflict('Slot jadwal sudah tidak tersedia, silakan pilih jadwal lain');
    const mulai = combineDateTime(slot.tanggal, slot.jam_mulai);
    if (mulai <= addHours(new Date(), aturan.batasBookingJam)) {
      throw AppError.badRequest(`Booking online paling lambat ${aturan.batasBookingJam} jam sebelum jadwal. Untuk kebutuhan mendesak, hubungi admin melalui WhatsApp`);
    }
    assertTipeSlot(slot, data.tipe_sesi);
    await assertPsikologAktif(slot.id_psikolog, t);
    await assertTidakBentrok(klien.id_klien, slot, t);

    const kode = await generateKodeUnik(t);
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
      persetujuan_at: new Date(),
      persetujuan_versi: VERSI_PERSETUJUAN.INFORMED_CONSENT,
    }, { transaction: t });
    await slot.update({ status_slot: STATUS_SLOT.DIPESAN }, { transaction: t });

    const batas = hitungBatasBayar(mulai, aturan);
    const bayar = await Pembayaran.create({
      id_sesi: sesi.id_sesi, total_bayar: layanan.harga, harga_layanan: layanan.harga, batas_bayar: batas,
    }, { transaction: t });

    const info = await infoPembayaran();
    await notif.kirim({
      idUser, idSesi: sesi.id_sesi, tipe: TIPE_NOTIF.PEMBAYARAN, transaction: t,
      judul: `Booking ${kode} berhasil, selesaikan pembayaran`,
      pesan: `Layanan: ${layanan.nama_layanan}\nJadwal: ${formatTanggalIndo(slot.tanggal)} pukul ${jam(slot.jam_mulai)} WIB (${data.tipe_sesi})\n`
        + `Total: ${rupiah(layanan.harga)}\nBatas pembayaran: ${formatWaktuIndo(batas)}\n`
        + `Transfer ke ${info.bank_nama} ${info.bank_no_rekening} a.n. ${info.bank_atas_nama}, `
        + 'lalu tekan tombol "Konfirmasi via WhatsApp" di halaman pembayaran dan kirim foto bukti transfer.',
    });
    await notif.kirimKeAdmin({
      idSesi: sesi.id_sesi, tipe: TIPE_NOTIF.JADWAL, transaction: t,
      judul: `Booking baru ${kode}`,
      pesan: `${klien.nama_lengkap} memesan ${layanan.nama_layanan} pada ${formatTanggalIndo(slot.tanggal)} ${jam(slot.jam_mulai)}.`,
    });
    return { sesi, bayar };
  });

  return detailMilik(idUser, result.sesi.id_sesi);
}

/** Profil klien untuk booking Admin: klien terdaftar, profil tanpa akun login, atau akun baru (klien atur password lewat email). */
async function siapkanKlienAdmin(data, t) {
  if (data.klien_mode === 'terdaftar') {
    const k = await Klien.findByPk(data.id_klien, { transaction: t });
    if (!k) throw AppError.notFound('Klien tidak ditemukan');
    return { klien: k, userBaru: null };
  }
  let userBaru = null;
  if (data.klien_mode === 'buat_akun') {
    if (await User.findOne({ where: { email: data.email }, attributes: ['id_user'], transaction: t })) {
      throw AppError.conflict('Email sudah terdaftar. Pilih klien dari daftar klien terdaftar');
    }
    // Password acak yang tidak diketahui siapa pun; klien mengatur password sendiri lewat email undangan
    userBaru = await User.create({
      email: data.email, password: await authService.hashPassword(generateToken()), role: ROLES.KLIEN,
    }, { transaction: t });
  }
  const klien = await Klien.create({
    id_user: userBaru ? userBaru.id_user : null,
    hubungan_akun: 'Diri Sendiri',
    nama_lengkap: data.nama_lengkap,
    no_hp: data.no_hp || null,
    jenis_kelamin: data.jenis_kelamin || null,
    tanggal_lahir: data.tanggal_lahir || null,
  }, { transaction: t });
  await klien.update({ nomor_rekam_psikologi: generateNomorRekam(klien.id_klien) }, { transaction: t });
  return { klien, userBaru };
}

/** Slot untuk booking Admin: slot yang sudah ada, atau slot baru yang dibuat saat itu juga (walk-in). */
async function siapkanSlotAdmin(data, t) {
  const now = new Date();
  if (data.id_jadwal) {
    const slot = await JadwalPsikolog.findByPk(data.id_jadwal, { transaction: t, lock: t.LOCK.UPDATE });
    if (!slot || slot.status_slot !== STATUS_SLOT.TERSEDIA) throw AppError.conflict('Slot jadwal sudah tidak tersedia, silakan pilih jadwal lain');
    if (combineDateTime(slot.tanggal, slot.jam_selesai) <= now) throw AppError.badRequest('Slot jadwal sudah berakhir');
    return slot;
  }
  const mulai = jadwalService.norm(data.jam_mulai);
  const selesai = jadwalService.norm(data.jam_selesai);
  jadwalService.assertJam(mulai, selesai);
  if (combineDateTime(data.tanggal, selesai) <= now) throw AppError.badRequest('Jam sesi sudah berakhir');
  await assertPsikologAktif(data.id_psikolog, t);
  await jadwalService.assertNoOverlap(data.id_psikolog, data.tanggal, mulai, selesai);
  return JadwalPsikolog.create({
    id_psikolog: data.id_psikolog, tanggal: data.tanggal, jam_mulai: mulai, jam_selesai: selesai, tipe_sesi: data.tipe_sesi,
  }, { transaction: t });
}

/**
 * Booking oleh Admin untuk kebutuhan mendesak/walk-in (KF-29): tidak terikat batas waktu booking online,
 * pembayaran langsung Lunas (Tunai/Transfer), formulir intake boleh menyusul, dan nominal boleh diubah
 * dengan alasan. Fee psikolog tetap mengikuti tarif layanan.
 */
async function createOlehAdmin(adminUser, data) {
  const layanan = await Layanan.findOne({ where: { id_layanan: data.id_layanan, is_active: true } });
  if (!layanan) throw AppError.notFound('Layanan tidak ditemukan atau tidak aktif');
  const total = data.total_bayar === undefined || data.total_bayar === null ? Number(layanan.harga) : Number(data.total_bayar);
  const nominalBerubah = total !== Number(layanan.harga);
  if (nominalBerubah && !data.alasan_ubah_nominal) throw AppError.badRequest('Alasan perubahan nominal wajib diisi');

  let undangan = null;
  const sesi = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (t) => {
    const { klien, userBaru } = await siapkanKlienAdmin(data, t);
    const slot = await siapkanSlotAdmin(data, t);
    assertTipeSlot(slot, data.tipe_sesi);
    const psikolog = await assertPsikologAktif(slot.id_psikolog, t);
    await assertTidakBentrok(klien.id_klien, slot, t);

    const kode = await generateKodeUnik(t);
    const now = new Date();
    const baru = await SesiAsesmen.create({
      kode_booking: kode,
      id_klien: klien.id_klien,
      id_psikolog: slot.id_psikolog,
      id_layanan: layanan.id_layanan,
      id_jadwal: slot.id_jadwal,
      tanggal: slot.tanggal,
      waktu: slot.jam_mulai,
      tipe_sesi: data.tipe_sesi,
      catatan_klien: data.catatan_klien || null,
      persetujuan_at: now,
      persetujuan_versi: VERSI_PERSETUJUAN.INFORMED_CONSENT,
      dibuat_oleh: adminUser.id_user,
    }, { transaction: t });
    await slot.update({ status_slot: STATUS_SLOT.DIPESAN }, { transaction: t });
    await Pembayaran.create({
      id_sesi: baru.id_sesi,
      total_bayar: total,
      harga_layanan: layanan.harga,
      alasan_ubah_nominal: nominalBerubah ? data.alasan_ubah_nominal : null,
      metode_bayar: data.metode_bayar,
      status_pembayaran: STATUS_BAYAR.LUNAS,
      tanggal_konfirmasi: now,
      diverifikasi_oleh: adminUser.id_user,
      tanggal_verifikasi: now,
      catatan_admin: `Booking dibuat Admin, dibayar ${data.metode_bayar}`,
    }, { transaction: t });

    const jadwal = `${formatTanggalIndo(slot.tanggal)} pukul ${jam(slot.jam_mulai)} WIB`;
    await notif.kirim({
      idUser: psikolog.akun.id_user, idSesi: baru.id_sesi, tipe: TIPE_NOTIF.JADWAL, transaction: t,
      judul: `Jadwal sesi baru ${kode}`,
      pesan: `Sesi ${layanan.nama_layanan} bersama ${klien.nama_lengkap} pada ${jadwal} (${data.tipe_sesi}) dibuat oleh admin dan sudah lunas.`,
    });
    if (klien.id_user && !userBaru) {
      await notif.kirim({
        idUser: klien.id_user, idSesi: baru.id_sesi, tipe: TIPE_NOTIF.JADWAL, transaction: t,
        judul: `Sesi ${kode} telah dijadwalkan`,
        pesan: `Admin AROFTA PADC menjadwalkan ${layanan.nama_layanan} untuk ${klien.nama_lengkap} pada ${jadwal} (${data.tipe_sesi}). `
          + `Pembayaran ${rupiah(total)} sudah diterima.`,
      });
    }
    if (userBaru) undangan = { user: userBaru, url: await authService.buatTautanPassword(userBaru.id_user, authService.UNDANGAN_JAM * 60, t) };
    return baru;
  });

  if (undangan) authService.kirimUndangan(undangan.user, undangan.url).catch((e) => logger.error('Email undangan gagal:', e.message));
  return sesi;
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
    pesan: `${sesi.klien.nama_lengkap} mengonfirmasi transfer ${rupiah(bayar.total_bayar)} melalui WhatsApp. `
      + 'Cek foto bukti di WhatsApp dan mutasi rekening, lalu verifikasi di menu Verifikasi Pembayaran.',
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

module.exports = {
  create, createOlehAdmin, listMilik, detailMilik, konfirmasiBayar, batalOlehKlien, batalkan, infoPembayaran,
  aturanBooking, hitungBatasBayar, rupiah,
};
