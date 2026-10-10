/** Pengingat jadwal sesi otomatis ke klien & psikolog (KF-08, KF-09, KF-17). */
const { Op } = require('sequelize');
const { SesiAsesmen, Pembayaran, Klien, Psikolog, Layanan } = require('../models');
const { STATUS_SESI, STATUS_BAYAR, TIPE_NOTIF, SETTING, TIPE_SESI } = require('../config/constants');
const { combineDateTime, toDateString, formatTanggalIndo } = require('../utils/date');
const pengaturan = require('../services/pengaturan.service');
const notif = require('../services/notifikasi.service');
const logger = require('../utils/logger');

async function run() {
  const jam = await pengaturan.getNumber(SETTING.REMINDER_JAM, 24);
  const now = new Date();
  const batas = new Date(now.getTime() + jam * 3600 * 1000);
  const kandidat = await SesiAsesmen.findAll({
    where: {
      status_asesmen: STATUS_SESI.TERDAFTAR,
      reminder_terkirim: false,
      tanggal: { [Op.between]: [toDateString(now), toDateString(batas)] },
    },
    include: [
      { model: Pembayaran, as: 'pembayaran', where: { status_pembayaran: STATUS_BAYAR.LUNAS }, attributes: [] },
      { model: Klien, as: 'klien', attributes: ['id_user', 'nama_lengkap'] },
      { model: Psikolog, as: 'psikolog', attributes: ['id_user'] },
      { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] },
    ],
    limit: 200,
  });

  let terkirim = 0;
  for (const s of kandidat) {
    const mulai = combineDateTime(s.tanggal, s.waktu);
    if (mulai <= now || mulai > batas) continue;
    const jadwal = `${formatTanggalIndo(s.tanggal)} pukul ${String(s.waktu).slice(0, 5)} WIB`;
    let detail;
    if (s.tipe_sesi === TIPE_SESI.ONLINE) detail = s.tautan_zoom ? `Tautan sesi: ${s.tautan_zoom}` : 'Tautan sesi daring akan segera dikirim oleh admin.';
    else detail = s.lokasi_ruangan ? `Lokasi: ${s.lokasi_ruangan}` : 'Silakan datang ke klinik AROFTA PADC.';

    await notif.kirim({ idUser: s.klien.id_user, idSesi: s.id_sesi, tipe: TIPE_NOTIF.JADWAL, judul: `Pengingat sesi ${s.kode_booking}`, pesan: `Sesi ${s.layanan.nama_layanan} Anda dijadwalkan ${jadwal} (${s.tipe_sesi}).\n${detail}` });
    await notif.kirim({ idUser: s.psikolog.id_user, idSesi: s.id_sesi, tipe: TIPE_NOTIF.JADWAL, judul: `Pengingat sesi ${s.kode_booking}`, pesan: `Sesi ${s.layanan.nama_layanan} bersama ${s.klien.nama_lengkap} pada ${jadwal} (${s.tipe_sesi}).\n${detail}` });
    if (s.tipe_sesi === TIPE_SESI.ONLINE && !s.tautan_zoom) {
      await notif.kirimKeAdmin({ idSesi: s.id_sesi, tipe: TIPE_NOTIF.TAUTAN, email: true, judul: `Tautan sesi ${s.kode_booking} belum diisi`, pesan: `Sesi online ${jadwal} belum memiliki tautan. Mohon input tautan Zoom.` });
    }
    await s.update({ reminder_terkirim: true });
    terkirim += 1;
  }
  if (terkirim) logger.info(`Pengingat sesi terkirim: ${terkirim}`);
  return terkirim;
}

module.exports = { run };
