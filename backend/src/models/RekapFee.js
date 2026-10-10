const { DataTypes } = require('sequelize');
const { STATUS_FEE } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('RekapFee', {
  id_fee: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sesi: { type: DataTypes.INTEGER, allowNull: false },
  id_psikolog: { type: DataTypes.INTEGER, allowNull: false },
  id_kategori_fee: { type: DataTypes.INTEGER, allowNull: false },
  nominal_fee: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status_distribusi: { type: DataTypes.ENUM(...Object.values(STATUS_FEE)), allowNull: false, defaultValue: 'Belum Dibayar' },
  tanggal_pencairan: DataTypes.DATE,
  catatan: DataTypes.TEXT,
}, { tableName: 'rekap_fee', updatedAt: false });
