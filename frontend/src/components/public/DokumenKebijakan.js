/** Tampilan dokumen kebijakan (Kebijakan Privasi, Persetujuan Layanan) untuk halaman publik. */
import { BERLAKU } from '@/lib/kebijakan';

export default function DokumenKebijakan({ dokumen, info = {} }) {
  const tampil = (v) => v && v !== '-';
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-serif text-4xl font-medium">{dokumen.judul}</h1>
      <p className="mt-3 text-[13px] text-ink-faint">Versi {dokumen.versi}, berlaku sejak {BERLAKU}</p>
      <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">{dokumen.pembuka}</p>
      {dokumen.bagian.map((b, i) => (
        <section key={b.judul} className="mt-10" aria-labelledby={`bagian-${i}`}>
          <h2 id={`bagian-${i}`} className="text-xl font-semibold">{i + 1}. {b.judul}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft marker:text-violet">
            {b.isi.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>
      ))}
      <section className="mt-12 border-t border-line pt-6" aria-labelledby="kontak-kebijakan">
        <h2 id="kontak-kebijakan" className="text-base font-semibold">Kontak</h2>
        <address className="mt-2 space-y-1 text-[15px] not-italic leading-relaxed text-ink-soft">
          <p>{tampil(info.nama_lembaga) ? info.nama_lembaga : 'AROFTA PADC'}</p>
          {tampil(info.alamat_klinik) && <p>{info.alamat_klinik}</p>}
          {tampil(info.email_lembaga) && <p>Email {info.email_lembaga}</p>}
          {tampil(info.kontak_whatsapp) && <p>WhatsApp {info.kontak_whatsapp}</p>}
        </address>
      </section>
    </article>
  );
}
