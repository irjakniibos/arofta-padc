/**
 * Data untuk tampilan Kalender Jadwal.
 * - Klien  : ringkasan per tanggal (jumlah slot kosong) dalam satu bulan
 * - Admin & Psikolog: semua slot + sesi dalam satu bulan dalam satu kali panggil
 * Rentang data selalu dibatasi satu bulan (sesuai SOP pembatasan result set).
 */
const { Op } = require('sequelize');
const { JadwalPsikolog, SesiAsesmen, Psikolog, Klien, Layanan, User, Pembayaran } = require('../models');
const { STATUS_SLOT, TIPE_SESI, SETTING } = require('../config/constants');
const { toDateString, combineDateTime, addHours } = require('../utils/date');
const pengaturan = require('./pengaturan.service');

function rentangBulan(query) {
  const now = new Date();
  const tahun = Number(query.tahun) || now.getFullYear();
  const bulan = Number(query.bulan) || now.getMonth() + 1;
  return { tahun, bulan, awal: toDateString(new Date(tahun, bulan - 1, 1)), akhir: toDateString(new Date(tahun, bulan, 0)) };
}

/** Kalender klien: tanggal mana yang masih punya slot kosong. */
async function ringkasanPublik(query) {
  const r = rentangBulan(query);
  const today = toDateString();
  const where = { status_slot: STATUS_SLOT.TERSEDIA, tanggal: { [Op.between]: [r.awal > today ? r.awal : today, r.akhir] } };
  if (query.id_psikolog) where.id_psikolog = query.id_psikolog;
  if (query.tipe_sesi) where.tipe_sesi = [query.tipe_sesi, TIPE_SESI.KEDUANYA];
  const slots = await JadwalPsikolog.findAll({
    where,
    attributes: ['tanggal', 'jam_mulai', 'id_psikolog'],
    include: [{ model: Psikolog, as: 'psikolog', attributes: [], include: [{ model: User, as: 'akun', attributes: [], where: { is_active: true } }] }],
    raw: true,
  });
  const palingAwal = addHours(new Date(), await pengaturan.getNumber(SETTING.BATAS_BOOKING_JAM, 3));
  const perTanggal = new Map();
  for (const s of slots) {
    if (combineDateTime(s.tanggal, s.jam_mulai) <= palingAwal) continue;
    const t = perTanggal.get(s.tanggal) || { tanggal: s.tanggal, slot_tersedia: 0, psikolog: new Set() };
    t.slot_tersedia += 1;
    t.psikolog.add(s.id_psikolog);
    perTanggal.set(s.tanggal, t);
  }
  return {
    tahun: r.tahun,
    bulan: r.bulan,
    tanggal: Array.from(perTanggal.values())
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      .map((t) => ({ tanggal: t.tanggal, slot_tersedia: t.slot_tersedia, jumlah_psikolog: t.psikolog.size })),
  };
}

/** Kalender staf: slot & sesi sebulan. scope.id_psikolog membatasi untuk psikolog. */
async function kalenderStaf(query, scope = {}) {
  const r = rentangBulan(query);
  const idPsikolog = scope.id_psikolog || query.id_psikolog;
  const whereSlot = { tanggal: { [Op.between]: [r.awal, r.akhir] } };
  const whereSesi = { tanggal: { [Op.between]: [r.awal, r.akhir] } };
  if (idPsikolog) { whereSlot.id_psikolog = idPsikolog; whereSesi.id_psikolog = idPsikolog; }
  if (query.status) whereSesi.status_asesmen = query.status;

  const [slot, sesi] = await Promise.all([
    JadwalPsikolog.findAll({
      where: whereSlot,
      attributes: ['id_jadwal', 'id_psikolog', 'tanggal', 'jam_mulai', 'jam_selesai', 'tipe_sesi', 'status_slot'],
      include: [{ model: Psikolog, as: 'psikolog', attributes: ['nama_lengkap'] }],
      order: [['tanggal', 'ASC'], ['jam_mulai', 'ASC']],
      limit: 2000,
    }),
    SesiAsesmen.findAll({
      where: whereSesi,
      attributes: ['id_sesi', 'kode_booking', 'id_jadwal', 'tanggal', 'waktu', 'tipe_sesi', 'status_asesmen', 'tautan_zoom', 'lokasi_ruangan'],
      include: [
        { model: Klien, as: 'klien', attributes: ['nama_lengkap'] },
        { model: Psikolog, as: 'psikolog', attributes: ['id_psikolog', 'nama_lengkap'] },
        { model: Layanan, as: 'layanan', attributes: ['nama_layanan', 'durasi_menit'] },
        { model: Pembayaran, as: 'pembayaran', attributes: ['status_pembayaran'] },
      ],
      order: [['tanggal', 'ASC'], ['waktu', 'ASC']],
      limit: 2000,
    }),
  ]);
  return { tahun: r.tahun, bulan: r.bulan, slot, sesi };
}

module.exports = { ringkasanPublik, kalenderStaf, rentangBulan };
