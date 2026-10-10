'use client';

/**
 * Kalender bulanan yang dipakai bersama oleh klien (jadwal tersedia) dan staf (slot & sesi).
 * renderIsi(tanggalISO) mengisi konten tiap sel; tanggal yang punya data dapat diklik.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { namaBulan } from '@/lib/format';

const HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const pad = (n) => String(n).padStart(2, '0');
export const isoTanggal = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

export default function KalenderBulan({ tahun, bulan, onGanti, dipilih, onPilih, aktif = () => true, renderIsi, minBulan }) {
  const jumlahHari = new Date(tahun, bulan, 0).getDate();
  const offset = (new Date(tahun, bulan - 1, 1).getDay() + 6) % 7; // Senin = kolom pertama
  const hariIni = (() => { const d = new Date(); return isoTanggal(d.getFullYear(), d.getMonth() + 1, d.getDate()); })();
  const sel = [...Array(offset).fill(null), ...Array.from({ length: jumlahHari }, (_, i) => i + 1)];
  while (sel.length % 7) sel.push(null);

  const geser = (n) => {
    const d = new Date(tahun, bulan - 1 + n, 1);
    onGanti(d.getFullYear(), d.getMonth() + 1);
  };
  const bisaMundur = !minBulan || tahun * 12 + bulan > minBulan.tahun * 12 + minBulan.bulan;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-medium" aria-live="polite">{namaBulan(bulan - 1)} {tahun}</h2>
        <div className="flex gap-1">
          <button type="button" onClick={() => geser(-1)} disabled={!bisaMundur} aria-label="Bulan sebelumnya"
            className="rounded-control border border-line p-2 text-ink hover:bg-mist disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => geser(1)} aria-label="Bulan berikutnya"
            className="rounded-control border border-line p-2 text-ink hover:bg-mist"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div role="grid" className="mt-5 overflow-hidden rounded-panel border border-line">
        <div role="row" className="grid grid-cols-7 bg-mist text-center text-[12px] font-medium text-ink-soft">
          {HARI_PENDEK.map((h) => <div role="columnheader" key={h} className="py-2">{h}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {sel.map((d, i) => {
            if (!d) return <div key={`k${i}`} className="min-h-16 border-t border-line bg-mist/50 sm:min-h-24" />;
            const iso = isoTanggal(tahun, bulan, d);
            const bisa = aktif(iso);
            const terpilih = dipilih === iso;
            return (
              <button key={iso} type="button" role="gridcell" disabled={!bisa} onClick={() => onPilih(iso)} aria-selected={terpilih}
                className={`relative flex min-h-16 flex-col items-start border-t border-line p-1.5 text-left transition-colors sm:min-h-24 sm:p-2 ${i % 7 ? 'border-l' : ''}
                  ${terpilih ? 'bg-violet-tint ring-2 ring-inset ring-violet' : bisa ? 'hover:bg-violet-tint/60' : 'cursor-default'}`}>
                <span className={`text-sm tabular ${iso === hariIni ? 'flex h-6 w-6 items-center justify-center rounded-full bg-violet font-semibold text-white' : bisa ? 'font-semibold text-ink' : 'text-ink-faint'}`}>{d}</span>
                {renderIsi && renderIsi(iso)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
