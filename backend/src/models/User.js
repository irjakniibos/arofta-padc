const { DataTypes } = require('sequelize');
const { ROLES } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('User', {
  id_user: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM(...Object.values(ROLES)), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  failed_login_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  locked_until: { type: DataTypes.DATE, allowNull: true },
  last_login: { type: DataTypes.DATE, allowNull: true },
  privasi_disetujui_at: { type: DataTypes.DATE, allowNull: true },
  privasi_versi: { type: DataTypes.STRING(20), allowNull: true },
}, {
  tableName: 'users',
  defaultScope: { attributes: { exclude: ['password'] } },
  scopes: { withPassword: { attributes: { include: ['password'] } } },
});
