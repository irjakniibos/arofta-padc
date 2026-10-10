const { DataTypes } = require('sequelize');
const { STATUS_LAPORAN } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('LaporanAsesmen', {
  id_laporan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sesi: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  id_template: DataTypes.INTEGER,
  status_laporan: { type: DataTypes.ENUM(...Object.values(STATUS_LAPORAN)), allowNull: false, defaultValue: 'Draft' },
  file_docx: DataTypes.STRING(255),
  file_pdf: DataTypes.STRING(255),
  tanggal_final: DataTypes.DATE,
}, { tableName: 'laporan_asesmen' });
