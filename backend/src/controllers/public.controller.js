const path = require('path');
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
  return ok(res, list.map((p) => {
    const punyaFoto = Boolean(p.foto_path);
    const fotoVersi = p.foto_updated_at ? new Date(p.foto_updated_at).getTime() : null;
    return {
      ...p,
      punya_foto: punyaFoto,
      foto_versi: fotoVersi,
      foto_url: punyaFoto ? `/api/v1/public/psikolog/${p.id_psikolog}/foto?v=${fotoVersi}` : null,
      rating: rating[p.id_psikolog] || { rata_rata: null, jumlah: 0 },
    };
  }));
};
exports.getPsikolog = async (req, res) => {
  const p = await psikolog.getPublic(req.params.id);
  const json = p.toJSON();
  const punyaFoto = Boolean(json.foto_path);
  const fotoVersi = json.foto_updated_at ? new Date(json.foto_updated_at).getTime() : null;

  return ok(res, {
    ...json,
    punya_foto: punyaFoto,
    foto_versi: fotoVersi,
    foto_url: punyaFoto ? `/api/v1/public/psikolog/${json.id_psikolog}/foto?v=${fotoVersi}` : null,
    rating: await ulasan.ringkasanRating(p.id_psikolog),
  });
};
exports.fotoPsikolog = async (req, res) => {
  const f = await psikolog.getFotoFile(req.params.id);
  res.set({
    'Content-Type': f.mime,
    'Cache-Control': 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'cross-origin', // frontend (port 3000) memuat gambar dari backend
  });
  const absolutePath = path.isAbsolute(f.path) ? f.path : path.resolve(f.path);
  return res.sendFile(absolutePath, { cacheControl: false });
};
exports.ulasanPsikolog = async (req, res) => {
  const r = await ulasan.listPublik(req.params.id, req.query);
  return ok(res, { ringkasan: r.ringkasan, ulasan: r.rows }, 'Berhasil', r.meta);
};
exports.kalender = async (req, res) => ok(res, await kalender.ringkasanPublik(req.query));
exports.jadwalTersedia = async (req, res) => ok(res, await jadwal.tersedia(req.query));
exports.infoPembayaran = async (req, res) => ok(res, await booking.infoPembayaran());
exports.infoLembaga = async (req, res) => ok(res, await pengaturan.getPublic());