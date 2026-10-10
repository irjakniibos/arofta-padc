'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Pagination from '@/components/ui/Pagination';
import UlasanItem, { Bintang } from '@/components/umum/UlasanList';
import Badge from '@/components/ui/Badge';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';

export default function UlasanPsikologPage() {
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useApi('/psikolog/ulasan', { page, limit: 15 });
  const r = meta?.ringkasan;
  return (
    <>
      <PageHeader title="Ulasan" description="Ulasan klien setelah sesi selesai. Nama klien disamarkan." />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel title={r?.jumlah ? `Rata-rata ${r.rata_rata} dari 5 (${r.jumlah} ulasan tampil)` : 'Belum ada ulasan yang tampil'} action={r?.rata_rata ? <Bintang nilai={Math.round(r.rata_rata)} /> : null}>
          {data.length === 0 ? <p className="px-5 py-10 text-center text-sm text-ink-faint">Belum ada ulasan.</p> : (
            <ul className="divide-y divide-line">{data.map((u) => <UlasanItem key={u.id_ulasan} u={u} aksi={!u.is_tampil ? <Badge tone="neutral">Disembunyikan admin</Badge> : null} />)}</ul>
          )}
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
    </>
  );
}
