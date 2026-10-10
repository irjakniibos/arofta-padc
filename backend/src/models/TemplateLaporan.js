const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('TemplateLaporan', {
  id_template: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  kode: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  nama_template: { type: DataTypes.STRING(150), allowNull: false },
  deskripsi: DataTypes.TEXT,
  file_docx: DataTypes.STRING(255),
  skala_min: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
  skala_max: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 5 },
  keterangan_skala: DataTypes.STRING(255),
  versi: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'template_laporan' });
