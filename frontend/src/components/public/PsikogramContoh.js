/**
 * Elemen khas beranda: potongan psikogram seperti pada laporan hasil AROFTA,
 * lengkap dengan centang merah dari logo. Centang tergambar berurutan sekali saat halaman dimuat.
 */
const ASPEK = [
  { nama: 'Kecerdasan umum', nilai: 4 },
  { nama: 'Daya ingat', nilai: 3 },
  { nama: 'Konsentrasi', nilai: 4 },
  { nama: 'Stabilitas emosi', nilai: 5 },
  { nama: 'Kerja sama', nilai: 4 },
];
const SKALA = [1, 2, 3, 4, 5];

export default function PsikogramContoh() {
  return (
    <figure className="rounded-panel border border-violet-line bg-white">
      <div className="flex items-baseline justify-between border-b border-violet-line px-5 py-3.5">
        <span className="font-serif text-lg text-violet-deep">Psikogram</span>
        <span className="text-[12px] text-ink-faint">skala 1–5</span>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Contoh tabel psikogram pada laporan hasil pemeriksaan</caption>
        <thead>
          <tr className="text-[12px] text-ink-faint">
            <th scope="col" className="px-5 py-2 text-left font-medium">Aspek</th>
            {SKALA.map((s) => <th key={s} scope="col" className="w-9 py-2 text-center font-medium tabular">{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {ASPEK.map((a, i) => (
            <tr key={a.nama} className="border-t border-line">
              <th scope="row" className="px-5 py-2.5 text-left font-normal text-ink">{a.nama}</th>
              {SKALA.map((s) => (
                <td key={s} className={`h-10 border-l border-line text-center ${s === 3 ? 'bg-violet-tint/60' : ''}`}>
                  {s === a.nilai && (
                    <svg viewBox="0 0 20 20" className="mx-auto h-4 w-4" aria-label={`nilai ${s}`}>
                      <path d="M4 10.5l3.6 3.6L16 5.5" fill="none" stroke="var(--color-check)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                        className="check-draw" style={{ animationDelay: `${500 + i * 160}ms` }} />
                    </svg>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="border-t border-line px-5 py-3 text-[13px] leading-relaxed text-ink-soft">
        Contoh bagian laporan hasil pemeriksaan. Laporan lengkap memuat identitas, psikogram, kesimpulan, dan saran dari psikolog.
      </figcaption>
    </figure>
  );
}
