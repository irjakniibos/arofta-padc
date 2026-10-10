/**
 * Role-Based Access Control (KN-03).
 * Super Admin otomatis mewarisi semua hak akses Admin.
 */
const AppError = require('../utils/AppError');
const { ROLES } = require('../config/constants');

module.exports = (...allowedRoles) => {
  const roles = new Set(allowedRoles);
  if (roles.has(ROLES.ADMIN)) roles.add(ROLES.SUPER_ADMIN);
  return (req, res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.has(req.user.role)) return next(AppError.forbidden());
    return next();
  };
};
