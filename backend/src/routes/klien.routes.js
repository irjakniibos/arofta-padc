const router = require('express').Router();
const c = require('../controllers/klien.controller');
const rules = require('../validators/klien.validator');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { authenticate } = require('../middlewares/auth');
const { idParam, pagination } = require('../validators/common');
const { ROLES } = require('../config/constants');
const h = require('../utils/asyncHandler');

router.use(authenticate, authorize(ROLES.KLIEN));

router.get('/dashboard', h(c.dashboard));

// Profil (diri sendiri & anak)
router.get('/profil', h(c.listProfil));
router.post('/profil', validate(rules.createProfil), h(c.createProfil));
router.get('/profil/:idKlien', validate([idParam('idKlien')]), h(c.getProfil));
router.put('/profil/:idKlien', validate([idParam('idKlien'), ...rules.updateProfil]), h(c.updateProfil));
router.delete('/profil/:idKlien', validate([idParam('idKlien')]), h(c.deleteProfil));

// Data keluarga, organisasi, referensi
for (const type of ['keluarga', 'organisasi', 'referensi']) {
  const ctl = c.child(type);
  const base = `/profil/:idKlien/${type}`;
  router.get(base, validate([idParam('idKlien')]), h(ctl.list));
  router.post(base, validate([idParam('idKlien'), ...rules[type]]), h(ctl.create));
  router.put(`${base}/:id`, validate([idParam('idKlien'), idParam(), ...rules[type]]), h(ctl.update));
  router.delete(`${base}/:id`, validate([idParam('idKlien'), idParam()]), h(ctl.remove));
}

// Formulir intake
router.get('/profil/:idKlien/intake-dewasa', validate([idParam('idKlien')]), h(c.getIntakeDewasa));
router.put('/profil/:idKlien/intake-dewasa', validate([idParam('idKlien'), ...rules.intakeDewasa]), h(c.saveIntakeDewasa));
router.get('/profil/:idKlien/intake-anak', validate([idParam('idKlien')]), h(c.getIntakeAnak));
router.put('/profil/:idKlien/intake-anak', validate([idParam('idKlien'), ...rules.intakeAnak]), h(c.saveIntakeAnak));

// Booking, sesi, pembayaran
router.post('/booking', validate(rules.booking), h(c.booking));
router.get('/sesi', validate(rules.listSesi), h(c.listSesi));
router.get('/sesi/:id', validate([idParam()]), h(c.detailSesi));
router.patch('/sesi/:id/konfirmasi-pembayaran', validate([idParam()]), h(c.konfirmasiBayar));
router.post('/sesi/:id/ulasan', validate([idParam(), ...rules.ulasan]), h(c.beriUlasan));
router.patch('/sesi/:id/batal', validate([idParam(), ...rules.batal]), h(c.batalSesi));

// Hasil asesmen
router.get('/laporan', validate(pagination), h(c.listLaporan));

module.exports = router;
