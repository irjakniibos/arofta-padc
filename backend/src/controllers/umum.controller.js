const notif = require('../services/notifikasi.service');
const laporan = require('../services/laporan.service');
const audit = require('../services/audit.service');
const { ok } = require('../utils/response');

exports.listNotifikasi = async (req, res) => { const r = await notif.listMilikUser(req.user.id_user, req.query); return ok(res, r.rows, 'Berhasil', r.meta); };
exports.bacaNotifikasi = async (req, res) => { await notif.tandaiDibaca(req.user.id_user, req.params.id); return ok(res, null, 'Ditandai dibaca'); };
exports.bacaSemua = async (req, res) => { await notif.tandaiSemuaDibaca(req.user.id_user); return ok(res, null, 'Semua notifikasi ditandai dibaca'); };

exports.unduhLaporan = async (req, res) => {
  const f = await laporan.fileUntukUnduh(req.params.id, req.user, req.query.format);
  await audit.log(req, 'DOWNLOAD_REPORT', 'laporan_asesmen', req.params.id);
  res.setHeader('Cache-Control', 'no-store');
  return res.download(f.path, f.name);
};
