const router = require('express').Router();
const { query, body } = require('express-validator');
const c = require('../controllers/admin.controller');
const kc = require('../controllers/klien.controller');
const kr = require('../validators/klien.validator');
const r = require('../validators/admin.validator');
const pr = require('../validators/psikolog.validator');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { authenticate } = require('../middlewares/auth');
const { uploadTemplate } = require('../middlewares/upload');
const { idParam, pagination, slotTersedia } = require('../validators/common');
const { ROLES, KATEGORI_LAYANAN, STATUS_BAYAR } = require('../config/constants');
const h = require('../utils/asyncHandler');

const id = validate([idParam()]);
const search = [query('q').optional().isString().isLength({ max: 100 })];

router.use(authenticate, authorize(ROLES.ADMIN)); // Super Admin otomatis diizinkan

router.get('/dashboard', h(c.dashboard));
router.get('/monitoring', validate(r.listSesi), h(c.monitoring));

// Kelola Layanan & Harga + tarif fee
router.get('/layanan', validate([...pagination, ...search, query('kategori').optional().isIn(KATEGORI_LAYANAN), query('is_active').optional().isIn(['true', 'false'])]), h(c.listLayanan));
router.post('/layanan', validate(r.layananCreate), h(c.createLayanan));
router.get('/layanan/:id', id, h(c.getLayanan));
router.put('/layanan/:id', validate([idParam(), ...r.layananUpdate]), h(c.updateLayanan));
router.delete('/layanan/:id', id, h(c.deleteLayanan));
router.put('/layanan/:id/fee', validate([idParam(), ...r.tarifFee]), h(c.setTarifFee));

router.get('/kategori-fee', validate([query('is_active').optional().isIn(['true', 'false'])]), h(c.listKategoriFee));
router.post('/kategori-fee', validate(r.kategoriFee(true)), h(c.createKategoriFee));
router.put('/kategori-fee/:id', validate([idParam(), ...r.kategoriFee(false)]), h(c.updateKategoriFee));
router.delete('/kategori-fee/:id', id, h(c.deleteKategoriFee));

// Manajemen psikolog & jadwalnya
router.get('/psikolog', validate([...pagination, ...search]), h(c.listPsikolog));
router.post('/psikolog', validate(r.psikologCreate), h(c.createPsikolog));
router.get('/psikolog/:id', id, h(c.getPsikolog));
router.put('/psikolog/:id', validate([idParam(), ...r.psikologUpdate]), h(c.updatePsikolog));
router.patch('/psikolog/:id/status', validate([idParam(), ...r.status]), h(c.statusPsikolog));
router.get('/psikolog/:id/jadwal', validate([idParam(), ...pr.listJadwal]), h(c.listJadwalPsikolog));
router.post('/psikolog/:id/jadwal', validate([idParam(), ...pr.jadwal]), h(c.createJadwalPsikolog));
router.post('/psikolog/:id/jadwal/bulk', validate([idParam(), ...pr.jadwalBulk]), h(c.createJadwalBulkPsikolog));
// Slot kosong untuk jadwal ulang oleh Admin (tidak terikat batas waktu booking online klien)
router.get('/jadwal/tersedia', validate(slotTersedia), h(c.jadwalTersedia));
router.put('/jadwal/:id', validate([idParam(), ...pr.jadwalUpdate]), h(c.updateJadwal));
router.delete('/jadwal/:id', id, h(c.deleteJadwal));

// Manajemen klien
router.get('/klien', validate([...pagination, ...search]), h(c.listKlien));
router.get('/klien/:id', id, h(c.getKlien));
// Admin melengkapi profil & formulir klien (mis. klien walk-in tanpa akun yang mengisi formulir kertas)
router.put('/klien/:idKlien', validate([idParam('idKlien'), ...kr.updateProfil]), h(kc.updateProfil));
for (const type of ['keluarga', 'organisasi', 'referensi']) {
  const ctl = kc.child(type);
  const base = `/klien/:idKlien/${type}`;
  router.get(base, validate([idParam('idKlien')]), h(ctl.list));
  router.post(base, validate([idParam('idKlien'), ...kr[type]]), h(ctl.create));
  router.put(`${base}/:id`, validate([idParam('idKlien'), idParam(), ...kr[type]]), h(ctl.update));
  router.delete(`${base}/:id`, validate([idParam('idKlien'), idParam()]), h(ctl.remove));
}
router.put('/klien/:idKlien/intake-dewasa', validate([idParam('idKlien'), ...kr.intakeDewasa]), h(kc.saveIntakeDewasa));
router.put('/klien/:idKlien/intake-anak', validate([idParam('idKlien'), ...kr.intakeAnak]), h(kc.saveIntakeAnak));

