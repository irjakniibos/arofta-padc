/** Pencatatan jejak aktivitas (audit log) untuk Super Admin. Tidak pernah menggagalkan proses utama. */
const { AuditLog } = require('../models');
const logger = require('../utils/logger');

async function log(req, aksi, entitas = null, idEntitas = null, deskripsi = null) {
  try {
    await AuditLog.create({
      id_user: req && req.user ? req.user.id_user : null,
      aksi,
      entitas,
      id_entitas: idEntitas !== null && idEntitas !== undefined ? String(idEntitas) : null,
      deskripsi,
      ip_address: req ? (req.ip || '').slice(0, 45) : null,
    });
  } catch (e) {
    logger.warn('Gagal menulis audit log:', e.message);
  }
}

module.exports = { log };
