import Link from 'next/link';
import { Star } from 'lucide-react';
import { serverGet } from '@/lib/server-api';
import { inisial } from '@/lib/format';

export const metadata = { title: 'Tim psikolog' };

export default async function TimPsikologPage() {
  const psikolog = await serverGet('/psikolog', { fallback: [] });
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-serif text-4xl font-medium">Tim psikolog</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">Psikolog berizin praktik (SIPP) yang menangani pemeriksaan dan konseling di AROFTA PADC.</p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {psikolog.length === 0 && <li className="py-6 text-sm text-ink-faint">Data psikolog belum tersedia.</li>}
        {psikolog.map((p) => (
          <li key={p.id_psikolog} className="grid gap-4 py-6 sm:grid-cols-[64px_1fr_auto] sm:items-start">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-tint font-serif text-xl text-violet-deep">{inisial(p.nama_lengkap)}</span>
            <div>
              <Link href={`/tim-psikolog/${p.id_psikolog}`} className="text-lg font-semibold hover:text-violet-deep">{p.nama_lengkap}</Link>
              <p className="text-sm text-ink-soft">{[p.spesialisasi, p.pengalaman_tahun ? `${p.pengalaman_tahun} tahun pengalaman` : null].filter(Boolean).join(', ')}</p>
              {p.profil_singkat && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{p.profil_singkat}</p>}
            </div>
            <div className="text-sm sm:text-right">
              {p.rating?.jumlah > 0 ? (
                <span className="inline-flex items-center gap-1 text-ink"><Star className="h-4 w-4 fill-violet text-violet" aria-hidden="true" />{p.rating.rata_rata}<span className="text-ink-faint">({p.rating.jumlah})</span></span>
              ) : <span className="text-ink-faint">Belum ada ulasan</span>}
              <Link href={`/jadwal?psikolog=${p.id_psikolog}`} className="mt-2 block font-semibold text-violet-deep hover:underline">Lihat jadwal</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
