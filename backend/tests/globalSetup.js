/** Menyiapkan database pengujian (DB_NAME_TEST) dari nol sebelum seluruh test dijalankan. */
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const opts = {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'test', SEED_DUMMY_DATA: 'true', SOFFICE_PATH: process.env.SOFFICE_PATH || 'soffice' },
  };
  execSync('npx sequelize-cli db:migrate:undo:all --env test', opts);
  execSync('npx sequelize-cli db:migrate --env test', opts);
  execSync('npx sequelize-cli db:seed:all --env test', opts);
};
