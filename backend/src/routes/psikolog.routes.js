const router = require('express').Router();
const { query } = require('express-validator');
const c = require('../controllers/psikolog.controller');
const rules = require('../validators/psikolog.validator');
const adminRules = require('../validators/admin.validator');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { authenticate } = require('../middlewares/auth');
const { idParam, pagination } = require('../validators/common');
const { ROLES } = require('../config/constants');
const h = require('../utils/asyncHandler');

router.use(authenticate, authorize(ROLES.PSIKOLOG));

router.get('/dashboard', h(c.dashboard));
router.get('/profil', h(c.getProfil));
router.put('/profil', validate(rules.profil), h(c.updateProfil));

router.get('/jadwal', validate(rules.listJadwal), h(c.listJadwal));
router.post('/jadwal', validate(rules.jadwal), h(c.createJadwal));
router.post('/jadwal/bulk', validate(rules.jadwalBulk), h(c.createJadwalBulk));
router.put('/jadwal/:id', validate([idParam(), ...rules.jadwalUpdate]), h(c.updateJadwal));
router.delete('/jadwal/:id', validate([idParam()]), h(c.deleteJadwal));

router.get('/sesi', validate(adminRules.listSesi), h(c.listSesi));
router.get('/sesi/:id', validate([idParam()]), h(c.detailSesi));
router.patch('/sesi/:id/status', validate([idParam(), ...rules.statusSesi]), h(c.ubahStatus));

for (const bagian of ['anamnesis', 'observasi', 'soap']) {
  const ctl = c.klinis(bagian);
  router.get(`/sesi/:id/${bagian}`, validate([idParam()]), h(ctl.get));
  router.put(`/sesi/:id/${bagian}`, validate([idParam(), ...rules[bagian]]), h(ctl.save));
}

router.get('/sesi/:id/laporan', validate([idParam(), query('id_template').optional().isInt({ min: 1 }).toInt()]), h(c.formLaporan));
router.put('/sesi/:id/laporan', validate([idParam(), ...rules.laporanDraft]), h(c.simpanLaporan));
router.get('/sesi/:id/laporan/pratinjau', validate([idParam()]), h(c.pratinjauLaporan));
router.post('/sesi/:id/laporan/finalisasi', validate([idParam()]), h(c.finalisasiLaporan));
router.get('/template-laporan', h(c.listTemplate));
router.get('/laporan', validate([...pagination, query('status').optional().isIn(['Draft', 'Final'])]), h(c.listLaporan));

router.get('/kalender', validate([...adminRules.periode, query('status').optional().isIn(['Terdaftar', 'Berjalan', 'Selesai', 'Batal'])]), h(c.kalender));
router.get('/ulasan', validate(pagination), h(c.ulasan));
router.get('/fee', validate([...pagination, ...adminRules.periode, query('status').optional().isIn(['Belum Dibayar', 'Sudah Dibayar'])]), h(c.fee));

module.exports = router;
