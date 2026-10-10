const { DataTypes } = require('sequelize');
const toAttributes = require('./_attributes');
const { RIWAYAT_PENDIDIKAN_SOSIAL_ANAK } = require('./fields');

module.exports = (sequelize) => sequelize.define('RiwayatPendidikanSosialAnak', {
  id_pendidikan_sosial: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_intake_anak: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  ...toAttributes(RIWAYAT_PENDIDIKAN_SOSIAL_ANAK),
}, { tableName: 'riwayat_pendidikan_sosial_anak', timestamps: false });
