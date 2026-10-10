const router = require('express').Router();
const { sequelize } = require('../models');
const h = require('../utils/asyncHandler');

router.get('/health', h(async (req, res) => {
  await sequelize.authenticate();
  res.json({ success: true, message: 'API AROFTA PADC berjalan', data: { waktu: new Date().toISOString() } });
}));

router.use('/auth', require('./auth.routes'));
router.use('/', require('./public.routes'));
router.use('/klien', require('./klien.routes'));
router.use('/psikolog', require('./psikolog.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/superadmin', require('./superadmin.routes'));
router.use('/', require('./umum.routes'));

module.exports = router;
