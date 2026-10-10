/**
 * Definisi formulir mengikuti formulir kertas AROFTA PADC:
 * Form Identitas Klien, Informasi Riwayat Anak, dan Formulir Asesmen & Catatan Konseling (SOAP).
 * Nama field sama persis dengan kolom database backend.
 */

const JK = ['Laki-laki', 'Perempuan'];
const YT = ['Ya', 'Tidak'];

export const PROFIL_KLIEN = [
  {
    judul: 'Data pribadi',
    fields: [
      { name: 'nama_lengkap', label: 'Nama lengkap', required: true, max: 150 },
      { name: 'jenis_kelamin', label: 'Jenis kelamin', type: 'select', options: JK },
      { name: 'tempat_lahir', label: 'Tempat lahir', max: 100 },
      { name: 'tanggal_lahir', label: 'Tanggal lahir', type: 'date', maxToday: true },
      { name: 'alamat_rumah', label: 'Alamat rumah', type: 'textarea', rows: 2, max: 500 },
      { name: 'no_hp', label: 'Nomor telepon / HP', type: 'tel', max: 16, placeholder: '081234567890' },
      { name: 'agama', label: 'Agama / kepercayaan', max: 50 },
      { name: 'kewarganegaraan', label: 'Kewarganegaraan', max: 50 },
      { name: 'suku_bangsa', label: 'Suku bangsa', max: 50 },
      { name: 'pendidikan_terakhir', label: 'Pendidikan terakhir', max: 100 },
      { name: 'pekerjaan', label: 'Pekerjaan', max: 100 },
      { name: 'status_pernikahan', label: 'Status pernikahan', type: 'select', options: ['Belum Menikah', 'Menikah', 'Bercerai', 'Janda', 'Duda'] },
      { name: 'tahun_menikah', label: 'Tahun menikah', type: 'number', min: 1900, maxValue: new Date().getFullYear(), showIf: (v) => v.status_pernikahan && v.status_pernikahan !== 'Belum Menikah' },
    ],
  },
];

export const INTAKE_DEWASA = [
  {
    judul: 'Kegiatan lainnya',
    fields: [
      { name: 'kegemaran_hobi', label: 'Kegemaran / hobi', type: 'textarea', rows: 2 },
      { name: 'kursus_pelatihan_keahlian', label: 'Kursus / pelatihan / keahlian', type: 'textarea', rows: 2 },
    ],
  },
  {
    judul: 'Keterangan lain',
    fields: [
      { name: 'kelebihan', label: 'Kelebihan yang dimiliki', type: 'textarea', hint: 'Tulis satu poin per baris', wide: false },
      { name: 'kekurangan', label: 'Kekurangan yang dimiliki', type: 'textarea', hint: 'Tulis satu poin per baris', wide: false },
      { name: 'keluhan_saat_ini', label: 'Keluhan yang dihadapi saat ini', type: 'textarea' },
      { name: 'harapan_pemeriksaan', label: 'Harapan setelah melakukan pemeriksaan psikologi', type: 'textarea' },
    ],
  },
  {
    judul: 'Riwayat kesehatan',
    fields: [
      { name: 'pernah_sakit_berat', label: 'Pernah menderita penyakit berat hingga dirawat di rumah sakit atau sakit yang lama sembuh', type: 'bool', wide: true },
      { name: 'sakit_tahun', label: 'Tahun', max: 10, showIf: (v) => v.pernah_sakit_berat },
      { name: 'sakit_lama', label: 'Berapa lama', max: 50, showIf: (v) => v.pernah_sakit_berat },
      { name: 'sakit_diagnosa', label: 'Diagnosa', max: 255, showIf: (v) => v.pernah_sakit_berat },
      { name: 'sakit_dirawat_di', label: 'Dirawat di mana', max: 150, showIf: (v) => v.pernah_sakit_berat },
    ],
  },
  {
    judul: 'Pemeriksaan psikologis sebelumnya',
    fields: [
      { name: 'pernah_psikotes', label: 'Pernah mengikuti pemeriksaan psikologis sebelumnya', type: 'bool', wide: true },
      { name: 'psikotes_tahun', label: 'Tahun', max: 10, showIf: (v) => v.pernah_psikotes },
      { name: 'psikotes_tempat', label: 'Di mana', max: 150, showIf: (v) => v.pernah_psikotes },
      { name: 'psikotes_keperluan', label: 'Untuk keperluan', max: 255, showIf: (v) => v.pernah_psikotes },
    ],
  },
  {
    judul: 'Pernyataan',
    fields: [
      { name: 'pernyataan_benar', label: 'Semua keterangan di atas saya buat dengan jujur dan sungguh-sungguh tanpa paksaan dari pihak mana pun.', type: 'bool', wide: true },
    ],
  },
];

