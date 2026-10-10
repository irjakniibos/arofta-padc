/**
 * Job terjadwal (node-cron, zona waktu Asia/Jakarta):
 * - tiap 15 menit : pengingat jadwal sesi & pembatalan tagihan kedaluwarsa
 * - tiap hari 02.00: bersihkan file pratinjau sementara & notifikasi lama
 */
const cron = require('node-cron');
const reminder = require('./reminder.job');
const pembayaran = require('../services/pembayaran.service');
const laporan = require('../services/laporan.service');
const notif = require('../services/notifikasi.service');
const logger = require('../utils/logger');

const tasks = [];
const TZ = { timezone: 'Asia/Jakarta' };

function safe(name, fn) {
  return async () => {
    try {
      await fn();
    } catch (e) {
      logger.error(`Job ${name} gagal:`, e.message);
    }
  };
}

function start() {
  tasks.push(cron.schedule('*/15 * * * *', safe('reminder', reminder.run), TZ));
  tasks.push(cron.schedule('*/15 * * * *', safe('tagihan-kedaluwarsa', async () => {
    const n = await pembayaran.batalkanKedaluwarsa();
    if (n) logger.info(`Booking dibatalkan otomatis (lewat batas bayar): ${n}`);
  }), TZ));
  tasks.push(cron.schedule('0 2 * * *', safe('pembersihan', async () => {
    laporan.bersihkanTmp(24);
    await notif.hapusLama(180);
  }), TZ));
  logger.info('Job terjadwal aktif');
}

function stop() {
  tasks.forEach((t) => t.stop());
  tasks.length = 0;
}

module.exports = { start, stop };
