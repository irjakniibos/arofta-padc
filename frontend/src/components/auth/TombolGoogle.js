'use client';

/**
 * Tombol masuk/daftar dengan akun Google. Tampil hanya bila login Google diaktifkan di backend.
 * Memakai navigasi halaman penuh (bukan fetch) karena alurnya berpindah ke halaman Google lalu kembali.
 */
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { API_URL } from '@/lib/config';

/** Pesan untuk kode ?google= yang dikirim backend setelah callback. */
export const PESAN_GOOGLE = {
  batal: 'Masuk dengan Google dibatalkan.',
  sesi: 'Sesi masuk dengan Google kedaluwarsa. Silakan coba lagi.',
  email: 'Email akun Google Anda belum terverifikasi.',
  'nonaktif-akun': 'Akun dinonaktifkan. Hubungi admin AROFTA PADC.',
  nonaktif: 'Masuk dengan Google belum diaktifkan.',
  gagal: 'Gagal masuk dengan Google. Silakan coba lagi atau masuk dengan email dan password.',
};

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function TombolGoogle({ label = 'Masuk dengan Google', lanjut }) {
  const [aktif, setAktif] = useState(false);
  useEffect(() => { api.get('/auth/google/status').then((r) => setAktif(!!r.data?.aktif)).catch(() => {}); }, []);
  if (!aktif) return null;
  const href = `${API_URL}/auth/google${lanjut ? `?lanjut=${encodeURIComponent(lanjut)}` : ''}`;
  return (
    <>
      <a href={href} className="flex h-12 w-full items-center justify-center gap-3 rounded-control border border-line bg-white text-[15px] font-semibold text-ink hover:bg-mist">
        <LogoGoogle />{label}
      </a>
      <div className="my-6 flex items-center gap-3 text-[13px] text-ink-faint" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />atau dengan email<span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}
