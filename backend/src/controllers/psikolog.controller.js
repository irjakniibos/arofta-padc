const psikolog = require('../services/psikolog.service');
const jadwal = require('../services/jadwal.service');
const sesi = require('../services/sesi.service');
const klinis = require('../services/klinis.service');
const laporan = require('../services/laporan.service');
const fee = require('../services/fee.service');
const dashboard = require('../services/dashboard.service');
const audit = require('../services/audit.service');
const ulasan = require('../services/ulasan.service');
const kalender = require('../services/kalender.service');
const { ok, created } = require('../utils/response');
const { TemplateLaporan } = require('../models');

const pid = (req) => req.user.id_psikolog;
const scope = (req) => ({ id_psikolog: req.user.id_psikolog });

exports.dashboard = async (req, res) => ok(res, await dashboard.psikolog(pid(req)));
exports.getProfil = async (req, res) => ok(res, await psikolog.getOwnProfile(pid(req)));
exports.updateProfil = async (req, res) => ok(res, await psikolog.updateOwnProfile(pid(req), req.validated), 'Profil diperbarui');

exports.listJadwal = async (req, res) => { const r = await jadwal.list(pid(req), req.query); return ok(res, r.rows, 'Berhasil', r.meta); };
exports.createJadwal = async (req, res) => created(res, await jadwal.create(pid(req), req.validated), 'Slot jadwal ditambahkan');
exports.createJadwalBulk = async (req, res) => created(res, await jadwal.createBulk(pid(req), req.validated), 'Slot jadwal berulang dibuat');
exports.updateJadwal = async (req, res) => ok(res, await jadwal.update(pid(req), req.params.id, req.validated), 'Slot diperbarui');
exports.deleteJadwal = async (req, res) => { await jadwal.remove(pid(req), req.params.id); return ok(res, null, 'Slot dihapus'); };

exports.listSesi = async (req, res) => { const r = await sesi.list(req.query, scope(req)); return ok(res, r.rows, 'Berhasil', r.meta); };
exports.detailSesi = async (req, res) => ok(res, await sesi.detail(req.params.id, scope(req)));
exports.ubahStatus = async (req, res) => {
  const data = await sesi.ubahStatus(req.params.id, req.validated.status, scope(req));
  await audit.log(req, 'STATUS_SESI', 'sesi_asesmen', req.params.id, req.validated.status);
  return ok(res, data, `Status sesi menjadi ${data.status_asesmen}`);
};

exports.klinis = (bagian) => ({
  get: async (req, res) => ok(res, await klinis.get(bagian, req.params.id, scope(req))),
  save: async (req, res) => ok(res, await klinis.save(bagian, req.params.id, scope(req), req.validated), 'Catatan tersimpan'),
});

exports.formLaporan = async (req, res) => ok(res, await laporan.getForm(req.params.id, scope(req), req.query.id_template));
exports.simpanLaporan = async (req, res) => ok(res, await laporan.simpanDraft(req.params.id, scope(req), req.validated), 'Draft laporan tersimpan');
exports.pratinjauLaporan = async (req, res) => { const f = await laporan.pratinjau(req.params.id, scope(req)); return res.download(f.path, f.name); };
exports.finalisasiLaporan = async (req, res) => {
  const data = await laporan.finalisasi(req.params.id, scope(req));
  await audit.log(req, 'FINALISASI_LAPORAN', 'sesi_asesmen', req.params.id);
  return ok(res, data, 'Laporan final dan telah dikirim ke klien');
};
exports.listLaporan = async (req, res) => { const r = await laporan.listAdmin(req.query, scope(req)); return ok(res, r.rows, 'Berhasil', r.meta); };
exports.kalender = async (req, res) => ok(res, await kalender.kalenderStaf(req.query, scope(req)));
exports.ulasan = async (req, res) => {
  const r = await ulasan.listAdmin({ ...req.query, is_tampil: undefined }, scope(req));
  return ok(res, r.rows.map((u) => ({ ...u.toJSON(), klien: { nama_lengkap: ulasan.samarkan(u.klien && u.klien.nama_lengkap) } })), 'Berhasil', { ...r.meta, ringkasan: await ulasan.ringkasanRating(pid(req)) });
};
exports.listTemplate = async (req, res) => ok(res, await TemplateLaporan.findAll({ where: { is_active: true }, attributes: ['id_template', 'kode', 'nama_template'], order: [['id_template', 'ASC']] }));
exports.fee = async (req, res) => ok(res, await fee.detailPsikolog(pid(req), req.query));
