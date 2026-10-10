import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-api';
import { rupiah, durasi } from '@/lib/format';
import Button from '@/components/ui/Button';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const l = await serverGet(`/layanan/${Number(id)}`);
  return { title: l ? l.nama_layanan : 'Layanan' };
}

const PERSIAPAN = {
  Dewasa: 'Isi Formulir Identitas Klien di dashboard sebelum memilih jadwal: data diri, keluarga, riwayat kesehatan, dan harapan pemeriksaan.',
  Anak: 'Orang tua mengisi Formulir Informasi Riwayat Anak: data orang tua, riwayat kehamilan dan kelahiran, perkembangan, serta riwayat sekolah.',
  'Tidak Ada': 'Tidak ada formulir yang perlu diisi sebelum memilih jadwal.',
};

export default async function DetailLayananPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const l = await serverGet(`/layanan/${id}`);
  if (!l) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <Link href="/layanan" className="text-sm text-ink-soft hover:text-ink">Layanan</Link>
      <div className="mt-4 grid gap-12 [&>*]:min-w-0 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-sm text-violet-deep">{l.kategori}</p>
          <h1 className="mt-1 font-serif text-4xl font-medium">{l.nama_layanan}</h1>
          {l.deskripsi && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-soft">{l.deskripsi}</p>}
          <h2 className="mt-10 text-lg font-semibold">Sebelum sesi</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{PERSIAPAN[l.jenis_intake]}</p>
          <h2 className="mt-8 text-lg font-semibold">Setelah sesi</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            Psikolog menyusun laporan hasil pemeriksaan. Anda menerima pemberitahuan lewat email dan dapat mengunduh laporan PDF dari dashboard.
          </p>
        </div>
        <aside className="h-fit rounded-panel border border-line p-6">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Biaya</dt><dd className="text-xl font-semibold tabular">{rupiah(l.harga)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Durasi sesi</dt><dd>{durasi(l.durasi_menit)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Pelaksanaan</dt><dd>Daring atau tatap muka</dd></div>
          </dl>
          <Button href={`/klien/booking?layanan=${l.id_layanan}`} size="lg" className="mt-6 w-full">Pesan layanan ini</Button>
          <Link href="/jadwal" className="mt-3 block text-center text-sm text-violet-deep hover:underline">Cek jadwal tersedia dulu</Link>
        </aside>
      </div>
    </div>
  );
}
