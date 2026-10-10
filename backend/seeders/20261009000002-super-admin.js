'use strict';

/** Membuat akun Super Admin pertama dari SEED_SUPERADMIN_EMAIL & SEED_SUPERADMIN_PASSWORD (.env). */
const bcrypt = require('bcrypt');
require('../src/config/env');

module.exports = {
  async up(queryInterface) {
    const email = process.env.SEED_SUPERADMIN_EMAIL;
    const password = process.env.SEED_SUPERADMIN_PASSWORD;
    if (!email || !password || password.length < 8) {
      throw new Error('Isi SEED_SUPERADMIN_EMAIL dan SEED_SUPERADMIN_PASSWORD (min 8 karakter) di .env');
    }
    const now = new Date();
    await queryInterface.bulkInsert('users', [{
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12)),
      role: 'Super Admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { role: 'Super Admin' }, {});
  },
};
