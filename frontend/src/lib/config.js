/** Konfigurasi terpusat (tidak ada URL yang ditulis langsung di komponen). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

/** URL API untuk browser: lewat proxy Next.js (satu origin dengan frontend). */
export const API_URL = `${BASE_PATH}${API_PREFIX}`;

/** Layanan pesan WhatsApp untuk konfirmasi pembayaran & kebutuhan mendesak. */
export const WA_URL = (process.env.NEXT_PUBLIC_WA_URL || 'https://wa.me').replace(/\/+$/, '');

export const ROLES = Object.freeze({
  KLIEN: 'Klien',
  PSIKOLOG: 'Psikolog',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
});

/** Halaman awal setelah login, per role. */
export const HOME_BY_ROLE = {
  [ROLES.KLIEN]: '/klien',
  [ROLES.PSIKOLOG]: '/psikolog',
  [ROLES.ADMIN]: '/admin',
  [ROLES.SUPER_ADMIN]: '/admin',
};

export const KATEGORI_LAYANAN = [
  { slug: 'anak-dan-remaja', nama: 'Anak dan Remaja' },
  { slug: 'industri', nama: 'Industri' },
  { slug: 'masyarakat-umum', nama: 'Masyarakat Umum' },
];
