const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Pengeluaran', {
  id_pengeluaran: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
  kategori: { type: DataTypes.STRING(100), allowNull: false },
  keterangan: DataTypes.TEXT,
  nominal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  dicatat_oleh: DataTypes.INTEGER,
}, { tableName: 'pengeluaran', updatedAt: false });
