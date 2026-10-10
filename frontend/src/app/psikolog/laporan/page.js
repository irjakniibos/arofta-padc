'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { tanggal } from '@/lib/format';

export default function LaporanPsikologPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Draft');
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useApi('/psikolog/laporan', { status, page, limit: 15 });
  return (
    <>
      <PageHeader title="Laporan hasil" description="Laporan yang sedang disusun (draft) dan yang sudah dikirim ke klien. Laporan baru dibuat dari halaman sesi." />
      <Tabs className="mb-4" value={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={[{ value: 'Draft', label: 'Draft' }, { value: 'Final', label: 'Final' }]} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_laporan" rows={data} empty={status === 'Draft' ? 'Tidak ada laporan draft.' : 'Belum ada laporan final.'}
            onRowClick={(l) => router.push(`/psikolog/sesi/${l.sesi.id_sesi}`)}
            columns={[
              { key: 'klien', label: 'Klien', render: (l) => <><span className="block font-medium">{l.sesi.klien?.nama_lengkap}</span><span className="text-[13px] text-ink-faint">{l.sesi.kode_booking}</span></> },
              { key: 'layanan', label: 'Layanan', render: (l) => l.sesi.layanan?.nama_layanan },
              { key: 'template', label: 'Template', render: (l) => l.template?.nama_template },
              { key: 'tgl', label: 'Tanggal sesi', render: (l) => tanggal(l.sesi.tanggal) },
              { key: 'status', label: 'Status', render: (l) => <Badge status={l.status_laporan} /> },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
    </>
  );
}
