const { DataTypes } = require('sequelize');
const toAttributes = require('./_attributes');
const { CATATAN_SOAP } = require('./fields');

module.exports = (sequelize) => sequelize.define('CatatanSoap', {
  id_soap: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sesi: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  ...toAttributes(CATATAN_SOAP),
}, { tableName: 'catatan_soap', createdAt: false });
