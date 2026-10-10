const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  timezone: env.db.timezone,
  logging: false,
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    freezeTableName: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = sequelize;
