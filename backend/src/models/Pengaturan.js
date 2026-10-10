const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Pengaturan', {
  kunci: { type: DataTypes.STRING(100), primaryKey: true },
  nilai: { type: DataTypes.TEXT, allowNull: false },
  keterangan: DataTypes.STRING(255),
  is_public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'pengaturan', createdAt: false });
