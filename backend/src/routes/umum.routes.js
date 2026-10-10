const router = require('express').Router();
const { query } = require('express-validator');
const c = require('../controllers/umum.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { idParam, pagination } = require('../validators/common');
const h = require('../utils/asyncHandler');

router.get('/notifikasi', authenticate, validate([...pagination, query('belum_dibaca').optional().isIn(['true', 'false'])]), h(c.listNotifikasi));
router.patch('/notifikasi/baca-semua', authenticate, h(c.bacaSemua));
router.patch('/notifikasi/:id/baca', authenticate, validate([idParam()]), h(c.bacaNotifikasi));
// Unduh laporan lewat controller ber-otorisasi (file tidak dapat diakses langsung via URL)
router.get('/laporan/:id/unduh', authenticate, validate([idParam(), query('format').optional().isIn(['pdf', 'docx'])]), h(c.unduhLaporan));

module.exports = router;
