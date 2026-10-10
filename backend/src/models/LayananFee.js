const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('LayananFee', {
  id_layanan_fee: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_layanan: { type: DataTypes.INTEGER, allowNull: false },
  id_kategori_fee: { type: DataTypes.INTEGER, allowNull: false },
  nominal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
}, { tableName: 'layanan_fee', timestamps: false });
