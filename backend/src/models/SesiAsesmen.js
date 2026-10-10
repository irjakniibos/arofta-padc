const { DataTypes } = require('sequelize');
const { STATUS_SESI } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('SesiAsesmen', {
  id_sesi: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  kode_booking: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  id_klien: { type: DataTypes.INTEGER, allowNull: false },
  id_psikolog: { type: DataTypes.INTEGER, allowNull: false },
  id_layanan: { type: DataTypes.INTEGER, allowNull: false },
  id_jadwal: { type: DataTypes.INTEGER, unique: true },
  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
  waktu: { type: DataTypes.TIME, allowNull: false },
  tipe_sesi: { type: DataTypes.ENUM('Online', 'Offline'), allowNull: false },
  status_asesmen: { type: DataTypes.ENUM(...Object.values(STATUS_SESI)), allowNull: false, defaultValue: 'Terdaftar' },
  tautan_zoom: DataTypes.STRING(512),
  lokasi_ruangan: DataTypes.STRING(255),
  catatan_klien: DataTypes.TEXT,
  alasan_batal: DataTypes.TEXT,
  persetujuan_at: DataTypes.DATE,
  persetujuan_versi: DataTypes.STRING(20),
  dibuat_oleh: DataTypes.INTEGER,
  reminder_terkirim: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'sesi_asesmen' });
