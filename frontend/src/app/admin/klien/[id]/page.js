'use client';

import { use } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Badge from '@/components/ui/Badge';
import DataKlien from '@/components/sesi/DataKlien';
import DataView from '@/components/sesi/DataView';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { tanggal, jam } from '@/lib/format';
import { ORGANISASI, REFERENSI } from '@/lib/form-defs';

export default function DetailKlienAdminPage({ params }) {
  const { id } = use(params);
  const { data, error, loading, reload } = useApi(`/admin/klien/${id}`);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <Link href="/admin/klien" className="text-sm text-ink-soft hover:text-ink">Klien</Link>
      <PageHeader title={data.nama_lengkap} description={`${data.akun?.email}, profil ${data.hubungan_akun === 'Diri Sendiri' ? 'pemilik akun' : data.hubungan_akun.toLowerCase()}`} />
      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div className="min-w-0 rounded-panel border border-line bg-white p-5"><DataKlien klien={data} /></div>
          {(data.organisasi?.length > 0 || data.referensi?.length > 0) && (
            <Panel title="Organisasi & referensi">
              <div className="space-y-5 px-5 py-4">
                {data.organisasi.map((o) => <DataView key={o.id_organisasi} sections={ORGANISASI} data={o} />)}
                {data.referensi.map((r) => <DataView key={r.id_referensi} sections={REFERENSI} data={r} />)}
              </div>
            </Panel>
          )}
        </div>
        <Panel title="Riwayat sesi">
          {data.riwayat_sesi.length === 0 ? <p className="px-5 py-4 text-sm text-ink-faint">Belum ada sesi.</p> : (
            <ul className="divide-y divide-line">
              {data.riwayat_sesi.map((s) => (
                <li key={s.id_sesi}>
                  <Link href={`/admin/sesi/${s.id_sesi}`} className="block px-5 py-3 text-sm hover:bg-mist">
                    <span className="flex items-center justify-between gap-2"><span className="font-medium">{tanggal(s.tanggal)}, {jam(s.waktu)}</span><Badge status={s.status_asesmen} /></span>
                    <span className="text-ink-soft">{s.layanan?.nama_layanan}, {s.psikolog?.nama_lengkap}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
