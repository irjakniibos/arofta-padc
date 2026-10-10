const klien = require('../services/klien.service');
const booking = require('../services/booking.service');
const laporan = require('../services/laporan.service');
const dashboard = require('../services/dashboard.service');
const audit = require('../services/audit.service');
const ulasan = require('../services/ulasan.service');
const { ok, created } = require('../utils/response');
const { STAFF_ROLES } = require('../config/constants');

// Handler profil & formulir dipakai juga di rute Admin: staf mengelola profil klien mana pun (mis. klien walk-in)
const uid = (req) => (STAFF_ROLES.includes(req.user.role) ? klien.STAF : req.user.id_user);
const kid = (req) => req.params.idKlien;

exports.dashboard = async (req, res) => ok(res, await dashboard.klien(uid(req)));

exports.listProfil = async (req, res) => ok(res, await klien.listProfil(uid(req)));
exports.getProfil = async (req, res) => ok(res, await klien.getProfilLengkapMilik(uid(req), kid(req)));
exports.createProfil = async (req, res) => created(res, await klien.createProfil(uid(req), req.validated), 'Profil berhasil ditambahkan');
exports.updateProfil = async (req, res) => ok(res, await klien.updateProfil(uid(req), kid(req), req.validated), 'Profil berhasil diperbarui');
exports.deleteProfil = async (req, res) => { await klien.deleteProfil(uid(req), kid(req)); return ok(res, null, 'Profil dihapus'); };

// keluarga / organisasi / referensi
exports.child = (type) => ({
  list: async (req, res) => ok(res, await klien.listChild(type, uid(req), kid(req))),
  create: async (req, res) => created(res, await klien.createChild(type, uid(req), kid(req), req.validated)),
  update: async (req, res) => ok(res, await klien.updateChild(type, uid(req), kid(req), req.params.id, req.validated), 'Data diperbarui'),
  remove: async (req, res) => { await klien.deleteChild(type, uid(req), kid(req), req.params.id); return ok(res, null, 'Data dihapus'); },
});

exports.getIntakeDewasa = async (req, res) => { await klien.assertOwner(uid(req), kid(req)); return ok(res, await klien.getIntakeDewasa(kid(req))); };
exports.saveIntakeDewasa = async (req, res) => ok(res, await klien.saveIntakeDewasa(uid(req), kid(req), req.validated), 'Formulir identitas tersimpan');
exports.getIntakeAnak = async (req, res) => { await klien.assertOwner(uid(req), kid(req)); return ok(res, await klien.getIntakeAnak(kid(req))); };
exports.saveIntakeAnak = async (req, res) => ok(res, await klien.saveIntakeAnak(uid(req), kid(req), req.validated), 'Formulir riwayat anak tersimpan');

exports.booking = async (req, res) => {
  const data = await booking.create(uid(req), req.validated);
  await audit.log(req, 'BOOKING', 'sesi_asesmen', data.id_sesi, data.kode_booking);
  return created(res, data, 'Booking berhasil. Silakan selesaikan pembayaran');
};
exports.listSesi = async (req, res) => { const r = await booking.listMilik(uid(req), req.query); return ok(res, r.rows, 'Berhasil', r.meta); };
exports.detailSesi = async (req, res) => ok(res, await booking.detailMilik(uid(req), req.params.id));
exports.konfirmasiBayar = async (req, res) => ok(res, await booking.konfirmasiBayar(uid(req), req.params.id), 'Konfirmasi terkirim, menunggu verifikasi admin');
exports.batalSesi = async (req, res) => {
  const data = await booking.batalOlehKlien(uid(req), req.params.id, req.validated.alasan);
  await audit.log(req, 'CANCEL', 'sesi_asesmen', req.params.id, 'Dibatalkan klien');
  return ok(res, data, 'Booking dibatalkan');
};
exports.beriUlasan = async (req, res) => created(res, await ulasan.buat(uid(req), req.params.id, req.validated), 'Terima kasih atas ulasan Anda');
exports.listLaporan = async (req, res) => { const r = await laporan.listUntukKlien(uid(req), req.query); return ok(res, r.rows, 'Berhasil', r.meta); };
