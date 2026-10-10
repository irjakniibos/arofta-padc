const router = require('express').Router();
const { query } = require('express-validator');
const c = require('../controllers/superadmin.controller');
const r = require('../validators/admin.validator');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { authenticate } = require('../middlewares/auth');
const { sensitiveLimiter } = require('../middlewares/rateLimiter');
const { idParam, pagination } = require('../validators/common');
const { ROLES } = require('../config/constants');
const h = require('../utils/asyncHandler');

router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.get('/users', validate([...pagination, query('role').optional().isIn(Object.values(ROLES)), query('q').optional().isString().isLength({ max: 100 }), query('is_active').optional().isIn(['true', 'false'])]), h(c.listUsers));
router.post('/users', validate(r.userCreate), h(c.createUser));
router.patch('/users/:id/role', validate([idParam(), ...r.role]), h(c.setRole));
router.patch('/users/:id/status', validate([idParam(), ...r.status]), h(c.setStatus));
router.patch('/users/:id/password', validate([idParam(), ...r.resetPassword]), h(c.resetPassword));
router.get('/audit-log', validate([...pagination, query('aksi').optional().isString().isLength({ max: 50 }), query('id_user').optional().isInt().toInt(), query('dari').optional().isISO8601(), query('sampai').optional().isISO8601()]), h(c.auditLog));
router.get('/backup', sensitiveLimiter, h(c.backup));

module.exports = router;
