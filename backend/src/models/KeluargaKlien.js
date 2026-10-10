const { DataTypes } = require('sequelize');
const { KATEGORI_KELUARGA } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('KeluargaKlien', {
  id_keluarga: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_klien: { type: DataTypes.INTEGER, allowNull: false },
  kategori: { type: DataTypes.ENUM(...KATEGORI_KELUARGA), allowNull: false },
  status_hubungan: DataTypes.ENUM('Kandung', 'Tiri', 'Angkat'),
  nama: { type: DataTypes.STRING(150), allowNull: false },
  jenis_kelamin: DataTypes.ENUM('Laki-laki', 'Perempuan'),
  usia: DataTypes.STRING(20),
  tempat_tanggal_lahir: DataTypes.STRING(150),
  agama: DataTypes.STRING(50),
  pendidikan: DataTypes.STRING(100),
  pekerjaan: DataTypes.STRING(100),
  alamat: DataTypes.TEXT,
  keterangan: DataTypes.STRING(255),
  masih_hidup: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  urutan: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, { tableName: 'keluarga_klien', timestamps: false });
