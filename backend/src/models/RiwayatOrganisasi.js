const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('RiwayatOrganisasi', {
  id_organisasi: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_klien: { type: DataTypes.INTEGER, allowNull: false },
  nama_organisasi: { type: DataTypes.STRING(150), allowNull: false },
  jenis_organisasi: DataTypes.STRING(100),
  tahun: DataTypes.STRING(20),
  jabatan: DataTypes.STRING(100),
}, { tableName: 'riwayat_organisasi', timestamps: false });
