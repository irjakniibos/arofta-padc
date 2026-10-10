const env = require('./config/env');
const app = require('./app');
const { sequelize } = require('./models');
const jobs = require('./jobs');
const logger = require('./utils/logger');

async function start() {
  try {
    await sequelize.authenticate();
    logger.info(`Terhubung ke database ${env.db.name}@${env.db.host}`);
  } catch (e) {
    logger.error('Gagal terhubung ke database:', e.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`API berjalan di http://localhost:${env.port}${env.apiBasePath} (${env.nodeEnv})`);
  });

  if (env.enableCron) jobs.start();

  const shutdown = async (signal) => {
    logger.info(`${signal} diterima, menutup server...`);
    jobs.stop();
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection:', reason));

start();
