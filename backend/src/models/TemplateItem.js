const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('TemplateItem', {
  id_item: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_template: { type: DataTypes.INTEGER, allowNull: false },
  kode: { type: DataTypes.STRING(60), allowNull: false },
  kelompok: { type: DataTypes.STRING(100), allowNull: false },
  urutan: { type: DataTypes.SMALLINT, allowNull: false },
  label: { type: DataTypes.STRING(150), allowNull: false },
  deskripsi: DataTypes.TEXT,
  tipe: { type: DataTypes.ENUM('skala', 'teks', 'pilihan'), allowNull: false },
  opsi: DataTypes.STRING(500),
  wajib: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'template_item', timestamps: false });
