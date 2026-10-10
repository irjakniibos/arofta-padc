const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('AuditLog', {
  id_log: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  id_user: DataTypes.INTEGER,
  aksi: { type: DataTypes.STRING(50), allowNull: false },
  entitas: DataTypes.STRING(50),
  id_entitas: DataTypes.STRING(50),
  deskripsi: DataTypes.TEXT,
  ip_address: DataTypes.STRING(45),
}, { tableName: 'audit_log', updatedAt: false });
