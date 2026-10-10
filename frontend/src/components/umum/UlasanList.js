import { Star } from 'lucide-react';
import { tanggal } from '@/lib/format';

export function Bintang({ nilai, size = 'h-4 w-4' }) {
  return <span className="inline-flex" aria-label={`${nilai} dari 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} aria-hidden="true" className={`${size} ${i <= nilai ? 'fill-violet text-violet' : 'text-violet-line'}`} />)}</span>;
}

export default function UlasanItem({ u, aksi }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <Bintang nilai={u.rating} />
          <span className="text-sm font-medium">{u.klien?.nama_lengkap}</span>
          <span className="text-[13px] text-ink-faint">{u.sesi?.layanan?.nama_layanan}, {tanggal(u.created_at)}</span>
        </div>
        {u.komentar ? <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{u.komentar}</p> : <p className="mt-2 text-sm text-ink-faint">Tanpa komentar.</p>}
        {u.psikolog && <p className="mt-1 text-[13px] text-ink-faint">Untuk {u.psikolog.nama_lengkap}</p>}
      </div>
      {aksi}
    </li>
  );
}
