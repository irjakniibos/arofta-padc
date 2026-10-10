const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('KategoriFee', {
  id_kategori_fee: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nama_kategori: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  nominal_default: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  keterangan: DataTypes.TEXT,
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'kategori_fee', timestamps: false });
