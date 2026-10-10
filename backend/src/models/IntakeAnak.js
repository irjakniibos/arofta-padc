const { DataTypes } = require('sequelize');
const toAttributes = require('./_attributes');
const { INTAKE_ANAK } = require('./fields');

module.exports = (sequelize) => sequelize.define('IntakeAnak', {
  id_intake_anak: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_klien: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  ...toAttributes(INTAKE_ANAK),
}, { tableName: 'intake_anak' });
