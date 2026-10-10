'use strict';

/**
 * Data master awal: pengaturan, kategori fee, 4 template laporan klinik, dan layanan contoh.
 * Harga & tarif fee layanan adalah nilai awal yang dapat diubah Admin lewat menu Kelola Layanan.
 */
const fs = require('fs');
const path = require('path');
const env = require('../src/config/env');
const templates = require('./data/templates');

const PENGATURAN = [
  ['nama_lembaga', 'AROFTA PADC (Psychological Assessment and Development Center)', 'Nama lembaga di laporan & email', true],
  ['bank_nama', '-', 'Nama bank tujuan transfer', true],
  ['bank_no_rekening', '-', 'Nomor rekening tujuan transfer', true],
  ['bank_atas_nama', '-', 'Nama pemilik rekening', true],
  ['batas_bayar_jam', '24', 'Batas waktu pembayaran setelah booking (jam)', false],
  ['batas_bayar_sebelum_sesi_jam', '1', 'Pembayaran paling lambat N jam sebelum sesi dimulai', false],
  ['batas_booking_jam', '3', 'Booking online paling lambat N jam sebelum jadwal', true],
  ['maks_booking_belum_bayar', '5', 'Maksimal booking belum dibayar per akun klien', false],
  ['reminder_jam_sebelum', '24', 'Pengingat jadwal dikirim N jam sebelum sesi', false],
  ['kontak_whatsapp', '082228885529', 'Nomor WhatsApp admin (konfirmasi pembayaran & layanan mendesak)', true],
  ['alamat_klinik', 'Kauman RT 04/09, Ngadirejo, Kartasura, Sukoharjo', 'Alamat klinik & sesi tatap muka', true],
  ['email_lembaga', 'arofta.padc@gmail.com', 'Email resmi lembaga', true],
];

const KATEGORI_FEE = [
  ['Tester psikotes sederhana', 25000], ['Tester psikotes sedang', 50000], ['Tester psikotes kompleks', 75000],
  ['Skoring psikotes sederhana', 25000], ['Skoring psikotes sedang', 50000], ['Skoring psikotes kompleks', 75000],
  ['Penyusunan HPP sederhana', 50000], ['Penyusunan HPP sedang', 100000], ['Penyusunan HPP kompleks/klinis', 150000],
  ['Konseling sederhana', 100000], ['Konseling sedang', 150000], ['Konseling kompleks', 200000],
  ['Psikoterapi/Intervensi sederhana', 90000], ['Psikoterapi/Intervensi sedang', 125000], ['Psikoterapi/Intervensi kompleks', 200000],
];

// [nama, kategori, deskripsi, harga, durasi, jenis_intake, kode_template, [kategori fee]]
const LAYANAN = [
  ['Tes Psikologi Anak', 'Anak dan Remaja', 'Pemeriksaan kecerdasan, potensi belajar, dan kepribadian anak.', 350000, 120, 'Anak', 'TES_ANAK',
    ['Tester psikotes sedang', 'Skoring psikotes sedang', 'Penyusunan HPP sedang']],
  ['Tes Minat Bakat & Penjurusan', 'Anak dan Remaja', 'Pemetaan minat, bakat, dan rekomendasi jurusan sekolah/kuliah.', 300000, 120, 'Dewasa', 'MINAT_BAKAT',
    ['Tester psikotes sedang', 'Skoring psikotes sedang', 'Penyusunan HPP sedang']],
  ['Asesmen Rekrutmen Karyawan', 'Industri', 'Asesmen psikologis untuk seleksi dan penempatan karyawan.', 400000, 180, 'Dewasa', 'REKRUTMEN',
    ['Tester psikotes kompleks', 'Skoring psikotes kompleks', 'Penyusunan HPP sedang']],
  ['Psikotes Umum', 'Masyarakat Umum', 'Pemeriksaan psikologis umum (kecerdasan, sikap kerja, kepribadian).', 300000, 150, 'Dewasa', 'PSIKOLOGI_UMUM',
    ['Tester psikotes sedang', 'Skoring psikotes sedang', 'Penyusunan HPP sedang']],
  ['Konseling Individu', 'Masyarakat Umum', 'Sesi konseling psikologi individual bersama psikolog.', 250000, 60, 'Dewasa', null,
    ['Konseling sedang']],
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const qi = queryInterface;

    await qi.bulkInsert('pengaturan', PENGATURAN.map(([kunci, nilai, keterangan, isPublic]) => ({ kunci, nilai, keterangan, is_public: isPublic, updated_at: now })), { ignoreDuplicates: true });
    await qi.bulkInsert('kategori_fee', KATEGORI_FEE.map(([nama_kategori, nominal_default]) => ({ nama_kategori, nominal_default })));

    // Salin file template .docx default ke storage privat
    const targetDir = path.join(env.storage.root, 'template');
    fs.mkdirSync(targetDir, { recursive: true });

    const templateIds = {};
    for (const t of templates) {
      const src = path.resolve(__dirname, '../templates', t.file_docx);
      const fileName = fs.existsSync(src) ? `${t.kode}_v1.docx` : null;
      if (fileName) fs.copyFileSync(src, path.join(targetDir, fileName));
      await qi.bulkInsert('template_laporan', [{
        kode: t.kode, nama_template: t.nama_template, deskripsi: t.deskripsi, file_docx: fileName,
        skala_min: t.skala_min, skala_max: t.skala_max, keterangan_skala: t.keterangan_skala,
        versi: 1, is_active: true, created_at: now, updated_at: now,
      }]);
      const [[row]] = await qi.sequelize.query('SELECT id_template FROM template_laporan WHERE kode = ?', { replacements: [t.kode] });
      templateIds[t.kode] = row.id_template;
      await qi.bulkInsert('template_item', t.items.map((it) => ({
        id_template: row.id_template, kode: it.kode, kelompok: it.kelompok, urutan: it.urutan, label: it.label,
        deskripsi: it.deskripsi || null, tipe: it.tipe, opsi: it.opsi || null, wajib: it.wajib !== false, is_active: true,
      })));
    }

    const [feeRows] = await qi.sequelize.query('SELECT id_kategori_fee, nama_kategori, nominal_default FROM kategori_fee');
    const feeByName = Object.fromEntries(feeRows.map((r) => [r.nama_kategori, r]));

    for (const [nama, kategori, deskripsi, harga, durasi, intake, kodeTemplate, fees] of LAYANAN) {
      await qi.bulkInsert('layanan', [{
        nama_layanan: nama, kategori, deskripsi, harga, durasi_menit: durasi, jenis_intake: intake,
        id_template: kodeTemplate ? templateIds[kodeTemplate] : null, is_active: true, created_at: now, updated_at: now,
      }]);
      const [[l]] = await qi.sequelize.query('SELECT id_layanan FROM layanan WHERE nama_layanan = ?', { replacements: [nama] });
      await qi.bulkInsert('layanan_fee', fees.map((f) => ({
        id_layanan: l.id_layanan, id_kategori_fee: feeByName[f].id_kategori_fee, nominal: feeByName[f].nominal_default,
      })));
    }
  },

  async down(queryInterface) {
    const qi = queryInterface;
    await qi.bulkDelete('layanan_fee', null, {});
    await qi.bulkDelete('layanan', null, {});
    await qi.bulkDelete('template_item', null, {});
    await qi.bulkDelete('template_laporan', null, {});
    await qi.bulkDelete('kategori_fee', null, {});
    await qi.bulkDelete('pengaturan', null, {});
  },
};
