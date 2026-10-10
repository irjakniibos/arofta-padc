/** Tabel sesi ringkas yang dipakai di beberapa dashboard. */
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { jam, tanggal } from '@/lib/format';

export default function SesiTable({ rows, hrefBase, tampilKlien = true, tampilPsikolog = true, tampilTanggal = true, kosong = 'Tidak ada sesi.' }) {
  if (!rows?.length) return <p className="px-5 py-6 text-sm text-ink-faint">{kosong}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[12px] text-ink-faint">
            <th scope="col" className="px-5 py-2.5 font-medium">{tampilTanggal ? 'Jadwal' : 'Jam'}</th>
            {tampilKlien && <th scope="col" className="px-5 py-2.5 font-medium">Klien</th>}
            <th scope="col" className="px-5 py-2.5 font-medium">Layanan</th>
            {tampilPsikolog && <th scope="col" className="px-5 py-2.5 font-medium">Psikolog</th>}
            <th scope="col" className="px-5 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((s) => (
            <tr key={s.id_sesi} className="hover:bg-mist/60">
              <td className="px-5 py-3 tabular">
                <Link href={`${hrefBase}/${s.id_sesi}`} className="font-medium text-ink hover:text-violet-deep">
                  {tampilTanggal && <span className="block">{tanggal(s.tanggal)}</span>}
                  <span className={tampilTanggal ? 'text-[13px] text-ink-soft' : ''}>{jam(s.waktu)} WIB, {s.tipe_sesi === 'Online' ? 'daring' : 'tatap muka'}</span>
                </Link>
              </td>
              {tampilKlien && <td className="px-5 py-3">{s.klien?.nama_lengkap}</td>}
              <td className="px-5 py-3 text-ink-soft">{s.layanan?.nama_layanan}</td>
              {tampilPsikolog && <td className="px-5 py-3 text-ink-soft">{s.psikolog?.nama_lengkap}</td>}
              <td className="px-5 py-3"><Badge status={s.status_asesmen} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
