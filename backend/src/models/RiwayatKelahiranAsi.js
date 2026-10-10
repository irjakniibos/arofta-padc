const { DataTypes } = require('sequelize');
const toAttributes = require('./_attributes');
const { RIWAYAT_KELAHIRAN_ASI } = require('./fields');

module.exports = (sequelize) => sequelize.define('RiwayatKelahiranAsi', {
  id_kelahiran: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_intake_anak: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  ...toAttributes(RIWAYAT_KELAHIRAN_ASI),
  berat_lahir_kg: DataTypes.DECIMAL(4, 2),
  panjang_lahir_cm: DataTypes.DECIMAL(4, 1),
}, { tableName: 'riwayat_kelahiran_asi', timestamps: false });
