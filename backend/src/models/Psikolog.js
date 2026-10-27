const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Psikolog', {
  id_psikolog: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_user: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  nama_lengkap: { type: DataTypes.STRING(150), allowNull: false },
  sipp: { type: DataTypes.STRING(50), unique: true },
  str: DataTypes.STRING(50),
  spesialisasi: DataTypes.STRING(150),
  pengalaman_tahun: DataTypes.TINYINT.UNSIGNED,
  profil_singkat: DataTypes.TEXT,
  no_hp: DataTypes.STRING(20),
  foto_path: DataTypes.STRING(255),
  foto_mime: DataTypes.STRING(100),
  foto_updated_at: DataTypes.DATE,
}, { tableName: 'psikolog' });
