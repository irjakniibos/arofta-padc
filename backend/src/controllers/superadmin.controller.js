const users = require('../services/user.service');
const audit = require('../services/audit.service');
const { ok, created } = require('../utils/response');

exports.listUsers = async (req, res) => { const r = await users.list(req.query); return ok(res, r.rows, 'Berhasil', r.meta); };
exports.createUser = async (req, res) => { const d = await users.createStaff(req.validated); await audit.log(req, 'CREATE', 'users', d.id_user, d.role); return created(res, d, 'Akun dibuat'); };
exports.setRole = async (req, res) => { const d = await users.setRole(req.params.id, req.validated.role, req.user); await audit.log(req, 'ROLE', 'users', req.params.id, d.role); return ok(res, d, 'Role diperbarui'); };
exports.setStatus = async (req, res) => { const d = await users.setStatus(req.params.id, req.validated.is_active, req.user); await audit.log(req, 'STATUS', 'users', req.params.id, d.is_active ? 'Diaktifkan' : 'Dinonaktifkan'); return ok(res, d, 'Status akun diperbarui'); };
exports.resetPassword = async (req, res) => { await users.resetPassword(req.params.id, req.validated.password_baru); await audit.log(req, 'RESET_PASSWORD', 'users', req.params.id); return ok(res, null, 'Password akun diatur ulang'); };
exports.auditLog = async (req, res) => { const r = await users.auditLog(req.query); return ok(res, r.rows, 'Berhasil', r.meta); };
exports.backup = async (req, res, next) => { await audit.log(req, 'BACKUP', 'database'); users.streamBackup(res, next); };
