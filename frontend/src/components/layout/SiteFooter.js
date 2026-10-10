import Link from 'next/link';
import Logo from '@/components/brand/Logo';

/** Footer publik. Alamat & kontak dari pengaturan lembaga (tabel `pengaturan`, diubah Admin). */
export default function SiteFooter({ info = {} }) {
  const tampil = (v) => v && v !== '-';
  return (
    <footer id="kontak" className="border-t border-line bg-mist">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Lembaga layanan asesmen dan pengembangan psikologi untuk anak, remaja, keluarga, dan organisasi.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Kunjungi kami</h2>
          <address className="mt-3 space-y-1.5 text-sm not-italic leading-relaxed text-ink-soft">
            {tampil(info.alamat_klinik) && <p>{info.alamat_klinik}</p>}
            {tampil(info.kontak_whatsapp) && <p>WhatsApp {info.kontak_whatsapp}</p>}
            {tampil(info.email_lembaga) && <p>{info.email_lembaga}</p>}
          </address>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Layanan</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <li><Link className="hover:text-violet-deep" href="/layanan?kategori=anak-dan-remaja">Anak dan remaja</Link></li>
            <li><Link className="hover:text-violet-deep" href="/layanan?kategori=industri">Industri dan rekrutmen</Link></li>
            <li><Link className="hover:text-violet-deep" href="/layanan?kategori=masyarakat-umum">Masyarakat umum</Link></li>
            <li><Link className="hover:text-violet-deep" href="/tim-psikolog">Tim psikolog</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl space-y-3 px-5 py-5 text-[13px] text-ink-faint">
          <p className="text-ink-soft">
            Layanan ini bukan layanan gawat darurat. Bila Anda atau orang di sekitar Anda dalam bahaya, segera hubungi 112 atau datang ke IGD rumah sakit terdekat.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p>© {new Date().getFullYear()} AROFTA Psychological Assessment and Development Center</p>
            <nav aria-label="Dokumen kebijakan" className="flex gap-5">
              <Link className="hover:text-violet-deep" href="/kebijakan-privasi">Kebijakan Privasi</Link>
              <Link className="hover:text-violet-deep" href="/persetujuan-layanan">Persetujuan Layanan</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
