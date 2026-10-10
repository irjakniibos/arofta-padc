'use strict';

/**
 * Migration: aturan booking & pembayaran baru, booking oleh Admin, dan persetujuan privasi.
 * - users        : waktu & versi persetujuan Kebijakan Privasi (UU PDP 27/2022)
 * - klien        : id_user boleh kosong (profil klien walk-in tanpa akun login)
 * - sesi_asesmen : persetujuan informed consent, pembuat booking (Admin)
 * - pembayaran   : harga asli layanan & alasan bila nominal diubah Admin, penanda peringatan verifikasi
 * - pengaturan   : batas booking, batas bayar sebelum sesi, maks booking belum dibayar;
 *                  link Google Form dihapus karena konfirmasi pembayaran lewat WhatsApp
 */
const PENGATURAN_BARU = [
  ['batas_booking_jam', '3', 'Booking online paling lambat N jam sebelum jadwal', true],
  ['batas_bayar_sebelum_sesi_jam', '1', 'Pembayaran paling lambat N jam sebelum sesi dimulai', false],
  ['maks_booking_belum_bayar', '5', 'Maksimal booking belum dibayar per akun klien', false],
];

module.exports = {
  async up(queryInterface) {
    const q = (sql) => queryInterface.sequelize.query(sql);
    await q(`ALTER TABLE users
      ADD COLUMN privasi_disetujui_at DATETIME NULL AFTER last_login,
      ADD COLUMN privasi_versi VARCHAR(20) NULL AFTER privasi_disetujui_at`);
    await q('ALTER TABLE klien MODIFY id_user INT NULL COMMENT \'NULL = profil walk-in tanpa akun login\'');
    await q(`ALTER TABLE sesi_asesmen
      ADD COLUMN persetujuan_at DATETIME NULL AFTER alasan_batal,
      ADD COLUMN persetujuan_versi VARCHAR(20) NULL AFTER persetujuan_at,
      ADD COLUMN dibuat_oleh INT NULL COMMENT 'Admin pembuat booking; NULL = dipesan klien sendiri' AFTER persetujuan_versi,
      ADD CONSTRAINT fk_sesi_dibuat_oleh FOREIGN KEY (dibuat_oleh) REFERENCES users(id_user) ON DELETE SET NULL ON UPDATE CASCADE`);
    await q(`ALTER TABLE pembayaran
      ADD COLUMN harga_layanan DECIMAL(12,2) NULL COMMENT 'Harga layanan saat booking' AFTER total_bayar,
      ADD COLUMN alasan_ubah_nominal VARCHAR(255) NULL AFTER harga_layanan,
      ADD COLUMN peringatan_terkirim BOOLEAN NOT NULL DEFAULT FALSE AFTER catatan_admin`);
    await q('UPDATE pembayaran SET harga_layanan = total_bayar WHERE harga_layanan IS NULL');

    await queryInterface.bulkInsert('pengaturan', PENGATURAN_BARU.map(([kunci, nilai, keterangan, isPublic]) => ({
      kunci, nilai, keterangan, is_public: isPublic, updated_at: new Date(),
    })), { ignoreDuplicates: true });
    await queryInterface.bulkDelete('pengaturan', { kunci: 'link_form_bukti_bayar' });
  },

  async down(queryInterface) {
    const q = (sql) => queryInterface.sequelize.query(sql);
    await queryInterface.bulkDelete('pengaturan', { kunci: PENGATURAN_BARU.map(([k]) => k) });
    await queryInterface.bulkInsert('pengaturan', [{
      kunci: 'link_form_bukti_bayar', nilai: '-', keterangan: 'Link Google Form untuk mengunggah bukti transfer', is_public: true, updated_at: new Date(),
    }], { ignoreDuplicates: true });
    await q(`ALTER TABLE pembayaran
      DROP COLUMN peringatan_terkirim, DROP COLUMN alasan_ubah_nominal, DROP COLUMN harga_layanan`);
    await q('ALTER TABLE sesi_asesmen DROP FOREIGN KEY fk_sesi_dibuat_oleh');
    await q(`ALTER TABLE sesi_asesmen
      DROP COLUMN dibuat_oleh, DROP COLUMN persetujuan_versi, DROP COLUMN persetujuan_at`);
    // klien.id_user sengaja tetap boleh NULL: profil walk-in yang sudah punya sesi tidak dapat dihapus,
    // dan kolom nullable tidak mengganggu skema lama.
    await q('ALTER TABLE users DROP COLUMN privasi_versi, DROP COLUMN privasi_disetujui_at');
  },
};