export const INTAKE_ANAK = [
  {
    judul: 'Sekolah dan kesehatan',
    fields: [
      { name: 'nama_sekolah', label: 'Nama sekolah', max: 150 },
      { name: 'kelas', label: 'Kelas', max: 50 },
      { name: 'berat_badan_kg', label: 'Berat badan saat ini (kg)', type: 'number', step: '0.1' },
      { name: 'tinggi_badan_cm', label: 'Tinggi badan saat ini (cm)', type: 'number', step: '0.1' },
      { name: 'penyakit_pernah_diderita', label: 'Penyakit yang pernah diderita', type: 'textarea', rows: 2, wide: false },
      { name: 'lama_menderita_penyakit', label: 'Lama menderita penyakit', max: 100 },
      { name: 'gangguan_perkembangan_lain', label: 'Gangguan perkembangan lain', type: 'textarea', rows: 2 },
    ],
  },
  {
    judul: 'Riwayat kehamilan dan kelahiran',
    fields: [
      { name: 'kelahiran.keguguran_sebelumnya', label: 'Mengalami keguguran sebelumnya', type: 'select', options: YT },
      { name: 'kelahiran.anak_diinginkan', label: 'Tergolong anak yang diinginkan', type: 'select', options: ['Ya', 'Tidak', 'Tidak Tahu'] },
      { name: 'kelahiran.perasaan_waktu_hamil', label: 'Perasaan waktu hamil', type: 'textarea', rows: 2 },
      { name: 'kelahiran.umur_kandungan', label: 'Umur kandungan', max: 50 },
      { name: 'kelahiran.proses_kelahiran', label: 'Saat kelahiran', type: 'select', options: ['Normal', 'Caesar', 'Mudah', 'Sulit', 'Butuh bantuan'] },
      { name: 'kelahiran.skor_apgar', label: 'Skor Apgar', max: 20 },
      { name: 'kelahiran.tempat_melahirkan', label: 'Tempat melahirkan', max: 150 },
      { name: 'kelahiran.ditolong_oleh', label: 'Ditolong oleh', max: 100 },
      { name: 'kelahiran.berat_lahir_kg', label: 'Berat badan bayi (kg)', type: 'number', step: '0.01' },
      { name: 'kelahiran.panjang_lahir_cm', label: 'Panjang badan bayi (cm)', type: 'number', step: '0.1' },
    ],
  },
  {
    judul: 'Riwayat ASI dan makanan',
    fields: [
      { name: 'kelahiran.asi_hingga_usia', label: 'Minum ASI hingga usia', max: 50 },
      { name: 'kelahiran.makanan_tambahan_usia', label: 'Mulai makanan tambahan pada usia', max: 50 },
      { name: 'kelahiran.susu_formula_mulai', label: 'Mulai minum susu formula', max: 50 },
      { name: 'kelahiran.susu_formula_hingga', label: 'Susu formula hingga', max: 50 },
      { name: 'kelahiran.kualitas_makanan', label: 'Kualitas makanan', type: 'select', options: ['Baik', 'Cukup', 'Kurang'] },
      { name: 'kelahiran.kesukaran_makan', label: 'Kesukaran pemberian makanan', type: 'textarea', rows: 2 },
    ],
  },
  {
    judul: 'Toilet training',
    fields: [
      { name: 'perkembangan.bak_usia', label: 'Dapat mengatur buang air kecil pada umur', max: 50 },
      { name: 'perkembangan.bak_cara_dilatih', label: 'Cara dilatih (BAK)', max: 500 },
      { name: 'perkembangan.bab_usia', label: 'Dapat mengatur buang air besar pada umur', max: 50 },
      { name: 'perkembangan.bab_cara_dilatih', label: 'Cara dilatih (BAB)', max: 500 },
      { name: 'perkembangan.gosok_gigi_usia', label: 'Menggosok gigi sendiri pada umur', max: 50 },
      { name: 'perkembangan.mandi_sendiri_usia', label: 'Mandi sendiri pada umur', max: 50 },
    ],
  },
  {
    judul: 'Riwayat perkembangan',
    keterangan: 'Isi usia dalam bulan.',
    fields: [
      { name: 'perkembangan.telungkup_bulan', label: 'Telungkup', max: 20 },
      { name: 'perkembangan.merangkak_bulan', label: 'Merangkak', max: 20 },
      { name: 'perkembangan.duduk_bulan', label: 'Duduk', max: 20 },
      { name: 'perkembangan.berdiri_bulan', label: 'Berdiri', max: 20 },
      { name: 'perkembangan.berjalan_bulan', label: 'Berjalan', max: 20 },
      { name: 'perkembangan.kata_pertama_bulan', label: 'Berbicara kata-kata pertama', max: 20 },
      { name: 'perkembangan.kalimat_lengkap_bulan', label: 'Berbicara kalimat lengkap', max: 20 },
      { name: 'perkembangan.kesulitan_gerak', label: 'Kesulitan dalam gerak', type: 'textarea', rows: 2, wide: false },
      { name: 'perkembangan.kesulitan_bahasa', label: 'Kesulitan dalam berbahasa', type: 'textarea', rows: 2, wide: false },
    ],
  },
  {
    judul: 'Faktor sosial dan personal',
    fields: [
      { name: 'pendidikan_sosial.hubungan_dengan_saudara', label: 'Hubungan dengan saudara', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.hubungan_dengan_teman', label: 'Hubungan dengan teman', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.hobi', label: 'Hobi', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.minat', label: 'Minat', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.aktivitas_rekreasi', label: 'Aktivitas rekreasi', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.penerimaan_tanggung_jawab', label: 'Penerimaan dan tanggung jawab', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.sikap_masalah_belajar', label: 'Sikap terhadap masalah belajar', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.sifat_sosial_menonjol', label: 'Sifat sosial yang menonjol', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.sikap_kepribadian_menonjol', label: 'Sikap kepribadian yang menonjol', type: 'textarea', rows: 2 },
    ],
  },
  {
    judul: 'Riwayat pendidikan',
    fields: [
      { name: 'pendidikan_sosial.masuk_tk_umur', label: 'Masuk taman kanak-kanak umur (tahun)', max: 20 },
      { name: 'pendidikan_sosial.masuk_sd_umur', label: 'Masuk SD umur (tahun)', max: 20 },
      { name: 'pendidikan_sosial.pernah_tinggal_kelas', label: 'Pernah tinggal kelas', type: 'select', options: YT },
      { name: 'pendidikan_sosial.tinggal_di_kelas', label: 'Di kelas', max: 20, showIf: (v) => v.pendidikan_sosial?.pernah_tinggal_kelas === 'Ya' },
      { name: 'pendidikan_sosial.kesulitan_membaca', label: 'Kesulitan dalam membaca', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.kesulitan_menulis', label: 'Kesulitan dalam menulis', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.kesulitan_berhitung', label: 'Kesulitan dalam berhitung', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.aspek_lain', label: 'Aspek lain', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.bantuan_di_sd', label: 'Bantuan yang pernah diterima di SD', type: 'textarea', rows: 2 },
      { name: 'pendidikan_sosial.sikap_terhadap_guru', label: 'Sikap anak terhadap guru', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.sikap_terhadap_teman_sekolah', label: 'Sikap anak terhadap teman sekolah', type: 'textarea', rows: 2, wide: false },
      { name: 'pendidikan_sosial.sikap_terhadap_sekolah', label: 'Sikap anak terhadap sekolah', type: 'textarea', rows: 2 },
    ],
  },
];

export const KELUARGA_KATEGORI = ['Pasangan', 'Anak', 'Ayah', 'Ibu', 'Saudara', 'Serumah'];
export const KELUARGA_LABEL = { Pasangan: 'Istri / suami', Anak: 'Anak', Ayah: 'Ayah', Ibu: 'Ibu', Saudara: 'Saudara', Serumah: 'Orang lain serumah' };

export const KELUARGA = [
  {
    judul: 'Anggota keluarga',
    fields: [
      { name: 'kategori', label: 'Hubungan', type: 'select', required: true, options: KELUARGA_KATEGORI.map((k) => ({ value: k, label: KELUARGA_LABEL[k] })) },
      { name: 'status_hubungan', label: 'Status', type: 'select', options: ['Kandung', 'Tiri', 'Angkat'] },
      { name: 'nama', label: 'Nama', required: true, max: 150 },
      { name: 'jenis_kelamin', label: 'Jenis kelamin', type: 'select', options: JK },
      { name: 'usia', label: 'Usia', max: 20 },
      { name: 'tempat_tanggal_lahir', label: 'Tempat, tanggal lahir', max: 150 },
      { name: 'agama', label: 'Agama', max: 50 },
      { name: 'pendidikan', label: 'Pendidikan', max: 100 },
      { name: 'pekerjaan', label: 'Pekerjaan', max: 100 },
      { name: 'keterangan', label: 'Keterangan', max: 255 },
      { name: 'alamat', label: 'Alamat', type: 'textarea', rows: 2, max: 500 },
      { name: 'masih_hidup', label: 'Masih hidup', type: 'bool', hint: 'Jika sudah meninggal, isi pendidikan dan pekerjaan semasa hidup', wide: true },
    ],
  },
];

export const ORGANISASI = [{ judul: 'Organisasi', fields: [
  { name: 'nama_organisasi', label: 'Nama organisasi', required: true, max: 150 },
  { name: 'jenis_organisasi', label: 'Jenis organisasi', max: 100 },
  { name: 'tahun', label: 'Tahun', max: 20 },
  { name: 'jabatan', label: 'Jabatan', max: 100 },
] }];

export const REFERENSI = [{ judul: 'Referensi', fields: [
  { name: 'nama', label: 'Nama', required: true, max: 150 },
  { name: 'alamat_telepon', label: 'Alamat dan nomor telepon', max: 255 },
  { name: 'jabatan', label: 'Jabatan', max: 100 },
  { name: 'hubungan', label: 'Hubungan dengan Anda', max: 100 },
] }];

// ---------------- Catatan klinis psikolog ----------------
const T = (name, label, opts = {}) => ({ name, label, type: 'textarea', rows: 2, ...opts });

export const ANAMNESIS = [
  { judul: 'Rujukan dan keluhan', fields: [
    { name: 'rujukan', label: 'Rujukan', type: 'select', options: ['Datang sendiri', 'Orang tua', 'Sekolah', 'Dokter', 'Psikolog', 'Lainnya'] },
    T('keluhan_utama', 'Alasan datang / keluhan utama', { rows: 3 }),
  ] },
  { judul: 'Riwayat permasalahan saat ini', fields: [
    T('awal_munculnya_masalah', 'Awal munculnya masalah', { wide: false }), T('faktor_pencetus', 'Faktor pencetus', { wide: false }),
    T('frekuensi_durasi', 'Frekuensi dan durasi', { wide: false }), T('dampak_aktivitas', 'Dampak terhadap aktivitas sehari-hari', { wide: false }),
    T('upaya_dilakukan', 'Upaya yang pernah dilakukan'),
  ] },
  { judul: 'Riwayat kesehatan fisik', fields: [
    T('penyakit_fisik', 'Penyakit yang pernah / sedang diderita', { wide: false }), T('rawat_inap_operasi', 'Riwayat rawat inap / operasi', { wide: false }),
    T('obat_saat_ini', 'Penggunaan obat saat ini', { wide: false }), T('gangguan_neurologis', 'Riwayat gangguan neurologis / cedera kepala', { wide: false }),
  ] },
  { judul: 'Riwayat psikologis / psikiatris', fields: [
    T('riwayat_konseling_terapi', 'Pernah menjalani konseling / terapi', { wide: false }), T('riwayat_diagnosis_psikologis', 'Pernah mendapat diagnosis psikologis / psikiatris', { wide: false }),
    T('riwayat_obat_psikiatri', 'Riwayat penggunaan obat psikiatri'),
  ] },
  { judul: 'Riwayat perkembangan', fields: [
    T('perkembangan_kehamilan_kelahiran', 'Masa kehamilan dan kelahiran', { wide: false }), T('perkembangan_kanak_kanak', 'Masa kanak-kanak', { wide: false }),
    T('perkembangan_remaja', 'Masa remaja', { wide: false }), T('perkembangan_dewasa', 'Masa dewasa', { wide: false }),
  ] },
  { judul: 'Pendidikan, pekerjaan, dan keluarga', fields: [
    T('riwayat_pendidikan', 'Riwayat pendidikan', { wide: false }), T('riwayat_pekerjaan', 'Riwayat pekerjaan', { wide: false }),
    T('hubungan_dalam_keluarga', 'Hubungan dalam keluarga', { wide: false }), T('riwayat_gangguan_keluarga', 'Riwayat gangguan psikologis / psikiatris dalam keluarga', { wide: false }),
  ] },
  { judul: 'Riwayat sosial dan lainnya', fields: [
    T('hubungan_dengan_teman', 'Hubungan dengan teman', { wide: false }), T('hubungan_dengan_pasangan', 'Hubungan dengan pasangan', { wide: false }),
    T('aktivitas_sosial', 'Aktivitas sosial', { wide: false }), T('riwayat_spiritual', 'Riwayat spiritual / keagamaan', { wide: false }),
    T('minat_hobi_kekuatan', 'Minat, hobi, dan kekuatan diri', { wide: false }), T('harapan_konseling', 'Harapan klien terhadap konseling', { wide: false }),
  ] },
];

export const OBSERVASI = [
  { judul: 'Observasi status mental', fields: [
    ['penampilan_umum', 'Penampilan umum'], ['sikap_terhadap_pemeriksa', 'Sikap terhadap pemeriksa'], ['kontak_mata', 'Kontak mata'],
    ['aktivitas_psikomotor', 'Aktivitas psikomotor'], ['pembicaraan', 'Pembicaraan'], ['mood', 'Mood'], ['afek', 'Afek'],
    ['proses_pikir', 'Proses pikir'], ['isi_pikir', 'Isi pikir'], ['persepsi', 'Persepsi'], ['konsentrasi', 'Konsentrasi'],
    ['memori', 'Memori'], ['orientasi', 'Orientasi'], ['insight', 'Insight'], ['judgment', 'Judgment'],
  ].map(([n, l]) => T(n, l, { wide: false })) },
];

export const PILIHAN_INTERVENSI = ['Psikoedukasi', 'Cognitive Behavioral Therapy (CBT)', 'Konseling Supportif', 'Problem Solving', 'Relaksasi', 'Mindfulness', 'Terapi Perilaku', 'Family Counseling'];

export const SOAP = [
  { judul: 'S (Subjective)', fields: [T('subjective', 'Keluhan klien', { rows: 3 })] },
  { judul: 'O (Objective)', fields: [T('objective', 'Hasil observasi psikologis', { rows: 3 })] },
  { judul: 'A (Assessment)', fields: [
    T('diagnosis_hipotesis', 'Diagnosis / hipotesis psikologis', { wide: false }), T('masalah_utama', 'Masalah utama', { wide: false }),
    T('faktor_predisposisi', 'Faktor predisposisi', { wide: false }), T('faktor_presipitasi', 'Faktor presipitasi', { wide: false }),
    T('faktor_protektif', 'Faktor protektif'),
  ] },
  { judul: 'P (Plan)', fields: [
    T('tujuan_konseling', 'Tujuan konseling'),
    { name: 'intervensi', label: 'Intervensi yang diberikan', type: 'checklist', options: PILIHAN_INTERVENSI },
    { name: 'intervensi_lainnya', label: 'Intervensi lainnya', max: 255 },
    { name: 'jadwal_sesi_berikutnya', label: 'Jadwal sesi berikutnya', max: 150 },
    T('rencana_tindak_lanjut', 'Rencana tindak lanjut'),
  ] },
  { judul: 'Evaluasi perkembangan klien', fields: [T('evaluasi_perkembangan', 'Evaluasi', { rows: 3 })] },
];

/** Ambil hanya nilai yang didefinisikan formulir (agar data lain tidak ikut terkirim). */
export function pickFields(sections, data) {
  const out = {};
  sections.forEach((s) => s.fields.forEach((f) => {
    const keys = f.name.split('.');
    let v = data;
    for (const k of keys) v = v == null ? undefined : v[k];
    if (v === undefined) return;
    if (keys.length === 1) out[f.name] = v;
    else { out[keys[0]] = out[keys[0]] || {}; out[keys[0]][keys[1]] = v; }
  }));
  return out;
}
