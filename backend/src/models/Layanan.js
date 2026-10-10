const { DataTypes } = require('sequelize');
const { KATEGORI_LAYANAN, JENIS_INTAKE } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('Layanan', {
  id_layanan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nama_layanan: { type: DataTypes.STRING(150), allowNull: false },
  kategori: { type: DataTypes.ENUM(...KATEGORI_LAYANAN), allowNull: false },
  deskripsi: DataTypes.TEXT,
  harga: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  durasi_menit: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 60 },
  jenis_intake: { type: DataTypes.ENUM(...Object.values(JENIS_INTAKE)), allowNull: false, defaultValue: 'Dewasa' },
  id_template: DataTypes.INTEGER,
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'layanan' });
