const { DataTypes } = require('sequelize');
const { TIPE_NOTIF } = require('../config/constants');

module.exports = (sequelize) => sequelize.define('Notifikasi', {
  id_notifikasi: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_user: { type: DataTypes.INTEGER, allowNull: false },
  id_sesi: DataTypes.INTEGER,
  tipe: { type: DataTypes.ENUM(...Object.values(TIPE_NOTIF)), allowNull: false },
  judul: { type: DataTypes.STRING(150), allowNull: false },
  pesan: { type: DataTypes.TEXT, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  email_terkirim: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'notifikasi', updatedAt: false });
