const layanan = require('../services/layanan.service');
const kategoriFee = require('../services/kategoriFee.service');
const psikolog = require('../services/psikolog.service');
const klien = require('../services/klien.service');
const jadwal = require('../services/jadwal.service');
const sesi = require('../services/sesi.service');
const pembayaran = require('../services/pembayaran.service');
const fee = require('../services/fee.service');
const keuangan = require('../services/keuangan.service');
const laporan = require('../services/laporan.service');
const template = require('../services/template.service');
const pengaturan = require('../services/pengaturan.service');
const dashboard = require('../services/dashboard.service');
const audit = require('../services/audit.service');
const ulasan = require('../services/ulasan.service');
const kalender = require('../services/kalender.service');
const { ok, created } = require('../utils/response');

const paged = (fn) => async (req, res) => { const r = await fn(req); return ok(res, r.rows, 'Berhasil', r.meta); };

exports.dashboard = async (req, res) => ok(res, await dashboard.admin());
exports.monitoring = async (req, res) => {
  const r = await sesi.list(req.query);
  return ok(res, r.rows, 'Berhasil', { ...r.meta, ringkasan_status: await sesi.ringkasanStatus() });
};

// Layanan & harga
exports.listLayanan = paged((req) => layanan.listAdmin(req.query));
exports.getLayanan = async (req, res) => ok(res, await layanan.getAdmin(req.params.id));
exports.createLayanan = async (req, res) => { const d = await layanan.create(req.validated); await audit.log(req, 'CREATE', 'layanan', d.id_layanan, d.nama_layanan); return created(res, d); };
exports.updateLayanan = async (req, res) => { const d = await layanan.update(req.params.id, req.validated); await audit.log(req, 'UPDATE', 'layanan', req.params.id); return ok(res, d, 'Layanan diperbarui'); };
exports.deleteLayanan = async (req, res) => { const d = await layanan.remove(req.params.id); await audit.log(req, 'DELETE', 'layanan', req.params.id); return ok(res, d, d.dihapus ? 'Layanan dihapus' : 'Layanan sudah dipakai, sehingga dinonaktifkan'); };
exports.setTarifFee = async (req, res) => { const d = await layanan.setTarifFee(req.params.id, req.validated.items); await audit.log(req, 'UPDATE', 'layanan_fee', req.params.id); return ok(res, d, 'Tarif fee diperbarui'); };

// Kategori fee
exports.listKategoriFee = async (req, res) => ok(res, await kategoriFee.list(req.query));
exports.createKategoriFee = async (req, res) => created(res, await kategoriFee.create(req.validated));
exports.updateKategoriFee = async (req, res) => ok(res, await kategoriFee.update(req.params.id, req.validated), 'Kategori fee diperbarui');
exports.deleteKategoriFee = async (req, res) => { const d = await kategoriFee.remove(req.params.id); return ok(res, d, d.dihapus ? 'Kategori dihapus' : 'Kategori sudah dipakai, sehingga dinonaktifkan'); };

// Psikolog
exports.listPsikolog = paged((req) => psikolog.listAdmin(req.query));
exports.getPsikolog = async (req, res) => ok(res, await psikolog.getById(req.params.id));
exports.createPsikolog = async (req, res) => { const d = await psikolog.create(req.validated); await audit.log(req, 'CREATE', 'psikolog', d.id_psikolog, d.email); return created(res, d, 'Akun psikolog dibuat'); };
exports.updatePsikolog = async (req, res) => { const d = await psikolog.update(req.params.id, req.validated); await audit.log(req, 'UPDATE', 'psikolog', req.params.id); return ok(res, d, 'Data psikolog diperbarui'); };
exports.statusPsikolog = async (req, res) => { const d = await psikolog.setActive(req.params.id, req.validated.is_active); await audit.log(req, 'STATUS', 'psikolog', req.params.id, req.validated.is_active ? 'Diaktifkan' : 'Dinonaktifkan'); return ok(res, d, 'Status psikolog diperbarui'); };
exports.listJadwalPsikolog = paged((req) => jadwal.list(req.params.id, req.query));
exports.createJadwalPsikolog = async (req, res) => { await psikolog.getById(req.params.id); return created(res, await jadwal.create(Number(req.params.id), req.validated)); };
exports.createJadwalBulkPsikolog = async (req, res) => { await psikolog.getById(req.params.id); return created(res, await jadwal.createBulk(Number(req.params.id), req.validated)); };
exports.updateJadwal = async (req, res) => ok(res, await jadwal.update(null, req.params.id, req.validated), 'Slot diperbarui');
exports.deleteJadwal = async (req, res) => { await jadwal.remove(null, req.params.id); return ok(res, null, 'Slot dihapus'); };

// Klien
exports.listKlien = paged((req) => klien.listAdmin(req.query));
exports.getKlien = async (req, res) => {
  const data = (await klien.getDetailLengkap(req.params.id)).toJSON();
  data.riwayat_sesi = await klien.riwayatSesi(req.params.id);
  return ok(res, data);
};

