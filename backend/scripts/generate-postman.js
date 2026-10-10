/* eslint-disable no-console */
/**
 * Membuat koleksi Postman dari seluruh route Express secara otomatis
 * (selalu sinkron dengan kode): node scripts/generate-postman.js
 */
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const env = require('../src/config/env');

const today = new Date();
const tgl = (d) => { const x = new Date(today); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

const EXAMPLES = {
  'POST /auth/register': { nama_lengkap: 'Budi Santoso', email: 'budi@mail.com', password: 'Rahasia123', konfirmasi_password: 'Rahasia123', no_hp: '081234567890', setuju_privasi: true },
  'POST /auth/login': { email: 'klien1@mail.com', password: 'Password123' },
  'PUT /auth/password': { password_lama: 'Password123', password_baru: 'PasswordBaru123', konfirmasi_password: 'PasswordBaru123' },
  'POST /auth/forgot-password': { email: 'klien1@mail.com' },
  'POST /auth/reset-password': { token: '<token-dari-email>', password_baru: 'PasswordBaru123', konfirmasi_password: 'PasswordBaru123' },
  'POST /klien/profil': { hubungan_akun: 'Anak', nama_lengkap: 'Nama Anak', jenis_kelamin: 'Perempuan', tempat_lahir: 'Sukoharjo', tanggal_lahir: '2017-03-20' },
  'PUT /klien/profil/:idKlien': { alamat_rumah: 'Kartasura', pendidikan_terakhir: 'S1', status_pernikahan: 'Menikah' },
  'POST /klien/profil/:idKlien/keluarga': { kategori: 'Ayah', status_hubungan: 'Kandung', nama: 'Nama Ayah', pendidikan: 'S1', pekerjaan: 'Wiraswasta' },
  'POST /klien/profil/:idKlien/organisasi': { nama_organisasi: 'OSIS', jenis_organisasi: 'Sekolah', tahun: '2015', jabatan: 'Ketua' },
  'POST /klien/profil/:idKlien/referensi': { nama: 'Nama Referensi', alamat_telepon: 'Solo / 0812...', jabatan: 'Manajer', hubungan: 'Atasan' },
  'PUT /klien/profil/:idKlien/intake-dewasa': { kegemaran_hobi: 'Membaca', kelebihan: 'Teliti\nDisiplin', kekurangan: 'Pemalu', keluhan_saat_ini: '...', harapan_pemeriksaan: '...', pernah_sakit_berat: false, pernah_psikotes: false, pernyataan_benar: true },
  'PUT /klien/profil/:idKlien/intake-anak': { nama_sekolah: 'SD N 1', kelas: '3', berat_badan_kg: 28, tinggi_badan_cm: 130, kelahiran: { keguguran_sebelumnya: 'Tidak', anak_diinginkan: 'Ya', kualitas_makanan: 'Baik' }, perkembangan: { duduk_bulan: '6', berjalan_bulan: '12' }, pendidikan_sosial: { masuk_sd_umur: '6', pernah_tinggal_kelas: 'Tidak' } },
  'POST /klien/booking': { id_klien: 1, id_layanan: 5, id_jadwal: 1, tipe_sesi: 'Online', catatan_klien: '', setuju_persetujuan: true },
  'PATCH /klien/sesi/:id/batal': { alasan: 'Berhalangan hadir' },
  'POST /klien/sesi/:id/ulasan': { rating: 5, komentar: 'Psikolog sangat membantu.' },
  'PATCH /admin/ulasan/:id/tampil': { is_tampil: false },
  'PUT /psikolog/profil': { spesialisasi: 'Psikologi Klinis Anak', profil_singkat: '...' },
  'POST /psikolog/jadwal': { tanggal: tgl(3), jam_mulai: '09:00', jam_selesai: '11:00', tipe_sesi: 'Keduanya' },
  'POST /psikolog/jadwal/bulk': { tanggal_mulai: tgl(1), tanggal_selesai: tgl(30), hari: [1, 3, 5], slot: [{ jam_mulai: '09:00', jam_selesai: '11:00' }, { jam_mulai: '13:00', jam_selesai: '15:00' }], tipe_sesi: 'Keduanya' },
  'PUT /psikolog/jadwal/:id': { status_slot: 'Ditutup' },
  'PATCH /psikolog/sesi/:id/status': { status: 'Berjalan' },
  'PUT /psikolog/sesi/:id/anamnesis': { rujukan: 'Orang tua', keluhan_utama: '...', faktor_pencetus: '...' },
  'PUT /psikolog/sesi/:id/observasi': { penampilan_umum: 'Rapi', mood: 'Eutimia', afek: 'Luas' },
  'PUT /psikolog/sesi/:id/soap': { subjective: '...', objective: '...', diagnosis_hipotesis: '...', intervensi: ['Psikoedukasi', 'Relaksasi'], rencana_tindak_lanjut: '...' },
  'PUT /psikolog/sesi/:id/laporan': { jawaban: [{ id_item: 1, nilai_skala: 4 }, { id_item: 15, jawaban_teks: '105' }] },
  'POST /admin/layanan': { nama_layanan: 'Layanan Baru', kategori: 'Masyarakat Umum', harga: 250000, durasi_menit: 60, jenis_intake: 'Dewasa', id_template: 4 },
  'PUT /admin/layanan/:id': { harga: 275000, is_active: true },
  'PUT /admin/layanan/:id/fee': { items: [{ id_kategori_fee: 2, nominal: 50000 }, { id_kategori_fee: 5, nominal: 50000 }] },
  'POST /admin/kategori-fee': { nama_kategori: 'Kategori Baru', nominal_default: 50000 },
  'POST /admin/psikolog': { email: 'psikolog.baru@arofta.id', password: 'Psikolog123', nama_lengkap: 'Nama, M.Psi., Psikolog', sipp: '0000-00-0-0', spesialisasi: 'Klinis' },
  'PATCH /admin/psikolog/:id/status': { is_active: false },
  'PATCH /admin/sesi/:id/alokasi': { id_jadwal: 2 },
  'PATCH /admin/sesi/:id/tautan': { tautan_zoom: 'https://zoom.us/j/1234567890' },
  'PATCH /admin/sesi/:id/status': { status: 'Selesai' },
  'PATCH /admin/sesi/:id/batal': { alasan: 'Psikolog berhalangan' },
  'PATCH /admin/pembayaran/:id/verifikasi': { status: 'Lunas', catatan_admin: '' },
  'PATCH /admin/pembayaran/:id/nominal': { total_bayar: 250000, alasan_ubah_nominal: 'Diskon mahasiswa' },
  'POST /admin/booking': {
    id_layanan: 5, tipe_sesi: 'Offline', klien_mode: 'tanpa_akun', nama_lengkap: 'Klien Walk In', no_hp: '081234567890',
    id_psikolog: 1, tanggal: tgl(0), jam_mulai: '14:00', jam_selesai: '15:00', metode_bayar: 'Tunai', setuju_persetujuan: true,
  },
  'PATCH /admin/fee/bayar': { id_fee: [1, 2, 3], catatan: 'Transfer BSI' },
  'POST /admin/pengeluaran': { tanggal: tgl(0), kategori: 'Alat Tes', nominal: 150000, keterangan: 'Lembar jawaban' },
  'POST /admin/template-laporan': { kode: 'TEMPLATE_BARU', nama_template: 'Template Baru', skala_min: 1, skala_max: 5 },
  'POST /admin/template-laporan/:id/item': { kode: 'aspek_baru', kelompok: 'KEPRIBADIAN', urutan: 30, label: 'Aspek Baru', deskripsi: '...', tipe: 'skala' },
  'PUT /admin/pengaturan': { items: [{ kunci: 'bank_nama', nilai: 'BSI' }, { kunci: 'bank_no_rekening', nilai: '1234567890' }, { kunci: 'bank_atas_nama', nilai: 'AROFTA PADC' }, { kunci: 'kontak_whatsapp', nilai: '082228885529' }, { kunci: 'batas_booking_jam', nilai: '3' }, { kunci: 'maks_booking_belum_bayar', nilai: '5' }] },
  'POST /superadmin/users': { email: 'admin2@arofta.id', password: 'AdminDua123', role: 'Admin' },
  'PATCH /superadmin/users/:id/role': { role: 'Super Admin' },
  'PATCH /superadmin/users/:id/status': { is_active: false },
  'PATCH /superadmin/users/:id/password': { password_baru: 'PasswordBaru123' },
};

const FOLDER = { auth: 'Auth', klien: 'Klien', psikolog: 'Psikolog', admin: 'Admin (Direksi)', superadmin: 'Super Admin' };

function collect(stack, prefix = '') {
  const out = [];
  for (const layer of stack) {
    if (layer.route) {
      for (const m of Object.keys(layer.route.methods)) out.push({ method: m.toUpperCase(), path: prefix + layer.route.path });
    } else if (layer.name === 'router' && layer.handle.stack) {
      const src = layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/').replace('(?:/(?=$))?(?=/|$)', '').replace('/?$', '');
      const mount = src === '^' || src.startsWith('?') ? '' : src.replace(/^\^/, '');
      out.push(...collect(layer.handle.stack, prefix + (mount === '/' ? '' : mount)));
    }
  }
  return out;
}

const routes = collect(app._router.stack).map((r) => ({ ...r, path: r.path.split('/?(?=/|$)').join('').replace(env.apiBasePath, '').replace(/\\/g, '') }));
const folders = {};
for (const r of routes) {
  const seg = r.path.split('/')[1];
  const folder = FOLDER[seg] || 'Publik & Umum';
  const key = `${r.method} ${r.path}`;
  const urlPath = r.path.replace(/:([A-Za-z]+)/g, '{{$1}}');
  const item = {
    name: key,
    request: {
      method: r.method,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: { raw: `{{baseUrl}}${urlPath}`, host: ['{{baseUrl}}'], path: urlPath.split('/').filter(Boolean) },
    },
  };
  if (EXAMPLES[key]) item.request.body = { mode: 'raw', raw: JSON.stringify(EXAMPLES[key], null, 2) };
  if (key === 'POST /admin/template-laporan/:id/file') {
    item.request.header = [];
    item.request.body = { mode: 'formdata', formdata: [{ key: 'file', type: 'file', src: '' }] };
  }
  (folders[folder] = folders[folder] || []).push(item);
}

const collection = {
  info: {
    name: 'API SIM Layanan Psikologi AROFTA PADC',
    description: 'Koleksi otomatis dari route backend. Login dulu (Auth > POST /auth/login); Postman menyimpan cookie sesi secara otomatis. Akun dummy: superadmin dari .env, admin@arofta.id, psikolog1@arofta.id, klien1@mail.com (password: Password123).',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: `http://localhost:${env.port}${env.apiBasePath}` },
    { key: 'id', value: '1' }, { key: 'idKlien', value: '1' }, { key: 'idItem', value: '1' },
  ],
  item: ['Auth', 'Publik & Umum', 'Klien', 'Psikolog', 'Admin (Direksi)', 'Super Admin'].filter((f) => folders[f]).map((f) => ({ name: f, item: folders[f] })),
};

const out = path.resolve(__dirname, '../postman/AROFTA_PADC_API.postman_collection.json');
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log(`Koleksi Postman: ${routes.length} endpoint -> ${out}`);
process.exit(0);
