const { body, query } = require('express-validator');
const v = require('./common');
const { KATEGORI_LAYANAN, JENIS_INTAKE, STATUS_SESI, STATUS_BAYAR, METODE_BAYAR } = require('../config/constants');

const layanan = (isCreate) => [
  isCreate ? body('nama_layanan').trim().notEmpty().withMessage('Nama layanan wajib diisi').isLength({ max: 150 }) : v.str('nama_layanan', 150),
  v.oneOf('kategori', KATEGORI_LAYANAN, { optional: !isCreate }),
  v.text('deskripsi', 3000),
  v.money('harga', { optional: !isCreate }),
  body('durasi_menit').optional().isInt({ min: 15, max: 600 }).withMessage('Durasi 15-600 menit').toInt(),
  v.oneOf('jenis_intake', Object.values(JENIS_INTAKE)),
  body('id_template').optional({ values: 'undefined' }).custom((x) => x === null || Number.isInteger(Number(x))).withMessage('id_template tidak valid'),
  v.bool('is_active'),
];

// Booking Admin tanpa id_jadwal berarti membuat slot baru saat itu juga
const slotBaru = body('id_jadwal').not().exists({ values: 'null' });

module.exports = {
  layananCreate: layanan(true),
  layananUpdate: layanan(false),
  tarifFee: [
    body('items').isArray({ max: 30 }).withMessage('items harus array'),
    body('items.*.id_kategori_fee').isInt({ min: 1 }).toInt(),
    body('items.*.nominal').isFloat({ min: 0, max: 999999999 }).withMessage('Nominal fee tidak valid').toFloat(),
  ],
  kategoriFee: (isCreate) => [
    isCreate ? body('nama_kategori').trim().notEmpty().withMessage('Nama kategori wajib diisi').isLength({ max: 150 }) : v.str('nama_kategori', 150),
    v.money('nominal_default', { optional: !isCreate }), v.text('keterangan', 1000), v.bool('is_active'),
  ],
  psikologCreate: [
    v.email(), v.password(), v.str('nama_lengkap', 150).notEmpty().withMessage('Nama lengkap wajib diisi'),
    v.str('sipp', 50), v.str('str', 50), v.str('spesialisasi', 150),
    body('pengalaman_tahun').optional({ values: 'null' }).isInt({ min: 0, max: 60 }).toInt(), v.text('profil_singkat', 2000), v.noHp('no_hp'),
  ],
  psikologUpdate: [
    v.str('nama_lengkap', 150), v.str('sipp', 50), v.str('str', 50), v.str('spesialisasi', 150),
    body('pengalaman_tahun').optional({ values: 'null' }).isInt({ min: 0, max: 60 }).toInt(), v.text('profil_singkat', 2000), v.noHp('no_hp'),
  ],
  status: [body('is_active').isBoolean().withMessage('is_active harus true/false').toBoolean()],
  listSesi: [
    ...v.pagination,
    query('status').optional().isIn(Object.values(STATUS_SESI)),
    query('status_pembayaran').optional().isIn(Object.values(STATUS_BAYAR)),
    query('tipe_sesi').optional().isIn(['Online', 'Offline']),
    query('id_psikolog').optional().isInt().toInt(), query('id_layanan').optional().isInt().toInt(),
    query('dari').optional().isISO8601(), query('sampai').optional().isISO8601(),
    query('q').optional().isString().isLength({ max: 100 }), query('urut').optional().isIn(['terbaru', 'jadwal']),
  ],
  alokasi: [body('id_jadwal').isInt({ min: 1 }).withMessage('Slot jadwal wajib dipilih').toInt()],
  tautan: [
    body('tautan_zoom').optional({ values: 'null' }).isURL({ protocols: ['https'], require_protocol: true }).withMessage('Tautan harus URL https yang valid').isLength({ max: 512 }),
    v.str('lokasi_ruangan', 255),
  ],
  batalSesi: [body('alasan').trim().notEmpty().withMessage('Alasan pembatalan wajib diisi').isLength({ max: 500 })],
  verifikasi: [v.oneOf('status', ['Lunas', 'Ditolak'], { optional: false }), v.text('catatan_admin', 500)],
  ubahNominal: [
    v.money('total_bayar'),
    body('alasan_ubah_nominal').trim().notEmpty().withMessage('Alasan perubahan nominal wajib diisi').isLength({ max: 255 }),
  ],
  // Booking oleh Admin (kebutuhan mendesak/walk-in)
  bookingAdmin: [
    body('id_layanan').isInt({ min: 1 }).withMessage('Layanan wajib dipilih').toInt(),
    v.oneOf('tipe_sesi', ['Online', 'Offline'], { optional: false }),
    v.oneOf('klien_mode', ['terdaftar', 'tanpa_akun', 'buat_akun'], { optional: false }),
    body('id_klien').if(body('klien_mode').equals('terdaftar')).isInt({ min: 1 }).withMessage('Klien wajib dipilih').toInt(),
    v.nama('nama_lengkap', { when: body('klien_mode').not().equals('terdaftar') }),
    v.noHp('no_hp'),
    v.oneOf('jenis_kelamin', ['Laki-laki', 'Perempuan']),
    v.date('tanggal_lahir'),
    v.email('email', { when: body('klien_mode').equals('buat_akun') }),
    body('id_jadwal').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Slot jadwal tidak valid').toInt(),
    body('id_psikolog').if(slotBaru).isInt({ min: 1 }).withMessage('Psikolog wajib dipilih').toInt(),
    v.date('tanggal', { optional: false, when: slotBaru }),
    v.time('jam_mulai', { when: slotBaru }),
    v.time('jam_selesai', { when: slotBaru }),
    v.oneOf('metode_bayar', Object.values(METODE_BAYAR), { optional: false }),
    v.money('total_bayar', { optional: true }),
    v.str('alasan_ubah_nominal', 255),
    v.text('catatan_klien', 1000),
    v.setuju('setuju_persetujuan', 'Pastikan klien atau wali sudah menyetujui informed consent'),
  ],
  bayarFee: [body('id_fee').isArray({ min: 1, max: 200 }).withMessage('Pilih minimal satu fee'), body('id_fee.*').isInt({ min: 1 }).toInt(), v.text('catatan', 500)],
  periode: [query('bulan').optional().isInt({ min: 1, max: 12 }).toInt(), query('tahun').optional().isInt({ min: 2020, max: 2100 }).toInt()],
  pengeluaran: (isCreate) => [
    v.date('tanggal', { optional: !isCreate }),
    isCreate ? body('kategori').trim().notEmpty().withMessage('Kategori wajib diisi').isLength({ max: 100 }) : v.str('kategori', 100),
    v.text('keterangan', 1000),
    body('nominal').if(() => isCreate).exists().withMessage('Nominal wajib diisi'),
    body('nominal').optional().isFloat({ min: 1, max: 9999999999 }).withMessage('Nominal harus lebih dari 0').toFloat(),
  ],
  pengaturan: [
    body('items').isArray({ min: 1, max: 30 }).withMessage('items harus array'),
    body('items.*.kunci').isString().matches(/^[a-z_]{2,100}$/).withMessage('Kunci tidak valid'),
    body('items.*.nilai').isString().isLength({ max: 1000 }).withMessage('Nilai maksimal 1000 karakter'),
  ],
  template: (isCreate) => [
    isCreate ? body('kode').trim().matches(/^[A-Z0-9_]{3,50}$/).withMessage('Kode huruf kapital/angka/underscore, 3-50 karakter') : body('kode').not().exists().withMessage('Kode tidak dapat diubah'),
    isCreate ? body('nama_template').trim().notEmpty().withMessage('Nama template wajib diisi').isLength({ max: 150 }) : v.str('nama_template', 150),
    v.text('deskripsi', 2000),
    body('skala_min').optional().isInt({ min: 0, max: 10 }).toInt(),
    body('skala_max').optional().isInt({ min: 1, max: 10 }).toInt(),
    v.str('keterangan_skala', 255), v.bool('is_active'),
    body('items').optional().isArray({ max: 100 }),
  ],
  templateItem: (isCreate) => [
    isCreate ? body('kode').matches(/^[a-z][a-z0-9_]{1,59}$/).withMessage('Kode item huruf kecil/angka/underscore') : v.str('kode', 60).matches(/^[a-z][a-z0-9_]{1,59}$/).withMessage('Kode item huruf kecil/angka/underscore'),
    isCreate ? body('kelompok').trim().notEmpty().withMessage('Kelompok wajib diisi').isLength({ max: 100 }) : v.str('kelompok', 100),
    isCreate ? body('urutan').isInt({ min: 1, max: 500 }).toInt() : body('urutan').optional().isInt({ min: 1, max: 500 }).toInt(),
    isCreate ? body('label').trim().notEmpty().withMessage('Label wajib diisi').isLength({ max: 150 }) : v.str('label', 150),
    v.text('deskripsi', 1000),
    v.oneOf('tipe', ['skala', 'teks', 'pilihan'], { optional: !isCreate }),
    v.str('opsi', 500), v.bool('wajib'), v.bool('is_active'),
  ],
  // Super Admin
  userCreate: [v.email(), v.password(), v.oneOf('role', ['Admin', 'Super Admin'], { optional: false })],
  role: [v.oneOf('role', ['Admin', 'Super Admin'], { optional: false })],
  resetPassword: [v.password('password_baru')],
};
