/**
 * Kolom wajib pada profil klien dan formulir intake (mengikuti formulir kertas AROFTA PADC).
 * Dicek terhadap data gabungan (data tersimpan + perubahan) sehingga penyimpanan sebagian lewat API
 * tetap tidak boleh meninggalkan kolom wajib kosong. Frontend menandai kolom yang sama (lib/form-defs.js).
 */
const AppError = require('../utils/AppError');

const ambil = (obj, path) => path.split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
const kosong = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// [kolom, label, kondisi opsional (data) => wajib?]
const PROFIL = [
  ['nama_lengkap', 'Nama lengkap'],
  ['jenis_kelamin', 'Jenis kelamin'],
  ['tempat_lahir', 'Tempat lahir'],
  ['tanggal_lahir', 'Tanggal lahir'],
  ...[
    ['alamat_rumah', 'Alamat rumah'], ['no_hp', 'Nomor telepon / HP'], ['agama', 'Agama / kepercayaan'],
    ['pendidikan_terakhir', 'Pendidikan terakhir'], ['pekerjaan', 'Pekerjaan'], ['status_pernikahan', 'Status pernikahan'],
  ].map(([k, l]) => [k, l, (d) => d.hubungan_akun !== 'Anak']),
];

const INTAKE_DEWASA = [
  ['kegemaran_hobi', 'Kegemaran / hobi'],
  ['kelebihan', 'Kelebihan yang dimiliki'],
  ['kekurangan', 'Kekurangan yang dimiliki'],
  ['keluhan_saat_ini', 'Keluhan yang dihadapi saat ini'],
  ['harapan_pemeriksaan', 'Harapan setelah pemeriksaan'],
  ['sakit_tahun', 'Tahun sakit', (d) => d.pernah_sakit_berat],
  ['sakit_diagnosa', 'Diagnosa', (d) => d.pernah_sakit_berat],
  ['psikotes_tahun', 'Tahun pemeriksaan psikologis', (d) => d.pernah_psikotes],
  ['psikotes_keperluan', 'Keperluan pemeriksaan psikologis', (d) => d.pernah_psikotes],
];

const INTAKE_ANAK = [
  ['berat_badan_kg', 'Berat badan saat ini'],
  ['tinggi_badan_cm', 'Tinggi badan saat ini'],
  ['kelahiran.keguguran_sebelumnya', 'Keguguran sebelumnya'],
  ['kelahiran.anak_diinginkan', 'Anak yang diinginkan'],
  ['kelahiran.proses_kelahiran', 'Proses kelahiran'],
  ['kelahiran.berat_lahir_kg', 'Berat badan bayi'],
  ['kelahiran.kualitas_makanan', 'Kualitas makanan'],
  ['perkembangan.duduk_bulan', 'Usia duduk'],
  ['perkembangan.berjalan_bulan', 'Usia berjalan'],
  ['perkembangan.kata_pertama_bulan', 'Usia kata pertama'],
  ['pendidikan_sosial.hubungan_dengan_teman', 'Hubungan dengan teman'],
  ['pendidikan_sosial.pernah_tinggal_kelas', 'Pernah tinggal kelas'],
  ['pendidikan_sosial.tinggal_di_kelas', 'Tinggal di kelas', (d) => ambil(d, 'pendidikan_sosial.pernah_tinggal_kelas') === 'Ya'],
];

function periksa(data, aturan) {
  const errors = aturan
    .filter(([k, , syarat]) => (!syarat || syarat(data)) && kosong(ambil(data, k)))
    .map(([k, label]) => ({ field: k, msg: `${label} wajib diisi` }));
  if (errors.length) throw new AppError(`Lengkapi ${errors.length} kolom wajib yang masih kosong`, 422, errors);
}

module.exports = {
  profil: (data) => periksa(data, PROFIL),
  // Saat menambah profil anak/anggota keluarga cukup identitas dasar; kolom lain dilengkapi di halaman profil
  profilBaru: (data) => periksa(data, PROFIL.slice(0, 4)),
  intakeDewasa: (data) => {
    periksa(data, INTAKE_DEWASA);
    if (!data.pernyataan_benar) {
      throw new AppError('Centang pernyataan di bagian akhir formulir', 422, [{ field: 'pernyataan_benar', msg: 'Pernyataan wajib dicentang' }]);
    }
  },
  intakeAnak: (data) => periksa(data, INTAKE_ANAK),
};
