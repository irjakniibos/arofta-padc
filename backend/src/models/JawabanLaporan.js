const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('JawabanLaporan', {
  id_jawaban: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_laporan: { type: DataTypes.INTEGER, allowNull: false },
  id_item: { type: DataTypes.INTEGER, allowNull: false },
  nilai_skala: DataTypes.TINYINT,
  jawaban_teks: DataTypes.TEXT,
}, { tableName: 'jawaban_laporan', timestamps: false });
