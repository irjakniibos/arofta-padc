/** Format angka, tanggal, dan teks untuk tampilan (bahasa Indonesia). */
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function rupiah(n) {
  if (n === null || n === undefined || n === '') return '-';
  return `Rp${Number(n).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
}

function parseDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y) return null;
  return new Date(y, m - 1, d);
}

/** '2026-10-09' -> '9 Oktober 2026' */
export function tanggal(value, { hari = false } = {}) {
  const d = parseDate(value);
  if (!d) return '-';
  const s = `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  return hari ? `${HARI[d.getDay()]}, ${s}` : s;
}

/** '09:00:00' -> '09.00' (format jam Indonesia) */
export function jam(value) {
  if (!value) return '-';
  return String(value).slice(0, 5).replace(':', '.');
}

export function durasi(menit) {
  if (!menit) return '-';
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  if (!j) return `${m} menit`;
  return m ? `${j} jam ${m} menit` : `${j} jam`;
}

export const namaBulan = (i) => BULAN[i];
export const namaHari = (i) => HARI[i];

export function inisial(nama) {
  return String(nama || '')
    .replace(/,.*$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');
}

/** Timestamp ISO (UTC dari server) -> '9 Oktober 2026, 14.05' pada zona waktu perangkat */
export function tanggalJam(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${hh}.${mm}`;
}

/** Date lokal -> 'YYYY-MM-DD' (bukan UTC, agar tidak bergeser sehari di WIB) */
export function isoLokal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
