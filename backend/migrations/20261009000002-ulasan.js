'use strict';

/**
 * Migration: tabel ulasan klien terhadap sesi/psikolog.
 * - satu ulasan per sesi, hanya untuk sesi berstatus Selesai (dijaga di service)
 * - Admin dapat menyembunyikan ulasan yang tidak pantas (is_tampil)
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE ulasan (
          id_ulasan    INT AUTO_INCREMENT PRIMARY KEY,
          id_sesi      INT NOT NULL UNIQUE,
          id_klien     INT NOT NULL,
          id_psikolog  INT NOT NULL,
          rating       TINYINT NOT NULL,
          komentar     TEXT NULL,
          is_tampil    BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'FALSE = disembunyikan Admin',
          created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (id_sesi) REFERENCES sesi_asesmen(id_sesi) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (id_klien) REFERENCES klien(id_klien) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (id_psikolog) REFERENCES psikolog(id_psikolog) ON DELETE CASCADE ON UPDATE CASCADE,
          INDEX idx_ulasan_psikolog (id_psikolog, is_tampil, created_at),
          CHECK (rating BETWEEN 1 AND 5)
      ) ENGINE=InnoDB`);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS ulasan');
  },
};
