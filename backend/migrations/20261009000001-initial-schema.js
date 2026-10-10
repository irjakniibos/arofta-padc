'use strict';

/**
 * Migration awal: membuat seluruh tabel dari database/schema.sql.
 * Perubahan struktur selanjutnya WAJIB dibuat sebagai file migration baru
 * (npx sequelize-cli migration:generate --name nama-perubahan), bukan mengedit file ini.
 */
const fs = require('fs');
const path = require('path');

const TABLES_IN_DROP_ORDER = [
  'ulasan', 'audit_log', 'notifikasi', 'pengeluaran', 'rekap_fee', 'jawaban_laporan', 'laporan_asesmen',
  'catatan_soap', 'observasi_mental', 'anamnesis_sesi', 'pembayaran', 'sesi_asesmen', 'jadwal_psikolog',
  'riwayat_pendidikan_sosial_anak', 'riwayat_perkembangan_anak', 'riwayat_kelahiran_asi', 'intake_anak',
  'referensi_klien', 'riwayat_organisasi', 'keluarga_klien', 'intake_dewasa', 'pengaturan', 'layanan_fee',
  'kategori_fee', 'layanan', 'template_item', 'template_laporan', 'psikolog', 'klien', 'password_reset', 'users',
  'sequelize_data', // catatan seeder ikut dihapus agar seeder dapat dijalankan ulang setelah reset
];

module.exports = {
  async up(queryInterface) {
    const sql = fs.readFileSync(path.resolve(__dirname, '../database/schema.sql'), 'utf8');
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
      .filter(Boolean);
    for (const statement of statements) {
      await queryInterface.sequelize.query(statement);
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of TABLES_IN_DROP_ORDER) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
};
