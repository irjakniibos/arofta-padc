/**
 * Konstanta domain. Semua nilai role/status dipakai dari sini,
 * tidak ditulis langsung (hardcode) di controller atau service.
 */
const ROLES = Object.freeze({
  KLIEN: 'Klien',
  PSIKOLOG: 'Psikolog',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
});

const STAFF_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

const STATUS_SESI = Object.freeze({
  TERDAFTAR: 'Terdaftar',
  BERJALAN: 'Berjalan',
  SELESAI: 'Selesai',
  BATAL: 'Batal',
});

// Transisi status sesi yang diizinkan
const TRANSISI_SESI = Object.freeze({
  Terdaftar: ['Berjalan', 'Batal'],
  Berjalan: ['Selesai', 'Batal'],
  Selesai: [],
  Batal: [],
});

const STATUS_BAYAR = Object.freeze({
  MENUNGGU_PEMBAYARAN: 'Menunggu Pembayaran',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  LUNAS: 'Lunas',
  DITOLAK: 'Ditolak',
  BATAL: 'Batal',
});

const STATUS_SLOT = Object.freeze({
  TERSEDIA: 'Tersedia',
  DIPESAN: 'Dipesan',
  DITUTUP: 'Ditutup',
});

const TIPE_SESI = Object.freeze({ ONLINE: 'Online', OFFLINE: 'Offline', KEDUANYA: 'Keduanya' });

const STATUS_LAPORAN = Object.freeze({ DRAFT: 'Draft', FINAL: 'Final' });

const STATUS_FEE = Object.freeze({ BELUM: 'Belum Dibayar', SUDAH: 'Sudah Dibayar' });

const JENIS_INTAKE = Object.freeze({ DEWASA: 'Dewasa', ANAK: 'Anak', TIDAK_ADA: 'Tidak Ada' });

const KATEGORI_LAYANAN = ['Anak dan Remaja', 'Industri', 'Masyarakat Umum'];

const TIPE_NOTIF = Object.freeze({
  JADWAL: 'Jadwal',
  PEMBAYARAN: 'Pembayaran',
  TAUTAN: 'Tautan Sesi',
  LAPORAN: 'Laporan',
  FEE: 'Fee',
  SISTEM: 'Sistem',
});

const KATEGORI_KELUARGA = ['Pasangan', 'Anak', 'Ayah', 'Ibu', 'Saudara', 'Serumah'];

const PILIHAN_INTERVENSI = [
  'Psikoedukasi',
  'Cognitive Behavioral Therapy (CBT)',
  'Konseling Supportif',
  'Problem Solving',
  'Relaksasi',
  'Mindfulness',
  'Terapi Perilaku',
  'Family Counseling',
];

const PAGINATION = Object.freeze({ DEFAULT_LIMIT: 10, MAX_LIMIT: 50 });

// Kunci pengaturan yang tersimpan di tabel `pengaturan`
const SETTING = Object.freeze({
  BANK_NAMA: 'bank_nama',
  BANK_REKENING: 'bank_no_rekening',
  BANK_ATAS_NAMA: 'bank_atas_nama',
  BATAS_BAYAR_JAM: 'batas_bayar_jam',
  BATAS_BAYAR_SEBELUM_SESI_JAM: 'batas_bayar_sebelum_sesi_jam',
  BATAS_BOOKING_JAM: 'batas_booking_jam',
  MAKS_BOOKING_BELUM_BAYAR: 'maks_booking_belum_bayar',
  REMINDER_JAM: 'reminder_jam_sebelum',
  KONTAK_WA: 'kontak_whatsapp',
  ALAMAT_KLINIK: 'alamat_klinik',
  NAMA_LEMBAGA: 'nama_lembaga',
  EMAIL_LEMBAGA: 'email_lembaga',
});

// Nomor HP/WhatsApp Indonesia: 08xx, 628xx, atau +628xx
const POLA_NO_HP = /^(\+62|62|0)8[0-9]{7,12}$/;

const METODE_BAYAR = Object.freeze({ TRANSFER: 'Transfer Bank', TUNAI: 'Tunai' });

// Versi dokumen persetujuan; naikkan bila isi Kebijakan Privasi / Informed Consent diubah
const VERSI_PERSETUJUAN = Object.freeze({ PRIVASI: '1.0', INFORMED_CONSENT: '1.0' });

const UPLOAD = Object.freeze({
  TEMPLATE_EXT: ['.docx'],
  TEMPLATE_MIME: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILES: 1,
});

module.exports = {
  ROLES,
  STAFF_ROLES,
  STATUS_SESI,
  TRANSISI_SESI,
  STATUS_BAYAR,
  STATUS_SLOT,
  TIPE_SESI,
  STATUS_LAPORAN,
  STATUS_FEE,
  JENIS_INTAKE,
  KATEGORI_LAYANAN,
  TIPE_NOTIF,
  KATEGORI_KELUARGA,
  PILIHAN_INTERVENSI,
  PAGINATION,
  SETTING,
  METODE_BAYAR,
  POLA_NO_HP,
  VERSI_PERSETUJUAN,
  UPLOAD,
};
