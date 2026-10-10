const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('PasswordReset', {
  id_reset: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_user: { type: DataTypes.INTEGER, allowNull: false },
  token_hash: { type: DataTypes.STRING(255), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'password_reset', updatedAt: false });
