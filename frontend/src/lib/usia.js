/** Usia (tahun & bulan) dari tanggal lahir 'YYYY-MM-DD'. */
export function hitungUsia(tgl, acuan = new Date()) {
  if (!tgl) return '';
  const [y, m, d] = String(tgl).slice(0, 10).split('-').map(Number);
  let th = acuan.getFullYear() - y;
  let bl = acuan.getMonth() + 1 - m;
  if (acuan.getDate() < d) bl -= 1;
  if (bl < 0) { th -= 1; bl += 12; }
  if (th < 0) return '';
  return bl ? `${th} tahun ${bl} bulan` : `${th} tahun`;
}
