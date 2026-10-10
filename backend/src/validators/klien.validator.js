const { body, query } = require('express-validator');
const v = require('./common');
const { KATEGORI_KELUARGA } = require('../config/constants');

const profil = (isCreate) => [
  isCreate ? v.oneOf('hubungan_akun', ['Anak', 'Lainnya'], { optional: false }) : body('hubungan_akun').not().exists().withMessage('Hubungan akun tidak dapat diubah'),
  v.nama('nama_lengkap', { optional: !isCreate }),
  v.oneOf('jenis_kelamin', ['Laki-laki', 'Perempuan']),
  v.str('tempat_lahir', 100),
  v.date('tanggal_lahir').custom((d) => !d || new Date(d) <= new Date()).withMessage('Tanggal lahir tidak boleh di masa depan'),
  v.text('alamat_rumah', 500),
  v.noHp('no_hp'),
  v.str('agama', 50), v.str('kewarganegaraan', 50), v.str('suku_bangsa', 50),
  v.str('pendidikan_terakhir', 100), v.str('pekerjaan', 100),
  v.oneOf('status_pernikahan', ['Belum Menikah', 'Menikah', 'Bercerai', 'Janda', 'Duda']),
  body('tahun_menikah').optional({ values: 'null' }).isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Tahun menikah tidak valid').toInt(),
];

module.exports = {
  createProfil: profil(true),
  updateProfil: profil(false),
  keluarga: [
    v.oneOf('kategori', KATEGORI_KELUARGA, { optional: false }),
    v.oneOf('status_hubungan', ['Kandung', 'Tiri', 'Angkat']),
    v.nama('nama'),
    v.oneOf('jenis_kelamin', ['Laki-laki', 'Perempuan']),
    v.str('usia', 20), v.str('tempat_tanggal_lahir', 150), v.str('agama', 50), v.str('pendidikan', 100), v.str('pekerjaan', 100),
    v.text('alamat', 500), v.str('keterangan', 255), v.bool('masih_hidup'),
    body('urutan').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  organisasi: [v.str('nama_organisasi', 150).notEmpty().withMessage('Nama organisasi wajib diisi'), v.str('jenis_organisasi', 100), v.str('tahun', 20), v.str('jabatan', 100)],
  referensi: [v.nama('nama'), v.str('alamat_telepon', 255), v.str('jabatan', 100), v.str('hubungan', 100)],
  intakeDewasa: v.fromFieldDefs(v.fieldDefs.INTAKE_DEWASA),
  intakeAnak: [
    ...v.fromFieldDefs(v.fieldDefs.INTAKE_ANAK),
    body('kelahiran').optional().isObject().withMessage('kelahiran harus objek'),
    body('perkembangan').optional().isObject().withMessage('perkembangan harus objek'),
    body('pendidikan_sosial').optional().isObject().withMessage('pendidikan_sosial harus objek'),
    ...prefixed('kelahiran', v.fieldDefs.RIWAYAT_KELAHIRAN_ASI),
    ...prefixed('perkembangan', v.fieldDefs.RIWAYAT_PERKEMBANGAN_ANAK),
    ...prefixed('pendidikan_sosial', v.fieldDefs.RIWAYAT_PENDIDIKAN_SOSIAL_ANAK),
  ],
  booking: [
    body('id_klien').isInt({ min: 1 }).withMessage('Profil klien wajib dipilih').toInt(),
    body('id_layanan').isInt({ min: 1 }).withMessage('Layanan wajib dipilih').toInt(),
    body('id_jadwal').isInt({ min: 1 }).withMessage('Jadwal wajib dipilih').toInt(),
    v.oneOf('tipe_sesi', ['Online', 'Offline'], { optional: false }),
    v.text('catatan_klien', 1000),
  ],
  batal: [v.text('alasan', 500)],
  ulasan: [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1 sampai 5').toInt(),
    v.text('komentar', 1000),
  ],
  listSesi: [...v.pagination, query('status').optional().isIn(['Terdaftar', 'Berjalan', 'Selesai', 'Batal']), query('waktu').optional().isIn(['mendatang', 'lampau']), query('id_klien').optional().isInt().toInt()],
};

/** Validasi field bersarang, mis. kelahiran.skor_apgar */
function prefixed(prefix, defs) {
  return v.fromFieldDefs(Object.fromEntries(Object.entries(defs).map(([k, d]) => [`${prefix}.${k}`, d])));
}
