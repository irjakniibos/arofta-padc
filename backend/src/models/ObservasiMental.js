const { DataTypes } = require('sequelize');
const toAttributes = require('./_attributes');
const { OBSERVASI_MENTAL } = require('./fields');

module.exports = (sequelize) => sequelize.define('ObservasiMental', {
  id_observasi: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sesi: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  ...toAttributes(OBSERVASI_MENTAL),
}, { tableName: 'observasi_mental', createdAt: false });
