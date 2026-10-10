/* eslint-disable no-console */
/**
 * Backup database ke storage/backup/<nama>_<waktu>.sql (KN-09).
 * Jadwalkan lewat cron server, contoh harian 01.00:
 *   0 1 * * * cd /path/backend && npm run backup >> storage/backup/backup.log 2>&1
 * Menyimpan 14 file terakhir.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const env = require('../src/config/env');

const dir = path.join(env.storage.root, 'backup');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${env.db.name}_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);
const out = fs.createWriteStream(file);
const args = ['-h', env.db.host, '-P', String(env.db.port), '-u', env.db.user, '--single-transaction', '--routines', '--no-tablespaces', env.db.name];
const dump = spawn(process.env.MYSQLDUMP_PATH || 'mysqldump', args, { env: { ...process.env, MYSQL_PWD: env.db.password } });

dump.stdout.pipe(out);
dump.stderr.on('data', (d) => process.stderr.write(d));
dump.on('error', (e) => { console.error('mysqldump tidak ditemukan:', e.message); process.exit(1); });
dump.on('close', (code) => {
  if (code !== 0) { fs.rmSync(file, { force: true }); console.error('Backup gagal'); process.exit(1); }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  files.slice(0, Math.max(0, files.length - 14)).forEach((f) => fs.rmSync(path.join(dir, f)));
  console.log(`Backup tersimpan: ${file}`);
});
