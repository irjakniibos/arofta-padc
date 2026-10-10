/** Mengubah definisi di fields.js menjadi atribut Sequelize. */
const { DataTypes } = require('sequelize');

module.exports = function toAttributes(fieldDefs) {
  const attrs = {};
  for (const [name, [type, arg]] of Object.entries(fieldDefs)) {
    if (type === 'text') attrs[name] = DataTypes.TEXT;
    else if (type === 'string') attrs[name] = DataTypes.STRING(arg);
    else if (type === 'enum') attrs[name] = DataTypes.ENUM(...arg);
    else if (type === 'bool') attrs[name] = { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false };
    else if (type === 'decimal') attrs[name] = DataTypes.DECIMAL(5, 1);
  }
  return attrs;
};
