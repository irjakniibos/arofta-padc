/**
 * Profil klien, data keluarga/organisasi/referensi, dan formulir intake (KF-01, KF-04).
 * Satu akun dapat mengelola beberapa profil (diri sendiri + anak).
 */
const { Op } = require('sequelize');
const {
  sequelize, User, Klien, IntakeDewasa, IntakeAnak, RiwayatKelahiranAsi, RiwayatPerkembanganAnak,
  RiwayatPendidikanSosialAnak, KeluargaKlien, RiwayatOrganisasi, ReferensiKlien, SesiAsesmen, Layanan, Psikolog,
} = require('../models');
const F = require('../models/fields');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const { generateNomorRekam } = require('../utils/codes');
const { getPagination, buildMeta } = require('../utils/pagination');
const { JENIS_INTAKE } = require('../config/constants');
const wajib = require('./formWajib.service');

const PROFIL_FIELDS = ['nama_lengkap', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'alamat_rumah', 'no_hp', 'agama',
  'kewarganegaraan', 'suku_bangsa', 'pendidikan_terakhir', 'pekerjaan', 'status_pernikahan', 'tahun_menikah'];

const CHILD = {
  keluarga: { model: KeluargaKlien, pk: 'id_keluarga', fields: ['kategori', 'status_hubungan', 'nama', 'jenis_kelamin', 'usia', 'tempat_tanggal_lahir', 'agama', 'pendidikan', 'pekerjaan', 'alamat', 'keterangan', 'masih_hidup', 'urutan'], max: 30, order: [['kategori', 'ASC'], ['urutan', 'ASC']] },
  organisasi: { model: RiwayatOrganisasi, pk: 'id_organisasi', fields: ['nama_organisasi', 'jenis_organisasi', 'tahun', 'jabatan'], max: 20, order: [['id_organisasi', 'ASC']] },
  referensi: { model: ReferensiKlien, pk: 'id_referensi', fields: ['nama', 'alamat_telepon', 'jabatan', 'hubungan'], max: 10, order: [['id_referensi', 'ASC']] },
};

/** Penanda akses staf (Admin/Super Admin): boleh mengelola profil klien mana pun, termasuk klien walk-in tanpa akun. */
const STAF = Symbol('staf');

async function assertOwner(idUser, idKlien) {
  const where = idUser === STAF ? { id_klien: idKlien } : { id_klien: idKlien, id_user: idUser };
  const k = await Klien.findOne({ where });
  if (!k) throw AppError.notFound('Profil klien tidak ditemukan');
  return k;
}

async function listProfil(idUser) {
  return Klien.findAll({ where: { id_user: idUser }, order: [['id_klien', 'ASC']] });
}

async function createProfil(idUser, data) {
  const count = await Klien.count({ where: { id_user: idUser } });
  if (count >= 10) throw AppError.badRequest('Maksimal 10 profil per akun');
  wajib.profilBaru(data);
  return sequelize.transaction(async (t) => {
    const k = await Klien.create({ id_user: idUser, hubungan_akun: data.hubungan_akun || 'Anak', ...pick(data, PROFIL_FIELDS) }, { transaction: t });
    await k.update({ nomor_rekam_psikologi: generateNomorRekam(k.id_klien) }, { transaction: t });
    return k;
  });
}

async function updateProfil(idUser, idKlien, data) {
  const k = await assertOwner(idUser, idKlien);
  const values = pick(data, PROFIL_FIELDS);
  wajib.profil({ ...k.toJSON(), ...values });
  return k.update(values);
}

async function deleteProfil(idUser, idKlien) {
  const k = await assertOwner(idUser, idKlien);
  if (k.hubungan_akun === 'Diri Sendiri') throw AppError.badRequest('Profil utama akun tidak dapat dihapus');
  if (await SesiAsesmen.count({ where: { id_klien: idKlien } })) throw AppError.conflict('Profil sudah memiliki riwayat sesi dan tidak dapat dihapus');
  await k.destroy();
}

