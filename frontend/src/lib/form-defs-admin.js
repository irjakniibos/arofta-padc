/** Definisi formulir halaman admin. */

export const AKUN_PSIKOLOG = [
  { judul: 'Akun login', fields: [
    { name: 'email', label: 'Email', type: 'email', required: true, max: 255 },
    { name: 'password', label: 'Password awal (opsional)', type: 'password', max: 72, hint: 'Kosongkan bila psikolog masuk dengan akun Google dari email di atas. Bila diisi: minimal 8 karakter, huruf besar, huruf kecil, dan angka.' },
  ] },
];
export const PROFIL_PSIKOLOG = [
  { judul: 'Profil profesional', fields: [
    { name: 'nama_lengkap', label: 'Nama lengkap dan gelar', required: true, max: 150 },
    { name: 'sipp', label: 'Nomor SIPP', max: 50 },
    { name: 'str', label: 'Nomor STR (opsional)', max: 50 },
    { name: 'spesialisasi', label: 'Spesialisasi', max: 150 },
    { name: 'pengalaman_tahun', label: 'Pengalaman (tahun)', type: 'number', maxValue: 60 },
    { name: 'no_hp', label: 'Nomor HP', type: 'tel', max: 16 },
    { name: 'profil_singkat', label: 'Profil singkat', type: 'textarea', rows: 4, max: 2000 },
  ] },
];


export const LAYANAN = (templates = []) => [
  { judul: 'Data layanan', fields: [
    { name: 'nama_layanan', label: 'Nama layanan', required: true, max: 150 },
    { name: 'kategori', label: 'Kategori', type: 'select', required: true, options: ['Anak dan Remaja', 'Industri', 'Masyarakat Umum'] },
    { name: 'harga', label: 'Harga (Rp)', type: 'number', required: true },
    { name: 'durasi_menit', label: 'Durasi (menit)', type: 'number', min: 15, maxValue: 600 },
    { name: 'jenis_intake', label: 'Formulir yang wajib diisi klien', type: 'select', options: [
      { value: 'Dewasa', label: 'Formulir identitas klien (dewasa)' }, { value: 'Anak', label: 'Formulir riwayat anak' }, { value: 'Tidak Ada', label: 'Tidak ada' }] },
    { name: 'id_template', label: 'Template laporan hasil', type: 'select', options: templates.map((t) => ({ value: String(t.id_template), label: t.nama_template })), hint: 'Kosongkan untuk layanan tanpa laporan tertulis (mis. konseling)' },
    { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', rows: 3, max: 3000 },
    { name: 'is_active', label: 'Aktif (tampil dan dapat dipesan klien)', type: 'bool', wide: true },
  ] },
];

export const KATEGORI_FEE = [{ judul: 'Kategori fee', fields: [
  { name: 'nama_kategori', label: 'Nama kategori', required: true, max: 150 },
  { name: 'nominal_default', label: 'Nominal default (Rp)', type: 'number', required: true },
  { name: 'keterangan', label: 'Keterangan', type: 'textarea', rows: 2, max: 1000 },
  { name: 'is_active', label: 'Aktif', type: 'bool', wide: true },
] }];

export const KATEGORI_PENGELUARAN = ['Sewa Tempat', 'Alat Tes', 'ATK', 'Listrik & Internet', 'Gaji Staf', 'Pemasaran', 'Lain-lain'];

export const PENGELUARAN = [{ judul: 'Pengeluaran operasional', fields: [
  { name: 'tanggal', label: 'Tanggal', type: 'date', required: true, maxToday: true },
  { name: 'kategori', label: 'Kategori', type: 'select', required: true, options: KATEGORI_PENGELUARAN },
  { name: 'nominal', label: 'Nominal (Rp)', type: 'number', required: true, min: 1 },
  { name: 'keterangan', label: 'Keterangan', type: 'textarea', rows: 2, max: 1000 },
] }];

export const TEMPLATE_META = (baru) => [{ judul: 'Data template', fields: [
  ...(baru ? [{ name: 'kode', label: 'Kode template', required: true, max: 50, hint: 'Huruf kapital, angka, atau garis bawah. Contoh: TES_KEMATANGAN. Tidak dapat diubah.' }] : []),
  { name: 'nama_template', label: 'Nama template', required: true, max: 150 },
  { name: 'skala_min', label: 'Nilai skala terendah', type: 'number', min: 0, maxValue: 10 },
  { name: 'skala_max', label: 'Nilai skala tertinggi', type: 'number', min: 1, maxValue: 10 },
  { name: 'keterangan_skala', label: 'Keterangan skala', max: 255, wide: true, placeholder: 'Mis. 1 = Kurang Sekali, 5 = Baik Sekali' },
  { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', rows: 2, max: 2000 },
  { name: 'is_active', label: 'Aktif (dapat dipilih untuk layanan)', type: 'bool', wide: true },
] }];

export const TEMPLATE_ITEM = [{ judul: 'Aspek / isian laporan', fields: [
  { name: 'label', label: 'Label', required: true, max: 150 },
  { name: 'kode', label: 'Kode placeholder', required: true, max: 60, hint: 'Huruf kecil/angka/garis bawah, mis. daya_ingat. Dipakai sebagai {daya_ingat} di file Word.' },
  { name: 'kelompok', label: 'Kelompok', required: true, max: 100, placeholder: 'Mis. KEMAMPUAN INTELEKTUAL' },
  { name: 'urutan', label: 'Urutan', type: 'number', required: true, min: 1, maxValue: 500 },
  { name: 'tipe', label: 'Tipe isian', type: 'select', required: true, options: [
    { value: 'skala', label: 'Skala nilai (psikogram)' }, { value: 'teks', label: 'Teks bebas' }, { value: 'pilihan', label: 'Pilihan (centang salah satu)' }] },
  { name: 'opsi', label: 'Opsi pilihan', max: 500, hint: 'Pisahkan dengan titik koma, mis. Disarankan;Dipertimbangkan;Tidak disarankan', showIf: (v) => v.tipe === 'pilihan' },
  { name: 'deskripsi', label: 'Deskripsi aspek', type: 'textarea', rows: 2, max: 1000 },
  { name: 'wajib', label: 'Wajib diisi psikolog sebelum finalisasi', type: 'bool' },
  { name: 'is_active', label: 'Aktif', type: 'bool' },
] }];
