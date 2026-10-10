'use strict';

/**
 * Data contoh untuk development & demo (HANYA jika SEED_DUMMY_DATA=true).
 * Semua akun dummy memakai password: Password123
 * Jangan aktifkan di server production.
 */
require('../src/config/env');
const bcrypt = require('bcrypt');

const PASSWORD = 'Password123';

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = {
  async up(queryInterface) {
    if (String(process.env.SEED_DUMMY_DATA).toLowerCase() !== 'true') return;
    const qi = queryInterface;
    const now = new Date();
    const hash = await bcrypt.hash(PASSWORD, 10);

    const users = [
      ['admin@arofta.id', 'Admin'],
      ['psikolog1@arofta.id', 'Psikolog'],
      ['psikolog2@arofta.id', 'Psikolog'],
      ['klien1@mail.com', 'Klien'],
      ['klien2@mail.com', 'Klien'],
    ];
    await qi.bulkInsert('users', users.map(([email, role]) => ({ email, password: hash, role, is_active: true, created_at: now, updated_at: now })));
    const [rows] = await qi.sequelize.query(`SELECT id_user, email FROM users WHERE email IN (${users.map(() => '?').join(',')})`, { replacements: users.map((u) => u[0]) });
    const id = Object.fromEntries(rows.map((r) => [r.email, r.id_user]));

    await qi.bulkInsert('psikolog', [
      { id_user: id['psikolog1@arofta.id'], nama_lengkap: 'Psikolog Contoh Satu, M.Psi., Psikolog', sipp: 'SIPP-DUMMY-001', spesialisasi: 'Psikologi Klinis Anak', pengalaman_tahun: 8, profil_singkat: 'Akun contoh untuk pengujian sistem.', created_at: now, updated_at: now },
      { id_user: id['psikolog2@arofta.id'], nama_lengkap: 'Psikolog Contoh Dua, M.Psi., Psikolog', sipp: 'SIPP-DUMMY-002', spesialisasi: 'Psikologi Industri & Organisasi', pengalaman_tahun: 5, profil_singkat: 'Akun contoh untuk pengujian sistem.', created_at: now, updated_at: now },
    ]);
    await qi.bulkInsert('klien', [
      { id_user: id['klien1@mail.com'], hubungan_akun: 'Diri Sendiri', nomor_rekam_psikologi: 'RP-DUMMY-00001', nama_lengkap: 'Klien Contoh Satu', jenis_kelamin: 'Laki-laki', tempat_lahir: 'Sukoharjo', tanggal_lahir: '1995-05-12', no_hp: '081200000001', pendidikan_terakhir: 'S1', pekerjaan: 'Karyawan Swasta', status_pernikahan: 'Menikah', created_at: now, updated_at: now },
      { id_user: id['klien1@mail.com'], hubungan_akun: 'Anak', nomor_rekam_psikologi: 'RP-DUMMY-00002', nama_lengkap: 'Anak Contoh', jenis_kelamin: 'Perempuan', tempat_lahir: 'Sukoharjo', tanggal_lahir: '2017-03-20', created_at: now, updated_at: now },
      { id_user: id['klien2@mail.com'], hubungan_akun: 'Diri Sendiri', nomor_rekam_psikologi: 'RP-DUMMY-00003', nama_lengkap: 'Klien Contoh Dua', jenis_kelamin: 'Perempuan', tempat_lahir: 'Surakarta', tanggal_lahir: '2000-11-02', no_hp: '081200000002', pendidikan_terakhir: 'SMA', pekerjaan: 'Mahasiswa', status_pernikahan: 'Belum Menikah', created_at: now, updated_at: now },
    ]);

    const [psi] = await qi.sequelize.query('SELECT id_psikolog FROM psikolog ORDER BY id_psikolog');
    const slots = [];
    for (const p of psi) {
      for (let d = 1; d <= 14; d += 1) {
        for (const [mulai, selesai] of [['09:00:00', '11:00:00'], ['13:00:00', '15:00:00']]) {
          slots.push({ id_psikolog: p.id_psikolog, tanggal: addDays(d), jam_mulai: mulai, jam_selesai: selesai, tipe_sesi: 'Keduanya', status_slot: 'Tersedia', created_at: now });
        }
      }
    }
    await qi.bulkInsert('jadwal_psikolog', slots);
  },

  async down(queryInterface) {
    const emails = ['admin@arofta.id', 'psikolog1@arofta.id', 'psikolog2@arofta.id', 'klien1@mail.com', 'klien2@mail.com'];
    await queryInterface.bulkDelete('users', { email: emails }, {});
  },
};