// ---------- data turunan (keluarga, organisasi, referensi) — satu implementasi untuk tiga tabel (DRY)
async function listChild(type, idUser, idKlien) {
  const c = CHILD[type];
  await assertOwner(idUser, idKlien);
  return c.model.findAll({ where: { id_klien: idKlien }, order: c.order });
}

async function createChild(type, idUser, idKlien, data) {
  const c = CHILD[type];
  await assertOwner(idUser, idKlien);
  if (await c.model.count({ where: { id_klien: idKlien } }) >= c.max) throw AppError.badRequest(`Maksimal ${c.max} data`);
  return c.model.create({ id_klien: idKlien, ...pick(data, c.fields) });
}

async function updateChild(type, idUser, idKlien, idChild, data) {
  const c = CHILD[type];
  await assertOwner(idUser, idKlien);
  const row = await c.model.findOne({ where: { [c.pk]: idChild, id_klien: idKlien } });
  if (!row) throw AppError.notFound();
  return row.update(pick(data, c.fields));
}

async function deleteChild(type, idUser, idKlien, idChild) {
  const c = CHILD[type];
  await assertOwner(idUser, idKlien);
  const n = await c.model.destroy({ where: { [c.pk]: idChild, id_klien: idKlien } });
  if (!n) throw AppError.notFound();
}

// ---------- intake dewasa (Form Identitas Klien)
async function getIntakeDewasa(idKlien) {
  return IntakeDewasa.findOne({ where: { id_klien: idKlien } });
}

async function saveIntakeDewasa(idUser, idKlien, data) {
  await assertOwner(idUser, idKlien);
  const values = pick(data, Object.keys(F.INTAKE_DEWASA));
  const existing = await IntakeDewasa.findOne({ where: { id_klien: idKlien } });
  wajib.intakeDewasa({ ...(existing ? existing.toJSON() : {}), ...values });
  if (existing) return existing.update(values);
  return IntakeDewasa.create({ id_klien: idKlien, ...values });
}

// ---------- intake anak (Form Informasi Riwayat Anak)
const ANAK_INCLUDE = [
  { model: RiwayatKelahiranAsi, as: 'kelahiran' },
  { model: RiwayatPerkembanganAnak, as: 'perkembangan' },
  { model: RiwayatPendidikanSosialAnak, as: 'pendidikanSosial' },
];

async function getIntakeAnak(idKlien) {
  return IntakeAnak.findOne({ where: { id_klien: idKlien }, include: ANAK_INCLUDE });
}

async function saveIntakeAnak(idUser, idKlien, data) {
  await assertOwner(idUser, idKlien);
  const lama = (await getIntakeAnak(idKlien))?.toJSON() || {};
  const gabung = (bagian, sumber) => ({ ...(lama[sumber] || {}), ...(data[bagian] || {}) });
  wajib.intakeAnak({
    ...lama, ...pick(data, Object.keys(F.INTAKE_ANAK)),
    kelahiran: gabung('kelahiran', 'kelahiran'),
    perkembangan: gabung('perkembangan', 'perkembangan'),
    pendidikan_sosial: gabung('pendidikan_sosial', 'pendidikanSosial'),
  });
  await sequelize.transaction(async (t) => {
    let intake = await IntakeAnak.findOne({ where: { id_klien: idKlien }, transaction: t });
    const main = pick(data, Object.keys(F.INTAKE_ANAK));
    if (intake) await intake.update(main, { transaction: t });
    else intake = await IntakeAnak.create({ id_klien: idKlien, ...main }, { transaction: t });

    const parts = [
      [RiwayatKelahiranAsi, data.kelahiran, F.RIWAYAT_KELAHIRAN_ASI],
      [RiwayatPerkembanganAnak, data.perkembangan, F.RIWAYAT_PERKEMBANGAN_ANAK],
      [RiwayatPendidikanSosialAnak, data.pendidikan_sosial, F.RIWAYAT_PENDIDIKAN_SOSIAL_ANAK],
    ];
    for (const [Model, part, defs] of parts) {
      if (!part) continue;
      const values = pick(part, Object.keys(defs));
      const row = await Model.findOne({ where: { id_intake_anak: intake.id_intake_anak }, transaction: t });
      if (row) await row.update(values, { transaction: t });
      else await Model.create({ id_intake_anak: intake.id_intake_anak, ...values }, { transaction: t });
    }
  });
  return getIntakeAnak(idKlien);
}

