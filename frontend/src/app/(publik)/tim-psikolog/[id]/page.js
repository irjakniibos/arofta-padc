import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { serverGet, serverGetFull } from '@/lib/server-api';
import { inisial, tanggal } from '@/lib/format';
import Button from '@/components/ui/Button';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = /^\d+$/.test(id) ? await serverGet(`/psikolog/${id}`) : null;
  return { title: p ? p.nama_lengkap : 'Psikolog' };
}

function Bintang({ nilai }) {
  return (
    <span className="inline-flex" aria-label={`${nilai} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} aria-hidden="true" className={`h-4 w-4 ${i <= nilai ? 'fill-violet text-violet' : 'text-violet-line'}`} />)}
    </span>
  );
}

export default async function ProfilPsikologPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [p, ulasanRes] = await Promise.all([serverGet(`/psikolog/${id}`), serverGetFull(`/psikolog/${id}/ulasan?limit=10`)]);
  if (!p) notFound();
  const ulasan = ulasanRes?.data?.ulasan || [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <Link href="/tim-psikolog" className="text-sm text-ink-soft hover:text-ink">Tim psikolog</Link>
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-violet-tint font-serif text-3xl text-violet-deep">{inisial(p.nama_lengkap)}</span>
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-medium md:text-4xl">{p.nama_lengkap}</h1>
          <p className="mt-1 text-ink-soft">{[p.spesialisasi, p.pengalaman_tahun ? `${p.pengalaman_tahun} tahun pengalaman` : null].filter(Boolean).join(', ')}</p>
        </div>
        <Button href={`/jadwal?psikolog=${p.id_psikolog}`}>Lihat jadwal</Button>
      </div>
      {p.profil_singkat && <p className="mt-8 text-[17px] leading-relaxed text-ink-soft">{p.profil_singkat}</p>}

      <section className="mt-14" aria-labelledby="judul-ulasan">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
          <h2 id="judul-ulasan" className="text-xl font-semibold">Ulasan klien</h2>
          {p.rating?.jumlah > 0 && <p className="text-sm text-ink-soft"><span className="font-semibold text-ink">{p.rating.rata_rata}</span> dari 5, berdasarkan {p.rating.jumlah} ulasan</p>}
        </div>
        {ulasan.length === 0 ? (
          <p className="py-6 text-sm text-ink-faint">Belum ada ulasan untuk psikolog ini.</p>
        ) : (
          <ul className="divide-y divide-line">
            {ulasan.map((u) => (
              <li key={u.id_ulasan} className="py-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Bintang nilai={u.rating} />
                  <span className="text-sm font-medium">{u.nama_klien}</span>
                  <span className="text-[13px] text-ink-faint">{u.layanan}, {tanggal(u.created_at)}</span>
                </div>
                {u.komentar && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{u.komentar}</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[13px] text-ink-faint">Nama klien disamarkan untuk menjaga kerahasiaan.</p>
      </section>
    </div>
  );
}
