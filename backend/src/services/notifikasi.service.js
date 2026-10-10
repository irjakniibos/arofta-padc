/**
 * Notifikasi dashboard + email (KF-08, KF-09, KF-16, KF-17).
 * Email dikirim di latar belakang agar tidak memperlambat response API.
 */
const { Op } = require('sequelize');
const { Notifikasi, User } = require('../models');
const mail = require('./mail.service');
const { ROLES } = require('../config/constants');
const { getPagination, buildMeta } = require('../utils/pagination');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

async function kirim({ idUser, idSesi = null, tipe, judul, pesan, email = true, cta = null, transaction = null }) {
  const notif = await Notifikasi.create({ id_user: idUser, id_sesi: idSesi, tipe, judul, pesan }, { transaction });
  if (email) {
    const kirimEmail = async () => {
      const user = await User.findByPk(idUser, { attributes: ['email'] });
      const sent = await mail.send({ to: user && user.email, subject: judul, text: pesan, cta });
      if (sent) await Notifikasi.update({ email_terkirim: true }, { where: { id_notifikasi: notif.id_notifikasi } });
    };
    const run = () => kirimEmail().catch((e) => logger.error('Notifikasi email gagal:', e.message));
    if (transaction) transaction.afterCommit(run); else setImmediate(run);
  }
  return notif;
}

async function kirimKeAdmin({ idSesi = null, tipe, judul, pesan, email = false, transaction = null }) {
  const admins = await User.findAll({ where: { role: ROLES.ADMIN, is_active: true }, attributes: ['id_user'] });
  for (const a of admins) {
    await kirim({ idUser: a.id_user, idSesi, tipe, judul, pesan, email, transaction });
  }
}

async function listMilikUser(idUser, query) {
  const pg = getPagination(query);
  const where = { id_user: idUser };
  if (query.belum_dibaca === 'true') where.is_read = false;
  const { rows, count } = await Notifikasi.findAndCountAll({
    where,
    attributes: ['id_notifikasi', 'id_sesi', 'tipe', 'judul', 'pesan', 'is_read', 'created_at'],
    order: [['created_at', 'DESC'], ['id_notifikasi', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  const belumDibaca = await Notifikasi.count({ where: { id_user: idUser, is_read: false } });
  return { rows, meta: { ...buildMeta(pg, count), belum_dibaca: belumDibaca } };
}

async function tandaiDibaca(idUser, idNotifikasi) {
  const [n] = await Notifikasi.update({ is_read: true }, { where: { id_notifikasi: idNotifikasi, id_user: idUser } });
  if (!n) throw AppError.notFound('Notifikasi tidak ditemukan');
}

async function tandaiSemuaDibaca(idUser) {
  await Notifikasi.update({ is_read: true }, { where: { id_user: idUser, is_read: false } });
}

async function hapusLama(hari = 180) {
  const batas = new Date(Date.now() - hari * 86400000);
  return Notifikasi.destroy({ where: { is_read: true, created_at: { [Op.lt]: batas } } });
}

module.exports = { kirim, kirimKeAdmin, listMilikUser, tandaiDibaca, tandaiSemuaDibaca, hapusLama };
