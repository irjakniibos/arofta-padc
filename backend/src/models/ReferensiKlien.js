const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ReferensiKlien', {
  id_referensi: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_klien: { type: DataTypes.INTEGER, allowNull: false },
  nama: { type: DataTypes.STRING(150), allowNull: false },
  alamat_telepon: DataTypes.STRING(255),
  jabatan: DataTypes.STRING(100),
  hubungan: DataTypes.STRING(100),
}, { tableName: 'referensi_klien', timestamps: false });
