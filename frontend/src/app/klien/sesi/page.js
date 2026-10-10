'use client';

import Link from 'next/link';
import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Table from '@/components/ui/Table';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { jam, tanggal, rupiah } from '@/lib/format';

export default function SesiKlienPage() {
  const [waktu, setWaktu] = useState('mendatang');
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useApi('/klien/sesi', { waktu, page, limit: 10 });

  return (
    <>
      <PageHeader title="Jadwal & pembayaran" description="Status sesi, pembayaran, dan tautan sesi daring." action={<Button href="/klien/booking">Pesan layanan</Button>} />
      <Tabs className="mb-4" value={waktu} onChange={(v) => { setWaktu(v); setPage(1); }}
        tabs={[{ value: 'mendatang', label: 'Mendatang' }, { value: 'lampau', label: 'Riwayat' }]} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_sesi" rows={data} empty={waktu === 'mendatang' ? 'Belum ada sesi mendatang.' : 'Belum ada riwayat sesi.'}
            columns={[
              { key: 'jadwal', label: 'Jadwal', render: (s) => (
                <Link href={`/klien/sesi/${s.id_sesi}`} className="font-medium hover:text-violet-deep">
                  <span className="block">{tanggal(s.tanggal)}</span>
                  <span className="text-[13px] text-ink-soft tabular">{jam(s.waktu)} WIB, {s.tipe_sesi === 'Online' ? 'daring' : 'tatap muka'}</span>
                </Link>) },
              { key: 'layanan', label: 'Layanan', render: (s) => <><span className="block">{s.layanan?.nama_layanan}</span><span className="text-[13px] text-ink-soft">{s.klien?.nama_lengkap}</span></> },
              { key: 'psikolog', label: 'Psikolog', render: (s) => s.psikolog?.nama_lengkap },
              { key: 'bayar', label: 'Pembayaran', render: (s) => s.pembayaran ? <><Badge status={s.pembayaran.status_pembayaran} /><span className="mt-1 block text-[13px] tabular text-ink-soft">{rupiah(s.pembayaran.total_bayar)}</span></> : '-' },
              { key: 'status', label: 'Status sesi', render: (s) => <Badge status={s.status_asesmen} /> },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
    </>
  );
}
