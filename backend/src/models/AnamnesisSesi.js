const { DataTypes } = require('sequelize');
const toAttributes = require('./_attributes');
const { ANAMNESIS } = require('./fields');

module.exports = (sequelize) => sequelize.define('AnamnesisSesi', {
  id_anamnesis: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sesi: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  ...toAttributes(ANAMNESIS),
}, { tableName: 'anamnesis_sesi', createdAt: false });
