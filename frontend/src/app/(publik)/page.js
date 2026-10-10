import Link from 'next/link';
import Button from '@/components/ui/Button';
import PsikogramContoh from '@/components/public/PsikogramContoh';
import { serverGet } from '@/lib/server-api';
import { KATEGORI_LAYANAN } from '@/lib/config';
import { rupiah, durasi, inisial } from '@/lib/format';
import { Star } from 'lucide-react';

const DESKRIPSI_KATEGORI = {
  'Anak dan Remaja': 'Tes kecerdasan, potensi belajar, kesiapan sekolah, serta minat bakat dan penjurusan.',
  Industri: 'Asesmen psikologis untuk seleksi, promosi, dan penempatan karyawan.',
  'Masyarakat Umum': 'Psikotes untuk keperluan pribadi dan konseling bersama psikolog.',
};

const ALUR = [
  ['Buat akun', 'Daftar dengan email. Orang tua dapat menambahkan profil anak di akun yang sama.'],
  ['Isi formulir data diri', 'Formulir identitas atau riwayat anak membantu psikolog mempersiapkan pemeriksaan.'],
  ['Pilih jadwal dan psikolog', 'Lihat tanggal yang masih tersedia, lalu pilih sesi daring atau tatap muka.'],
  ['Transfer dan kirim bukti', 'Bayar melalui transfer bank, unggah bukti di formulir yang disediakan, lalu konfirmasi.'],
  ['Ikuti sesi', 'Tautan sesi daring atau lokasi ruangan dikirim ke email dan dashboard sebelum jadwal.'],
  ['Unduh laporan', 'Laporan hasil pemeriksaan dalam format PDF tersedia di dashboard setelah diselesaikan psikolog.'],
];

export default async function BerandaPage() {
  const [layanan, psikolog] = await Promise.all([
    serverGet('/layanan', { fallback: [] }),
    serverGet('/psikolog', { fallback: [] }),
  ]);

  return (
    <>
      {/* Pembuka */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="font-serif text-[40px] leading-[1.08] font-medium tracking-[-0.01em] md:text-[54px]">
              Pemeriksaan psikologis dan konseling, dengan hasil yang tertulis jelas.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
              AROFTA PADC melayani tes psikologi anak, minat bakat, asesmen rekrutmen, dan konseling di Kartasura, Sukoharjo.
              Pesan jadwal, isi formulir, dan unduh laporan hasil pemeriksaan dari satu akun.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/layanan" size="lg">Pilih layanan</Button>
              <Button href="/jadwal" size="lg" variant="secondary">Lihat jadwal tersedia</Button>
            </div>
          </div>
          <PsikogramContoh />
        </div>
      </section>

      {/* Layanan per kategori */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20" aria-labelledby="judul-layanan">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="judul-layanan" className="font-serif text-3xl font-medium md:text-4xl">Layanan</h2>
          <Link href="/layanan" className="text-sm font-semibold text-violet-deep hover:underline">Semua layanan dan harga</Link>
        </div>
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
          {KATEGORI_LAYANAN.map((k, i) => {
            const items = layanan.filter((l) => l.kategori === k.nama);
            return (
              <div key={k.slug} className={`${i ? 'md:pl-8' : ''} ${i < 2 ? 'md:pr-8' : ''}`}>
                <h3 className="text-lg font-semibold">{k.nama}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{DESKRIPSI_KATEGORI[k.nama]}</p>
                <ul className="mt-5 divide-y divide-line border-y border-line">
                  {items.length === 0 && <li className="py-3 text-sm text-ink-faint">Belum ada layanan aktif.</li>}
                  {items.map((l) => (
                    <li key={l.id_layanan}>
                      <Link href={`/layanan/${l.id_layanan}`} className="group flex items-baseline justify-between gap-4 py-3">
                        <span className="text-[15px] text-ink group-hover:text-violet-deep">{l.nama_layanan}</span>
                        <span className="shrink-0 text-sm text-ink-soft tabular">{rupiah(l.harga)}</span>
                      </Link>
                      <p className="-mt-2 pb-3 text-[13px] text-ink-faint">{durasi(l.durasi_menit)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Alur layanan: memang berurutan, jadi diberi nomor */}
      <section id="alur" className="scroll-mt-16 bg-violet-tint/50" aria-labelledby="judul-alur">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <h2 id="judul-alur" className="font-serif text-3xl font-medium md:text-4xl">Cara memesan layanan</h2>
          <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {ALUR.map(([judul, isi], i) => (
              <li key={judul} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet text-sm font-semibold text-violet-deep tabular">{i + 1}</span>
                <div>
                  <h3 className="text-[15px] font-semibold">{judul}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{isi}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Button href="/daftar">Buat akun</Button>
          </div>
        </div>
      </section>

      {/* Tim psikolog */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20" aria-labelledby="judul-tim">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="judul-tim" className="font-serif text-3xl font-medium md:text-4xl">Tim psikolog</h2>
          <Link href="/tim-psikolog" className="text-sm font-semibold text-violet-deep hover:underline">Profil lengkap</Link>
        </div>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {psikolog.length === 0 && <li className="text-sm text-ink-faint">Data psikolog belum tersedia.</li>}
          {psikolog.slice(0, 6).map((p) => (
            <li key={p.id_psikolog}>
              <Link href={`/tim-psikolog/${p.id_psikolog}`} className="group flex gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-tint font-serif text-lg text-violet-deep">{inisial(p.nama_lengkap)}</span>
                <span>
                  <span className="block font-semibold text-ink group-hover:text-violet-deep">{p.nama_lengkap}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{p.spesialisasi || 'Psikolog'}</span>
                  {p.rating && p.rating.jumlah > 0 && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[13px] text-ink-soft">
                      <Star className="h-3.5 w-3.5 fill-violet text-violet" aria-hidden="true" />
                      {p.rating.rata_rata} dari {p.rating.jumlah} ulasan
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
