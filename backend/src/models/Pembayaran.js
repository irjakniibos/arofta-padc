const { DataTypes } = require('sequelize');
const { STATUS_BAYAR } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('Pembayaran', {
  id_pembayaran: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sesi: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  total_bayar: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  harga_layanan: DataTypes.DECIMAL(12, 2),
  alasan_ubah_nominal: DataTypes.STRING(255),
  metode_bayar: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Transfer Bank' },
  status_pembayaran: { type: DataTypes.ENUM(...Object.values(STATUS_BAYAR)), allowNull: false, defaultValue: 'Menunggu Pembayaran' },
  batas_bayar: DataTypes.DATE,
  tanggal_konfirmasi: DataTypes.DATE,
  diverifikasi_oleh: DataTypes.INTEGER,
  tanggal_verifikasi: DataTypes.DATE,
  catatan_admin: DataTypes.TEXT,
  peringatan_terkirim: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'pembayaran' });
