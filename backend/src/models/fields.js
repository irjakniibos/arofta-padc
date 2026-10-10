/**
 * Definisi kolom formulir klinis (intake & catatan klinis).
 * Dipakai bersama oleh model Sequelize dan validator agar tidak terjadi duplikasi (DRY).
 * Format: nama_kolom: ['text'] | ['string', panjangMaks] | ['enum', [pilihan]] | ['bool'] | ['decimal', maks]
 */
const T = ['text'];
const S = (n) => ['string', n];
const E = (v) => ['enum', v];

const INTAKE_DEWASA = {
  kegemaran_hobi: T,
  kursus_pelatihan_keahlian: T,
  kelebihan: T,
  kekurangan: T,
  keluhan_saat_ini: T,
  harapan_pemeriksaan: T,
  pernah_sakit_berat: ['bool'],
  sakit_tahun: S(10),
  sakit_lama: S(50),
  sakit_diagnosa: S(255),
  sakit_dirawat_di: S(150),
  pernah_psikotes: ['bool'],
  psikotes_tahun: S(10),
  psikotes_tempat: S(150),
  psikotes_keperluan: S(255),
  pernyataan_benar: ['bool'],
};

const INTAKE_ANAK = {
  nama_sekolah: S(150),
  kelas: S(50),
  penyakit_pernah_diderita: T,
  lama_menderita_penyakit: S(100),
  berat_badan_kg: ['decimal', 300],
  tinggi_badan_cm: ['decimal', 250],
  gangguan_perkembangan_lain: T,
};

const RIWAYAT_KELAHIRAN_ASI = {
  keguguran_sebelumnya: E(['Ya', 'Tidak']),
  perasaan_waktu_hamil: T,
  anak_diinginkan: E(['Ya', 'Tidak', 'Tidak Tahu']),
  umur_kandungan: S(50),
  proses_kelahiran: S(100),
  skor_apgar: S(20),
  tempat_melahirkan: S(150),
  ditolong_oleh: S(100),
  berat_lahir_kg: ['decimal', 10],
  panjang_lahir_cm: ['decimal', 80],
  asi_hingga_usia: S(50),
  susu_formula_mulai: S(50),
  susu_formula_hingga: S(50),
  makanan_tambahan_usia: S(50),
  kualitas_makanan: E(['Baik', 'Cukup', 'Kurang']),
  kesukaran_makan: T,
};

const RIWAYAT_PERKEMBANGAN_ANAK = {
  bak_usia: S(50),
  bak_cara_dilatih: T,
  bab_usia: S(50),
  bab_cara_dilatih: T,
  gosok_gigi_usia: S(50),
  mandi_sendiri_usia: S(50),
  telungkup_bulan: S(20),
  merangkak_bulan: S(20),
  duduk_bulan: S(20),
  berdiri_bulan: S(20),
  berjalan_bulan: S(20),
  kesulitan_gerak: T,
  kata_pertama_bulan: S(20),
  kalimat_lengkap_bulan: S(20),
  kesulitan_bahasa: T,
};

const RIWAYAT_PENDIDIKAN_SOSIAL_ANAK = {
  hubungan_dengan_saudara: T,
  hubungan_dengan_teman: T,
  hobi: T,
  minat: T,
  aktivitas_rekreasi: T,
  penerimaan_tanggung_jawab: T,
  sikap_masalah_belajar: T,
  sifat_sosial_menonjol: T,
  sikap_kepribadian_menonjol: T,
  masuk_tk_umur: S(20),
  masuk_sd_umur: S(20),
  pernah_tinggal_kelas: E(['Ya', 'Tidak']),
  tinggal_di_kelas: S(20),
  kesulitan_membaca: T,
  kesulitan_menulis: T,
  kesulitan_berhitung: T,
  aspek_lain: T,
  bantuan_di_sd: T,
  sikap_terhadap_guru: T,
  sikap_terhadap_teman_sekolah: T,
  sikap_terhadap_sekolah: T,
};

const ANAMNESIS = {
  rujukan: S(100),
  keluhan_utama: T,
  awal_munculnya_masalah: T,
  faktor_pencetus: T,
  frekuensi_durasi: T,
  dampak_aktivitas: T,
  upaya_dilakukan: T,
  penyakit_fisik: T,
  rawat_inap_operasi: T,
  obat_saat_ini: T,
  gangguan_neurologis: T,
  riwayat_konseling_terapi: T,
  riwayat_diagnosis_psikologis: T,
  riwayat_obat_psikiatri: T,
  perkembangan_kehamilan_kelahiran: T,
  perkembangan_kanak_kanak: T,
  perkembangan_remaja: T,
  perkembangan_dewasa: T,
  riwayat_pendidikan: T,
  riwayat_pekerjaan: T,
  hubungan_dalam_keluarga: T,
  riwayat_gangguan_keluarga: T,
  hubungan_dengan_teman: T,
  hubungan_dengan_pasangan: T,
  aktivitas_sosial: T,
  riwayat_spiritual: T,
  minat_hobi_kekuatan: T,
  harapan_konseling: T,
};

const OBSERVASI_MENTAL = {
  penampilan_umum: T,
  sikap_terhadap_pemeriksa: T,
  kontak_mata: T,
  aktivitas_psikomotor: T,
  pembicaraan: T,
  mood: T,
  afek: T,
  proses_pikir: T,
  isi_pikir: T,
  persepsi: T,
  konsentrasi: T,
  memori: T,
  orientasi: T,
  insight: T,
  judgment: T,
};

const CATATAN_SOAP = {
  subjective: T,
  objective: T,
  diagnosis_hipotesis: T,
  masalah_utama: T,
  faktor_predisposisi: T,
  faktor_presipitasi: T,
  faktor_protektif: T,
  tujuan_konseling: T,
  intervensi: S(500),
  intervensi_lainnya: S(255),
  rencana_tindak_lanjut: T,
  jadwal_sesi_berikutnya: S(150),
  evaluasi_perkembangan: T,
};

module.exports = {
  INTAKE_DEWASA,
  INTAKE_ANAK,
  RIWAYAT_KELAHIRAN_ASI,
  RIWAYAT_PERKEMBANGAN_ANAK,
  RIWAYAT_PENDIDIKAN_SOSIAL_ANAK,
  ANAMNESIS,
  OBSERVASI_MENTAL,
  CATATAN_SOAP,
};