// Sesi: alokasi psikolog, tautan Zoom/lokasi, status
router.get('/sesi', validate(r.listSesi), h(c.listSesi));
router.get('/sesi/:id', id, h(c.detailSesi));
router.patch('/sesi/:id/alokasi', validate([idParam(), ...r.alokasi]), h(c.alokasiSesi));
router.patch('/sesi/:id/tautan', validate([idParam(), ...r.tautan]), h(c.tautanSesi));
router.patch('/sesi/:id/status', validate([idParam(), body('status').isIn(['Berjalan', 'Selesai']).withMessage('Status harus Berjalan atau Selesai')]), h(c.statusSesi));
router.patch('/sesi/:id/batal', validate([idParam(), ...r.batalSesi]), h(c.batalSesi));
router.post('/booking', validate(r.bookingAdmin), h(c.bookingAdmin));

// Pembayaran (verifikasi transfer manual)
router.get('/pembayaran', validate([...pagination, query('status').optional().isIn(Object.values(STATUS_BAYAR))]), h(c.listPembayaran));
router.get('/pembayaran/:id', id, h(c.detailPembayaran));
router.patch('/pembayaran/:id/verifikasi', validate([idParam(), ...r.verifikasi]), h(c.verifikasiPembayaran));
router.patch('/pembayaran/:id/nominal', validate([idParam(), ...r.ubahNominal]), h(c.ubahNominalPembayaran));

// Fee Psikolog
router.get('/fee', validate(r.periode), h(c.rekapFee));
router.get('/fee/psikolog/:id', validate([idParam(), ...pagination, ...r.periode, query('status').optional().isIn(['Belum Dibayar', 'Sudah Dibayar'])]), h(c.detailFee));
router.patch('/fee/bayar', validate(r.bayarFee), h(c.bayarFee));

// Keuangan
router.get('/pengeluaran', validate([...pagination, ...r.periode, query('kategori').optional().isString().isLength({ max: 100 })]), h(c.listPengeluaran));
router.post('/pengeluaran', validate(r.pengeluaran(true)), h(c.createPengeluaran));
router.put('/pengeluaran/:id', validate([idParam(), ...r.pengeluaran(false)]), h(c.updatePengeluaran));
router.delete('/pengeluaran/:id', id, h(c.deletePengeluaran));
router.get('/laporan-keuangan', validate(r.periode), h(c.laporanKeuangan));
router.get('/laporan-keuangan/tahunan', validate([query('tahun').optional().isInt({ min: 2020, max: 2100 }).toInt()]), h(c.ringkasanTahunan));

// Laporan asesmen
router.get('/laporan', validate([...pagination, query('status').optional().isIn(['Draft', 'Final'])]), h(c.listLaporan));
router.patch('/laporan/:id/buka-kembali', id, h(c.bukaLaporan));

// Template laporan
router.get('/template-laporan', h(c.listTemplate));
router.post('/template-laporan', validate(r.template(true)), h(c.createTemplate));
router.get('/template-laporan/:id', id, h(c.getTemplate));
router.put('/template-laporan/:id', validate([idParam(), ...r.template(false)]), h(c.updateTemplate));
router.delete('/template-laporan/:id', id, h(c.deleteTemplate));
router.get('/template-laporan/:id/panduan', id, h(c.panduanTemplate));
router.get('/template-laporan/:id/file', id, h(c.downloadTemplate));
router.post('/template-laporan/:id/file', id, uploadTemplate, h(c.uploadTemplate));
router.post('/template-laporan/:id/item', validate([idParam(), ...r.templateItem(true)]), h(c.addItem));
router.put('/template-laporan/:id/item/:idItem', validate([idParam(), idParam('idItem'), ...r.templateItem(false)]), h(c.updateItem));
router.delete('/template-laporan/:id/item/:idItem', validate([idParam(), idParam('idItem')]), h(c.deleteItem));

// Kalender jadwal & moderasi ulasan
router.get('/kalender', validate([...r.periode, query('id_psikolog').optional().isInt({ min: 1 }).toInt(), query('status').optional().isIn(['Terdaftar', 'Berjalan', 'Selesai', 'Batal'])]), h(c.kalender));
router.get('/ulasan', validate([...pagination, query('is_tampil').optional().isIn(['true', 'false']), query('id_psikolog').optional().isInt({ min: 1 }).toInt(), query('rating').optional().isInt({ min: 1, max: 5 }).toInt()]), h(c.listUlasan));
router.patch('/ulasan/:id/tampil', validate([idParam(), body('is_tampil').isBoolean().withMessage('is_tampil harus true/false').toBoolean()]), h(c.tampilUlasan));

// Pengaturan (rekening, nomor WhatsApp, aturan booking, dll)
router.get('/pengaturan', h(c.getPengaturan));
router.put('/pengaturan', validate(r.pengaturan), h(c.updatePengaturan));

module.exports = router;
