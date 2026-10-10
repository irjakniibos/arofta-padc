const crypto = require('crypto');
const { toDateString } = require('./date');

/** Kode booking unik, contoh: ARF-20261009-7K3QX */
function generateKodeBooking(date = new Date()) {
  const random = crypto.randomBytes(4).toString('base64').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 5);
  return `ARF-${toDateString(date).replace(/-/g, '')}-${random.padEnd(5, 'X')}`;
}

/** Nomor rekam psikologi dari id klien, contoh: RP-2026-00012 */
function generateNomorRekam(idKlien, date = new Date()) {
  return `RP-${date.getFullYear()}-${String(idKlien).padStart(5, '0')}`;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generateKodeBooking, generateNomorRekam, generateToken, hashToken };
