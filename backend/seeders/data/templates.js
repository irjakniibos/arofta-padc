/**
 * Definisi 4 template laporan hasil pemeriksaan psikologis AROFTA PADC.
 * Aspek psikogram diambil dari dokumen template klinik (psikogram.json),
 * ditambah isian teks & pilihan kesimpulan sesuai format masing-masing dokumen.
 */
const psikogram = require('./psikogram.json');

const teks = (kode, kelompok, label, deskripsi = null, wajib = true) => ({ kode, kelompok, label, deskripsi, tipe: 'teks', wajib });
const pilihan = (kode, kelompok, label, opsi) => ({ kode, kelompok, label, tipe: 'pilihan', opsi: opsi.join(';'), wajib: true });

function withOrder(items) {
  return items.map((it, i) => ({ wajib: true, deskripsi: null, opsi: null, ...it, urutan: i + 1 }));
}

module.exports = [
  {
    kode: 'TES_ANAK',
    nama_template: 'Hasil Pemeriksaan Psikologis Anak',
    deskripsi: 'Laporan tes psikologi anak: psikogram aspek kecerdasan, potensi belajar, dan kepribadian dengan skala 1–6.',
    file_docx: 'TES_ANAK.docx',
    skala_min: 1,
    skala_max: 6,
    keterangan_skala: '1-2=Rendah;3-4=Cukup;5-6=Tinggi',
    items: withOrder([
      ...psikogram.TES_ANAK,
      teks('iq', 'KESIMPULAN', 'IQ', 'Skor IQ, contoh: 105'),
      teks('skala_iq', 'KESIMPULAN', 'Skala IQ', 'Alat ukur, contoh: WISC / CFIT'),
      teks('kategori_iq', 'KESIMPULAN', 'Kesimpulan Taraf Kecerdasan', 'Contoh: Rata-rata'),
      teks('kelebihan', 'KESIMPULAN', 'Kelebihan'),
      teks('kekurangan', 'KESIMPULAN', 'Kekurangan'),
      teks('saran', 'KESIMPULAN', 'Saran'),
    ]),
  },
  {
    kode: 'MINAT_BAKAT',
    nama_template: 'Hasil Pemeriksaan Psikologis Minat Bakat',
    deskripsi: 'Laporan tes minat bakat dan penjurusan: psikogram intelektual skala 1–5 beserta rekomendasi jurusan.',
    file_docx: 'MINAT_BAKAT.docx',
    skala_min: 1,
    skala_max: 5,
    keterangan_skala: '1=Rendah;2=Kurang;3=Cukup;4=Baik;5=Tinggi',
    items: withOrder([
      ...psikogram.MINAT_BAKAT,
      teks('taraf_kecerdasan', 'KESIMPULAN', 'Taraf Kecerdasan (IQ)', 'Contoh: IQ 110 (Rata-rata Atas)'),
      teks('minat_bakat', 'KESIMPULAN', 'Minat Bakat'),
      teks('rekomendasi_jurusan', 'KESIMPULAN', 'Rekomendasi Jurusan'),
      teks('rekomendasi_jurusan_kuliah', 'KESIMPULAN', 'Rekomendasi Jurusan Kuliah', null, false),
    ]),
  },
  {
    kode: 'REKRUTMEN',
    nama_template: 'Profil Hasil Pemeriksaan Psikologis (Rekrutmen)',
    deskripsi: 'Laporan asesmen rekrutmen/industri: aspek psikologis dan kompetensi manajerial skala 1–5, uraian, kelebihan, kekurangan, dan rekomendasi.',
    file_docx: 'REKRUTMEN.docx',
    skala_min: 1,
    skala_max: 5,
    keterangan_skala: '1=Rendah;2=Kurang;3=Cukup;4=Baik;5=Tinggi',
    items: withOrder([
      teks('jabatan', 'IDENTITAS', 'Jabatan yang Dilamar'),
      ...psikogram.REKRUTMEN,
      teks('uraian', 'KESIMPULAN', 'Description / Uraian'),
      teks('kelebihan', 'KESIMPULAN', 'Strength / Kelebihan'),
      teks('kekurangan', 'KESIMPULAN', 'Weakness / Kekurangan'),
      teks('rekomendasi_uraian', 'KESIMPULAN', 'Recommendation', 'Uraian rekomendasi'),
      pilihan('rekomendasi', 'KESIMPULAN', 'Kesimpulan Rekomendasi', ['Dapat Disarankan', 'Masih Dapat Disarankan', 'Kurang Dapat Disarankan', 'Tidak Dapat Disarankan']),
    ]),
  },
  {
    kode: 'PSIKOLOGI_UMUM',
    nama_template: 'Hasil Pemeriksaan Psikologis (Umum)',
    deskripsi: 'Laporan psikotes umum/karyawan: intelektual, sikap kerja, kepribadian, dan kebutuhan (27 aspek) skala 1–5.',
    file_docx: 'PSIKOLOGI_UMUM.docx',
    skala_min: 1,
    skala_max: 5,
    keterangan_skala: '1=Rendah;2=Kurang;3=Cukup;4=Baik;5=Tinggi',
    items: withOrder([
      ...psikogram.PSIKOLOGI_UMUM.map((it) => (it.tipe === 'teks' ? { ...it, deskripsi: `${it.deskripsi}. Isi: IQ = skor (kategori)` } : it)),
      teks('kesimpulan', 'KESIMPULAN', 'Kesimpulan dan Saran'),
      pilihan('rekomendasi', 'KESIMPULAN', 'Kesimpulan', ['Disarankan', 'Masih Disarankan', 'Tidak Disarankan']),
    ]),
  },
];
