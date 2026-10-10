const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Ulasan', {
  id_ulasan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sesi: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  id_klien: { type: DataTypes.INTEGER, allowNull: false },
  id_psikolog: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 1, max: 5 } },
  komentar: DataTypes.TEXT,
  is_tampil: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'ulasan' });
