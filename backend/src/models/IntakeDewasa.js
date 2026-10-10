const { DataTypes } = require('sequelize');
const toAttributes = require('./_attributes');
const { INTAKE_DEWASA } = require('./fields');

module.exports = (sequelize) => sequelize.define('IntakeDewasa', {
  id_intake_dewasa: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_klien: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  ...toAttributes(INTAKE_DEWASA),
}, { tableName: 'intake_dewasa' });
