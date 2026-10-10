'use client';

import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import StatStrip from '@/components/dashboard/StatStrip';
import Panel from '@/components/dashboard/Panel';
import SesiTable from '@/components/dashboard/SesiTable';
import Button from '@/components/ui/Button';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { rupiah, tanggal } from '@/lib/format';

export default function PsikologRingkasanPage() {
  const { data, error, loading, reload } = useApi('/psikolog/dashboard');
  const hariIni = new Date();
  const iso = `${hariIni.getFullYear()}-${String(hariIni.getMonth() + 1).padStart(2, '0')}-${String(hariIni.getDate()).padStart(2, '0')}`;

  return (
    <>
      <PageHeader title="Ringkasan" description={`Jadwal dan pekerjaan Anda, ${tanggal(iso, { hari: true })}.`}
        action={<Button href="/psikolog/kalender" variant="secondary">Atur jadwal praktik</Button>} />
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-6">
          <StatStrip items={[
            { label: 'Sesi hari ini', value: data.sesi_hari_ini.length },
            { label: 'Sesi terjadwal', value: data.sesi_per_status.Terdaftar, href: '/psikolog/sesi?status=Terdaftar' },
            { label: 'Laporan belum final', value: data.laporan_belum_final, href: '/psikolog/laporan', tone: 'alert' },
            { label: 'Fee belum dicairkan', value: rupiah(data.fee_bulan_ini.belum_dibayar), note: 'bulan ini', href: '/psikolog/fee' },
          ]} />
          <Panel title="Sesi hari ini" action={<Link href="/psikolog/sesi" className="text-sm font-semibold text-violet-deep hover:underline">Semua sesi</Link>}>
            <SesiTable rows={data.sesi_hari_ini} hrefBase="/psikolog/sesi" tampilPsikolog={false} tampilTanggal={false} kosong="Tidak ada sesi hari ini." />
          </Panel>
        </div>
      )}
    </>
  );
}
