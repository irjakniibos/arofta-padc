const { DataTypes } = require('sequelize');
const toAttributes = require('./_attributes');
const { RIWAYAT_PERKEMBANGAN_ANAK } = require('./fields');

module.exports = (sequelize) => sequelize.define('RiwayatPerkembanganAnak', {
  id_perkembangan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_intake_anak: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  ...toAttributes(RIWAYAT_PERKEMBANGAN_ANAK),
}, { tableName: 'riwayat_perkembangan_anak', timestamps: false });
