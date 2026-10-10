const layanan = require('../services/layanan.service');
const psikolog = require('../services/psikolog.service');
const jadwal = require('../services/jadwal.service');
const booking = require('../services/booking.service');
const pengaturan = require('../services/pengaturan.service');
const ulasan = require('../services/ulasan.service');
const kalender = require('../services/kalender.service');
const { ok } = require('../utils/response');

exports.listLayanan = async (req, res) => ok(res, await layanan.listPublic(req.query));
exports.getLayanan = async (req, res) => ok(res, await layanan.getPublic(req.params.id));
exports.listPsikolog = async (req, res) => {
  const list = (await psikolog.listPublic()).map((p) => p.toJSON());
  const rating = await ulasan.ratingBanyak(list.map((p) => p.id_psikolog));
  return ok(res, list.map((p) => ({ ...p, rating: rating[p.id_psikolog] || { rata_rata: null, jumlah: 0 } })));
};
exports.getPsikolog = async (req, res) => {
  const p = await psikolog.getPublic(req.params.id);
  return ok(res, { ...p.toJSON(), rating: await ulasan.ringkasanRating(p.id_psikolog) });
};
exports.ulasanPsikolog = async (req, res) => {
  const r = await ulasan.listPublik(req.params.id, req.query);
  return ok(res, { ringkasan: r.ringkasan, ulasan: r.rows }, 'Berhasil', r.meta);
};
exports.kalender = async (req, res) => ok(res, await kalender.ringkasanPublik(req.query));
exports.jadwalTersedia = async (req, res) => ok(res, await jadwal.tersedia(req.query));
exports.infoPembayaran = async (req, res) => ok(res, await booking.infoPembayaran());
exports.infoLembaga = async (req, res) => ok(res, await pengaturan.getPublic());
