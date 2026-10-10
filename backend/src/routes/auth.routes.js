const router = require('express').Router();
const c = require('../controllers/auth.controller');
const rules = require('../validators/auth.validator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { loginLimiter, sensitiveLimiter } = require('../middlewares/rateLimiter');
const h = require('../utils/asyncHandler');

router.post('/register', sensitiveLimiter, validate(rules.register), h(c.register));
router.post('/login', loginLimiter, validate(rules.login), h(c.login));
router.post('/logout', h(c.logout));
router.post('/forgot-password', sensitiveLimiter, validate(rules.forgotPassword), h(c.forgotPassword));
router.post('/reset-password', sensitiveLimiter, validate(rules.resetPassword), h(c.resetPassword));
router.get('/me', authenticate, h(c.me));
router.put('/password', authenticate, validate(rules.changePassword), h(c.changePassword));

module.exports = router;
