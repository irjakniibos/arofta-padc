/** Utilitas tanggal (zona waktu Asia/Jakarta). */
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function pad(n) { return String(n).padStart(2, '0'); }

/** Date -> 'YYYY-MM-DD' menurut waktu lokal server. */
function toDateString(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** '2026-10-09' -> '9 Oktober 2026' */
function formatTanggalIndo(value) {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} ${BULAN[m - 1]} ${y}`;
}

/** Usia dalam tahun dan bulan pada tanggal acuan. */
function hitungUsia(tanggalLahir, acuan = new Date()) {
  if (!tanggalLahir) return '';
  const [y, m, d] = String(tanggalLahir).slice(0, 10).split('-').map(Number);
  const ref = typeof acuan === 'string' ? new Date(`${acuan.slice(0, 10)}T00:00:00`) : acuan;
  let tahun = ref.getFullYear() - y;
  let bulan = ref.getMonth() + 1 - m;
  if (ref.getDate() < d) bulan -= 1;
  if (bulan < 0) { tahun -= 1; bulan += 12; }
  if (tahun < 0) return '';
  return bulan > 0 ? `${tahun} tahun ${bulan} bulan` : `${tahun} tahun`;
}

/** Menggabungkan tanggal & jam sesi menjadi objek Date lokal. */
function combineDateTime(tanggal, waktu) {
  return new Date(`${String(tanggal).slice(0, 10)}T${String(waktu).slice(0, 8)}`);
}

/** Date -> '9 Oktober 2026 pukul 14.30 WIB' (waktu lokal server). */
function formatWaktuIndo(d) {
  return `${formatTanggalIndo(toDateString(d))} pukul ${pad(d.getHours())}.${pad(d.getMinutes())} WIB`;
}

function addHours(date, hours) { return new Date(date.getTime() + hours * 3600 * 1000); }

module.exports = { toDateString, formatTanggalIndo, formatWaktuIndo, hitungUsia, combineDateTime, addHours, BULAN };