/** Memastikan formulir intake sudah diisi sebelum booking layanan. */
async function assertIntakeLengkap(idKlien, jenisIntake) {
  if (jenisIntake === JENIS_INTAKE.DEWASA) {
    const i = await IntakeDewasa.findOne({ where: { id_klien: idKlien }, attributes: ['pernyataan_benar'] });
    if (!i || !i.pernyataan_benar) throw AppError.badRequest('Lengkapi Formulir Identitas Klien (intake dewasa) dan centang pernyataan sebelum booking');
  } else if (jenisIntake === JENIS_INTAKE.ANAK) {
    const i = await IntakeAnak.findOne({ where: { id_klien: idKlien }, attributes: ['id_intake_anak'] });
    if (!i) throw AppError.badRequest('Lengkapi Formulir Informasi Riwayat Anak sebelum booking');
  }
}

/** Data lengkap klien (dipakai Admin & psikolog yang menangani). */
async function getDetailLengkap(idKlien) {
  const k = await Klien.findByPk(idKlien, {
    include: [
      { model: User, as: 'akun', attributes: ['id_user', 'email', 'is_active'] },
      { model: IntakeDewasa, as: 'intakeDewasa' },
      { model: IntakeAnak, as: 'intakeAnak', include: ANAK_INCLUDE },
      { model: KeluargaKlien, as: 'keluarga' },
      { model: RiwayatOrganisasi, as: 'organisasi' },
      { model: ReferensiKlien, as: 'referensi' },
    ],
    order: [[{ model: KeluargaKlien, as: 'keluarga' }, 'kategori', 'ASC'], [{ model: KeluargaKlien, as: 'keluarga' }, 'urutan', 'ASC']],
  });
  if (!k) throw AppError.notFound('Klien tidak ditemukan');
  return k;
}

async function getProfilLengkapMilik(idUser, idKlien) {
  await assertOwner(idUser, idKlien);
  return getDetailLengkap(idKlien);
}

async function listAdmin(query) {
  const pg = getPagination(query);
  const where = {};
  if (query.q) {
    where[Op.or] = [
      { nama_lengkap: { [Op.like]: `%${query.q}%` } },
      { nomor_rekam_psikologi: { [Op.like]: `%${query.q}%` } },
      { no_hp: { [Op.like]: `%${query.q}%` } },
    ];
  }
  const { rows, count } = await Klien.findAndCountAll({
    where,
    attributes: ['id_klien', 'nomor_rekam_psikologi', 'nama_lengkap', 'hubungan_akun', 'jenis_kelamin', 'tanggal_lahir', 'no_hp', 'created_at',
      [sequelize.literal('(SELECT COUNT(*) FROM sesi_asesmen s WHERE s.id_klien = Klien.id_klien)'), 'jumlah_sesi']],
    include: [{ model: User, as: 'akun', attributes: ['email', 'is_active'] }],
    order: [['created_at', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return { rows, meta: buildMeta(pg, count) };
}

async function riwayatSesi(idKlien) {
  return SesiAsesmen.findAll({
    where: { id_klien: idKlien },
    attributes: ['id_sesi', 'kode_booking', 'tanggal', 'waktu', 'tipe_sesi', 'status_asesmen'],
    include: [
      { model: Layanan, as: 'layanan', attributes: ['nama_layanan'] },
      { model: Psikolog, as: 'psikolog', attributes: ['nama_lengkap'] },
    ],
    order: [['tanggal', 'DESC']],
    limit: 50,
  });
}

module.exports = {
  STAF, assertOwner, listProfil, createProfil, updateProfil, deleteProfil,
  listChild, createChild, updateChild, deleteChild, CHILD,
  getIntakeDewasa, saveIntakeDewasa, getIntakeAnak, saveIntakeAnak, assertIntakeLengkap,
  getDetailLengkap, getProfilLengkapMilik, listAdmin, riwayatSesi,
};
