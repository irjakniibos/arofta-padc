/** Slot ketersediaan jadwal psikolog (KF-02). Mencegah slot tumpang tindih. */
const { Op } = require('sequelize');
const { JadwalPsikolog, Psikolog, User } = require('../models');
const { STATUS_SLOT, TIPE_SESI } = require('../config/constants');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { toDateString, combineDateTime } = require('../utils/date');

const MAX_BULK_HARI = 62;
const norm = (t) => (String(t).length === 5 ? `${t}:00` : String(t));

async function assertNoOverlap(idPsikolog, tanggal, mulai, selesai, excludeId = null) {
  const where = {
    id_psikolog: idPsikolog,
    tanggal,
    jam_mulai: { [Op.lt]: selesai },
    jam_selesai: { [Op.gt]: mulai },
  };
  if (excludeId) where.id_jadwal = { [Op.ne]: excludeId };
  const bentrok = await JadwalPsikolog.findOne({ where, attributes: ['id_jadwal', 'jam_mulai', 'jam_selesai'] });
  if (bentrok) throw AppError.conflict(`Slot bertabrakan dengan jadwal ${bentrok.jam_mulai.slice(0, 5)}-${bentrok.jam_selesai.slice(0, 5)} pada tanggal tersebut`);
}

function assertFuture(tanggal, jamMulai) {
  if (combineDateTime(tanggal, jamMulai) <= new Date()) throw AppError.badRequest('Jadwal harus di waktu yang akan datang');
}

function assertJam(mulai, selesai) {
  if (selesai <= mulai) throw AppError.badRequest('Jam selesai harus setelah jam mulai');
}

async function list(idPsikolog, query) {
  const pg = getPagination(query);
  const where = { id_psikolog: idPsikolog };
  if (query.status) where.status_slot = query.status;
  where.tanggal = { [Op.gte]: query.dari || toDateString() };
  if (query.sampai) where.tanggal[Op.lte] = query.sampai;
  const { rows, count } = await JadwalPsikolog.findAndCountAll({
    where, order: [['tanggal', 'ASC'], ['jam_mulai', 'ASC']], limit: pg.limit, offset: pg.offset,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function create(idPsikolog, data) {
  const mulai = norm(data.jam_mulai);
  const selesai = norm(data.jam_selesai);
  assertJam(mulai, selesai);
  assertFuture(data.tanggal, mulai);
  await assertNoOverlap(idPsikolog, data.tanggal, mulai, selesai);
  return JadwalPsikolog.create({
    id_psikolog: idPsikolog, tanggal: data.tanggal, jam_mulai: mulai, jam_selesai: selesai,
    tipe_sesi: data.tipe_sesi || TIPE_SESI.KEDUANYA,
  });
}

/** Membuat slot berulang: rentang tanggal × hari (1=Senin..7=Minggu) × daftar jam. */
async function createBulk(idPsikolog, data) {
  const start = new Date(`${data.tanggal_mulai}T00:00:00`);
  const end = new Date(`${data.tanggal_selesai}T00:00:00`);
  if (end < start) throw AppError.badRequest('Tanggal selesai harus setelah tanggal mulai');
  if ((end - start) / 86400000 > MAX_BULK_HARI) throw AppError.badRequest(`Rentang maksimal ${MAX_BULK_HARI} hari`);
  const hari = new Set(data.hari.map(Number));
  const slots = data.slot.map((s) => ({ mulai: norm(s.jam_mulai), selesai: norm(s.jam_selesai) }));
  slots.forEach((s) => assertJam(s.mulai, s.selesai));

  let dibuat = 0;
  let dilewati = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const isoDay = d.getDay() === 0 ? 7 : d.getDay();
    if (!hari.has(isoDay)) continue;
    const tanggal = toDateString(d);
    for (const s of slots) {
      try {
        assertFuture(tanggal, s.mulai);
        await assertNoOverlap(idPsikolog, tanggal, s.mulai, s.selesai);
        await JadwalPsikolog.create({ id_psikolog: idPsikolog, tanggal, jam_mulai: s.mulai, jam_selesai: s.selesai, tipe_sesi: data.tipe_sesi || TIPE_SESI.KEDUANYA });
        dibuat += 1;
      } catch (e) {
        if (!e.isOperational) throw e;
        dilewati += 1;
      }
    }
  }
  return { dibuat, dilewati };
}

async function findOwned(idPsikolog, idJadwal) {
  const where = { id_jadwal: idJadwal };
  if (idPsikolog) where.id_psikolog = idPsikolog;
  const j = await JadwalPsikolog.findOne({ where });
  if (!j) throw AppError.notFound('Slot jadwal tidak ditemukan');
  return j;
}

async function update(idPsikolog, idJadwal, data) {
  const j = await findOwned(idPsikolog, idJadwal);
  if (j.status_slot === STATUS_SLOT.DIPESAN) throw AppError.conflict('Slot sudah dipesan klien dan tidak dapat diubah');
  const tanggal = data.tanggal || j.tanggal;
  const mulai = data.jam_mulai ? norm(data.jam_mulai) : j.jam_mulai;
  const selesai = data.jam_selesai ? norm(data.jam_selesai) : j.jam_selesai;
  assertJam(mulai, selesai);
  assertFuture(tanggal, mulai);
  await assertNoOverlap(j.id_psikolog, tanggal, mulai, selesai, j.id_jadwal);
  const values = { tanggal, jam_mulai: mulai, jam_selesai: selesai };
  if (data.tipe_sesi) values.tipe_sesi = data.tipe_sesi;
  if (data.status_slot && data.status_slot !== STATUS_SLOT.DIPESAN) values.status_slot = data.status_slot;
  return j.update(values);
}

async function remove(idPsikolog, idJadwal) {
  const j = await findOwned(idPsikolog, idJadwal);
  if (j.status_slot === STATUS_SLOT.DIPESAN) throw AppError.conflict('Slot sudah dipesan klien dan tidak dapat dihapus');
  await j.destroy();
}

/** Slot yang bisa dipesan klien (publik). */
async function tersedia(query) {
  const today = toDateString();
  const where = { status_slot: STATUS_SLOT.TERSEDIA, tanggal: { [Op.gte]: query.dari || today } };
  if (query.sampai) where.tanggal[Op.lte] = query.sampai;
  if (query.tanggal) where.tanggal = query.tanggal;
  if (query.id_psikolog) where.id_psikolog = query.id_psikolog;
  if (query.tipe_sesi) where.tipe_sesi = [query.tipe_sesi, TIPE_SESI.KEDUANYA];
  const rows = await JadwalPsikolog.findAll({
    where,
    attributes: ['id_jadwal', 'id_psikolog', 'tanggal', 'jam_mulai', 'jam_selesai', 'tipe_sesi'],
    include: [{
      model: Psikolog, as: 'psikolog', attributes: ['nama_lengkap', 'spesialisasi'],
      include: [{ model: User, as: 'akun', attributes: [], where: { is_active: true } }],
    }],
    order: [['tanggal', 'ASC'], ['jam_mulai', 'ASC']],
    limit: 200,
  });
  const now = new Date();
  return rows.filter((r) => combineDateTime(r.tanggal, r.jam_mulai) > now);
}

module.exports = { list, create, createBulk, update, remove, tersedia, findOwned };
