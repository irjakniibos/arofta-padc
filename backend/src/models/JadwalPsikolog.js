const { DataTypes } = require('sequelize');
const { STATUS_SLOT, TIPE_SESI } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('JadwalPsikolog', {
  id_jadwal: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_psikolog: { type: DataTypes.INTEGER, allowNull: false },
  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
  jam_mulai: { type: DataTypes.TIME, allowNull: false },
  jam_selesai: { type: DataTypes.TIME, allowNull: false },
  tipe_sesi: { type: DataTypes.ENUM(...Object.values(TIPE_SESI)), allowNull: false, defaultValue: 'Keduanya' },
  status_slot: { type: DataTypes.ENUM(...Object.values(STATUS_SLOT)), allowNull: false, defaultValue: 'Tersedia' },
}, { tableName: 'jadwal_psikolog', updatedAt: false });
