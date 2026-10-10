'use strict';

/**
 * Migration: login dengan akun Google (KF-28).
 * - google_id : ID akun Google (claim `sub`) yang tertaut ke akun
 * - password  : boleh kosong untuk akun yang dibuat lewat Google; pengguna dapat membuat
 *               password kapan saja melalui fitur lupa password
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE users
      ADD COLUMN google_id VARCHAR(255) NULL UNIQUE COMMENT 'claim sub akun Google' AFTER password,
      MODIFY password VARCHAR(255) NULL COMMENT 'hash bcrypt; NULL = hanya masuk dengan Google'`);
  },

  async down(queryInterface) {
    // Akun tanpa password diberi hash acak yang tidak dapat ditebak agar kolom bisa kembali NOT NULL
    await queryInterface.sequelize.query("UPDATE users SET password = CONCAT('$2b$12$', SHA2(UUID(), 256)) WHERE password IS NULL");
    await queryInterface.sequelize.query(`ALTER TABLE users
      DROP COLUMN google_id,
      MODIFY password VARCHAR(255) NOT NULL COMMENT 'hash bcrypt'`);
  },
};
