import Link from 'next/link';
import { serverGet } from '@/lib/server-api';
import { KATEGORI_LAYANAN } from '@/lib/config';
import { rupiah, durasi } from '@/lib/format';

export const metadata = { title: 'Layanan dan harga' };

const INTAKE_LABEL = {
  Dewasa: 'Mengisi formulir identitas klien',
  Anak: 'Orang tua mengisi formulir riwayat anak',
  'Tidak Ada': 'Tanpa formulir awal',
};

export default async function LayananPage({ searchParams }) {
  const { kategori: slug } = await searchParams;
  const aktif = KATEGORI_LAYANAN.find((k) => k.slug === slug);
  const layanan = await serverGet('/layanan', { fallback: [] });
  const grup = KATEGORI_LAYANAN.filter((k) => !aktif || k.slug === aktif.slug)
    .map((k) => ({ ...k, items: layanan.filter((l) => l.kategori === k.nama) }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-serif text-4xl font-medium">Layanan dan harga</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
        Harga sudah termasuk pemeriksaan dan laporan hasil tertulis. Pembayaran melalui transfer bank setelah memilih jadwal.
      </p>

      <nav aria-label="Filter kategori" className="mt-8 flex flex-wrap gap-2 border-b border-line pb-4">
        <Link href="/layanan" className={`rounded-full px-4 py-1.5 text-sm ${!aktif ? 'bg-violet text-white' : 'text-ink-soft hover:bg-violet-tint'}`}>Semua</Link>
        {KATEGORI_LAYANAN.map((k) => (
          <Link key={k.slug} href={`/layanan?kategori=${k.slug}`}
            className={`rounded-full px-4 py-1.5 text-sm ${aktif?.slug === k.slug ? 'bg-violet text-white' : 'text-ink-soft hover:bg-violet-tint'}`}>{k.nama}</Link>
        ))}
      </nav>

      {grup.map((g) => (
        <section key={g.slug} className="mt-10" aria-labelledby={`k-${g.slug}`}>
          <h2 id={`k-${g.slug}`} className="text-xl font-semibold">{g.nama}</h2>
          {g.items.length === 0 ? (
            <p className="mt-4 text-sm text-ink-faint">Belum ada layanan aktif pada kategori ini.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {g.items.map((l) => (
                <li key={l.id_layanan} className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <Link href={`/layanan/${l.id_layanan}`} className="text-[17px] font-semibold hover:text-violet-deep">{l.nama_layanan}</Link>
                    {l.deskripsi && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">{l.deskripsi}</p>}
                    <p className="mt-2 text-[13px] text-ink-faint">Durasi {durasi(l.durasi_menit)}. {INTAKE_LABEL[l.jenis_intake]}.</p>
                  </div>
                  <div className="flex items-center gap-5 md:justify-end">
                    <span className="text-lg font-semibold tabular">{rupiah(l.harga)}</span>
                    <Link href={`/layanan/${l.id_layanan}`} className="rounded-control border border-violet-line px-4 py-2 text-sm font-semibold text-violet-deep hover:bg-violet-tint">Detail</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