// Sesi
exports.listSesi = paged((req) => sesi.list(req.query));
exports.detailSesi = async (req, res) => ok(res, await sesi.detail(req.params.id));
exports.alokasiSesi = async (req, res) => { const d = await sesi.alokasi(req.params.id, req.validated); await audit.log(req, 'ALOKASI', 'sesi_asesmen', req.params.id, `slot ${req.validated.id_jadwal}`); return ok(res, d, 'Jadwal/psikolog sesi diperbarui'); };
exports.tautanSesi = async (req, res) => { const d = await sesi.setTautan(req.params.id, req.validated); await audit.log(req, 'TAUTAN', 'sesi_asesmen', req.params.id); return ok(res, d, 'Tautan/lokasi sesi dikirim ke klien dan psikolog'); };
exports.statusSesi = async (req, res) => { const d = await sesi.ubahStatus(req.params.id, req.body.status, {}, null); await audit.log(req, 'STATUS_SESI', 'sesi_asesmen', req.params.id, req.body.status); return ok(res, d); };
exports.batalSesi = async (req, res) => { const d = await sesi.ubahStatus(req.params.id, 'Batal', {}, req.validated.alasan); await audit.log(req, 'CANCEL', 'sesi_asesmen', req.params.id, req.validated.alasan); return ok(res, d, 'Sesi dibatalkan'); };

// Pembayaran
exports.listPembayaran = paged((req) => pembayaran.list(req.query));
exports.detailPembayaran = async (req, res) => ok(res, await pembayaran.detail(req.params.id));
exports.verifikasiPembayaran = async (req, res) => {
  const d = await pembayaran.verifikasi(req.params.id, req.validated, req.user);
  await audit.log(req, 'VERIFY_PAYMENT', 'pembayaran', req.params.id, req.validated.status);
  return ok(res, d, `Pembayaran ditandai ${req.validated.status}`);
};

// Fee psikolog
exports.rekapFee = async (req, res) => ok(res, await fee.rekapPerPsikolog(req.query));
exports.detailFee = async (req, res) => ok(res, await fee.detailPsikolog(req.params.id, req.query));
exports.bayarFee = async (req, res) => { const d = await fee.bayar(req.validated.id_fee, req.validated.catatan); await audit.log(req, 'PAY_FEE', 'rekap_fee', req.validated.id_fee.join(','), String(d.total)); return ok(res, d, 'Fee ditandai sudah dibayar'); };

// Keuangan
exports.listPengeluaran = paged((req) => keuangan.listPengeluaran(req.query));
exports.createPengeluaran = async (req, res) => { const d = await keuangan.createPengeluaran(req.validated, req.user.id_user); await audit.log(req, 'CREATE', 'pengeluaran', d.id_pengeluaran); return created(res, d); };
exports.updatePengeluaran = async (req, res) => { const d = await keuangan.updatePengeluaran(req.params.id, req.validated); await audit.log(req, 'UPDATE', 'pengeluaran', req.params.id); return ok(res, d, 'Pengeluaran diperbarui'); };
exports.deletePengeluaran = async (req, res) => { await keuangan.deletePengeluaran(req.params.id); await audit.log(req, 'DELETE', 'pengeluaran', req.params.id); return ok(res, null, 'Pengeluaran dihapus'); };
exports.laporanKeuangan = async (req, res) => ok(res, await keuangan.laporanBulanan(req.query));
exports.ringkasanTahunan = async (req, res) => ok(res, await keuangan.ringkasanTahunan(req.query));

// Laporan asesmen
exports.listLaporan = paged((req) => laporan.listAdmin(req.query));
exports.bukaLaporan = async (req, res) => { const d = await laporan.bukaKembali(req.params.id); await audit.log(req, 'REOPEN_REPORT', 'laporan_asesmen', req.params.id); return ok(res, d, 'Laporan dibuka kembali untuk revisi'); };

// Template laporan
exports.listTemplate = async (req, res) => ok(res, await template.list());
exports.getTemplate = async (req, res) => ok(res, await template.detail(req.params.id));
exports.createTemplate = async (req, res) => { const d = await template.create(req.validated); await audit.log(req, 'CREATE', 'template_laporan', d.id_template, d.kode); return created(res, d); };
exports.updateTemplate = async (req, res) => ok(res, await template.update(req.params.id, req.validated), 'Template diperbarui');
exports.deleteTemplate = async (req, res) => { const d = await template.remove(req.params.id); await audit.log(req, 'DELETE', 'template_laporan', req.params.id); return ok(res, d); };
exports.addItem = async (req, res) => created(res, await template.addItem(req.params.id, req.validated));
exports.updateItem = async (req, res) => ok(res, await template.updateItem(req.params.id, req.params.idItem, req.validated), 'Item diperbarui');
exports.deleteItem = async (req, res) => ok(res, await template.removeItem(req.params.id, req.params.idItem));
exports.panduanTemplate = async (req, res) => ok(res, await template.panduanPlaceholder(req.params.id));
exports.uploadTemplate = async (req, res) => { const d = await template.uploadFile(req.params.id, req.file); await audit.log(req, 'UPLOAD_TEMPLATE', 'template_laporan', req.params.id); return ok(res, d, 'File template berhasil diunggah'); };
exports.downloadTemplate = async (req, res) => { const f = await template.fileTemplate(req.params.id); return res.download(f.path, f.name); };

// Kalender & ulasan
exports.kalender = async (req, res) => ok(res, await kalender.kalenderStaf(req.query));
exports.listUlasan = paged((req) => ulasan.listAdmin(req.query));
exports.tampilUlasan = async (req, res) => { const d = await ulasan.setTampil(req.params.id, req.validated.is_tampil); await audit.log(req, 'MODERASI_ULASAN', 'ulasan', req.params.id, String(req.validated.is_tampil)); return ok(res, d, d.is_tampil ? 'Ulasan ditampilkan' : 'Ulasan disembunyikan'); };

// Pengaturan
exports.getPengaturan = async (req, res) => ok(res, await pengaturan.getAll());
exports.updatePengaturan = async (req, res) => { const d = await pengaturan.updateMany(req.validated.items); await audit.log(req, 'UPDATE', 'pengaturan', null, req.validated.items.map((i) => i.kunci).join(',')); return ok(res, d, 'Pengaturan disimpan'); };
