/** Kelola akun oleh Super Admin: membuat Admin, mengubah role/status, reset password; audit log; backup. */
const { Op } = require('sequelize');
const { spawn } = require('child_process');
const env = require('../config/env');
const { User, AuditLog } = require('../models');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hashPassword } = require('./auth.service');

async function list(query) {
  const pg = getPagination(query);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.q) where.email = { [Op.like]: `%${query.q}%` };
  if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
  const { rows, count } = await User.findAndCountAll({
    where, attributes: ['id_user', 'email', 'role', 'is_active', 'last_login', 'locked_until', 'created_at'],
    order: [['created_at', 'DESC']], limit: pg.limit, offset: pg.offset,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function createStaff({ email, password, role }) {
  if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) throw AppError.badRequest('Akun yang dapat dibuat di menu ini hanya Admin atau Super Admin');
  if (await User.findOne({ where: { email }, attributes: ['id_user'] })) throw AppError.conflict('Email sudah terdaftar');
  const u = await User.create({ email, password: await hashPassword(password), role });
  return { id_user: u.id_user, email: u.email, role: u.role };
}

async function assertNotLastSuperAdmin(user) {
  if (user.role !== ROLES.SUPER_ADMIN) return;
  const n = await User.count({ where: { role: ROLES.SUPER_ADMIN, is_active: true, id_user: { [Op.ne]: user.id_user } } });
  if (n === 0) throw AppError.conflict('Harus ada minimal satu Super Admin aktif');
}

async function setRole(id, role, actor) {
  if (id === actor.id_user) throw AppError.badRequest('Tidak dapat mengubah role akun sendiri');
  const u = await User.findByPk(id);
  if (!u) throw AppError.notFound('User tidak ditemukan');
  if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role) || ![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(u.role)) {
    throw AppError.badRequest('Perubahan role hanya antara Admin dan Super Admin');
  }
  await assertNotLastSuperAdmin(u);
  await u.update({ role });
  return { id_user: u.id_user, email: u.email, role: u.role };
}

async function setStatus(id, isActive, actor) {
  if (id === actor.id_user) throw AppError.badRequest('Tidak dapat menonaktifkan akun sendiri');
  const u = await User.findByPk(id);
  if (!u) throw AppError.notFound('User tidak ditemukan');
  if (!isActive) await assertNotLastSuperAdmin(u);
  await u.update({ is_active: isActive, locked_until: null, failed_login_attempts: 0 });
  return { id_user: u.id_user, email: u.email, is_active: u.is_active };
}

async function resetPassword(id, password) {
  const u = await User.findByPk(id);
  if (!u) throw AppError.notFound('User tidak ditemukan');
  await u.update({ password: await hashPassword(password), locked_until: null, failed_login_attempts: 0 });
}

async function auditLog(query) {
  const pg = getPagination(query);
  const where = {};
  if (query.aksi) where.aksi = query.aksi;
  if (query.id_user) where.id_user = query.id_user;
  if (query.dari || query.sampai) {
    where.created_at = {};
    if (query.dari) where.created_at[Op.gte] = `${query.dari} 00:00:00`;
    if (query.sampai) where.created_at[Op.lte] = `${query.sampai} 23:59:59`;
  }
  const { rows, count } = await AuditLog.findAndCountAll({
    where, include: [{ model: User, as: 'user', attributes: ['email', 'role'] }],
    order: [['created_at', 'DESC'], ['id_log', 'DESC']], limit: pg.limit, offset: pg.offset,
  });
  return { rows, meta: buildMeta(pg, count) };
}

/** Stream dump database (KN-09). Membutuhkan utilitas mysqldump di server. */
function streamBackup(res, onError) {
  const args = ['-h', env.db.host, '-P', String(env.db.port), '-u', env.db.user, '--single-transaction', '--routines', '--no-tablespaces', env.db.name];
  const dump = spawn(process.env.MYSQLDUMP_PATH || 'mysqldump', args, { env: { ...process.env, MYSQL_PWD: env.db.password } });
  let started = false;
  dump.on('error', () => onError(new AppError('Utilitas mysqldump tidak tersedia di server', 501)));
  dump.stdout.once('data', () => {
    started = true;
    const name = `backup_${env.db.name}_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  });
  dump.stdout.pipe(res);
  dump.on('close', (code) => {
    if (code !== 0 && !started) onError(new AppError('Backup database gagal', 500));
  });
}

module.exports = { list, createStaff, setRole, setStatus, resetPassword, auditLog, streamBackup };
