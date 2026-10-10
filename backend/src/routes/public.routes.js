const router = require('express').Router();
const { query } = require('express-validator');
const c = require('../controllers/public.controller');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators/common');
const { KATEGORI_LAYANAN } = require('../config/constants');
const h = require('../utils/asyncHandler');

router.get('/layanan', validate([query('kategori').optional().isIn(KATEGORI_LAYANAN)]), h(c.listLayanan));
router.get('/layanan/:id', validate([idParam()]), h(c.getLayanan));
router.get('/psikolog', h(c.listPsikolog));
// (\\d+) agar tidak bentrok dengan route /psikolog/dashboard dsb. milik role Psikolog
router.get('/psikolog/:id(\\d+)', validate([idParam()]), h(c.getPsikolog));
router.get('/psikolog/:id(\\d+)/ulasan', validate([idParam(), query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 50 }).toInt()]), h(c.ulasanPsikolog));
router.get('/jadwal/kalender', validate([
  query('bulan').optional().isInt({ min: 1, max: 12 }).toInt(),
  query('tahun').optional().isInt({ min: 2020, max: 2100 }).toInt(),
  query('id_psikolog').optional().isInt({ min: 1 }).toInt(),
  query('tipe_sesi').optional().isIn(['Online', 'Offline']),
]), h(c.kalender));
router.get('/jadwal/tersedia', validate([
  query('id_psikolog').optional().isInt({ min: 1 }).toInt(),
  query('tanggal').optional().isISO8601({ strict: true }),
  query('dari').optional().isISO8601({ strict: true }),
  query('sampai').optional().isISO8601({ strict: true }),
  query('tipe_sesi').optional().isIn(['Online', 'Offline']),
]), h(c.jadwalTersedia));
router.get('/info-pembayaran', h(c.infoPembayaran));
router.get('/info-lembaga', h(c.infoLembaga));

module.exports = router;
