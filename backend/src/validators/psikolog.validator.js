const { body, query } = require('express-validator');
const v = require('./common');
const { TIPE_SESI } = require('../config/constants');

const tipe = () => v.oneOf('tipe_sesi', Object.values(TIPE_SESI));

module.exports = {
  profil: [
    v.str('nama_lengkap', 150), v.str('spesialisasi', 150),
    body('pengalaman_tahun').optional({ values: 'null' }).isInt({ min: 0, max: 60 }).toInt(),
    v.text('profil_singkat', 2000), v.noHp('no_hp'),
  ],
  jadwal: [v.date('tanggal', { optional: false }), v.time('jam_mulai'), v.time('jam_selesai'), tipe()],
  jadwalUpdate: [
    v.date('tanggal'),
    body('jam_mulai').optional().matches(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/).withMessage('Format jam HH:mm'),
    body('jam_selesai').optional().matches(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/).withMessage('Format jam HH:mm'),
    tipe(), v.oneOf('status_slot', ['Tersedia', 'Ditutup']),
  ],
  jadwalBulk: [
    v.date('tanggal_mulai', { optional: false }), v.date('tanggal_selesai', { optional: false }),
    body('hari').isArray({ min: 1, max: 7 }).withMessage('Pilih minimal satu hari'),
    body('hari.*').isInt({ min: 1, max: 7 }).withMessage('Hari 1 (Senin) s.d. 7 (Minggu)').toInt(),
    body('slot').isArray({ min: 1, max: 12 }).withMessage('Isi minimal satu slot jam (maks 12)'),
    body('slot.*.jam_mulai').matches(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/).withMessage('Format jam HH:mm'),
    body('slot.*.jam_selesai').matches(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/).withMessage('Format jam HH:mm'),
    tipe(),
  ],
  listJadwal: [...v.pagination, query('dari').optional().isISO8601(), query('sampai').optional().isISO8601(), query('status').optional().isIn(['Tersedia', 'Dipesan', 'Ditutup'])],
  statusSesi: [v.oneOf('status', ['Berjalan', 'Selesai'], { optional: false })],
  anamnesis: v.fromFieldDefs(v.fieldDefs.ANAMNESIS),
  observasi: v.fromFieldDefs(v.fieldDefs.OBSERVASI_MENTAL),
  laporanDraft: [
    body('id_template').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
    body('jawaban').isArray({ max: 200 }).withMessage('jawaban harus berupa array'),
    body('jawaban.*.id_item').isInt({ min: 1 }).withMessage('id_item tidak valid').toInt(),
    body('jawaban.*.nilai_skala').optional({ values: 'null' }).isInt({ min: 0, max: 20 }).withMessage('nilai_skala harus angka').toInt(),
    body('jawaban.*.jawaban_teks').optional({ values: 'null' }).isString().isLength({ max: 10000 }),
  ],
};

// intervensi pada SOAP boleh dikirim sebagai array pilihan checklist atau string
module.exports.soap = [
  ...v.fromFieldDefs(Object.fromEntries(Object.entries(v.fieldDefs.CATATAN_SOAP).filter(([k]) => k !== 'intervensi'))),
  body('intervensi').optional({ values: 'null' }).custom((val) => Array.isArray(val) || typeof val === 'string').withMessage('intervensi harus array atau teks'),
  body('intervensi.*').optional().isString().isLength({ max: 100 }),
];
