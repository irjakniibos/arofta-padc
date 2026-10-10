'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import StatStrip from '@/components/dashboard/StatStrip';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import PeriodeBulan from '@/components/umum/PeriodeBulan';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { rupiah, tanggal } from '@/lib/format';

const now = new Date();

export default function FeeSayaPage() {
  const [p, setP] = useState({ bulan: now.getMonth() + 1, tahun: now.getFullYear() });
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi('/psikolog/fee', { ...p, page, limit: 20 });
  const total = Number(data?.ringkasan?.total_fee || 0);
  const belum = Number(data?.ringkasan?.belum_dibayar || 0);
  return (
    <>
      <PageHeader title="Fee saya" description="Fee tercatat otomatis setiap sesi selesai, sesuai tarif fee layanan. Pencairan dilakukan Direksi melalui transfer."
        action={<PeriodeBulan value={p} onChange={(v) => { setP(v); setPage(1); }} />} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-6">
          <StatStrip items={[
            { label: 'Total fee bulan ini', value: rupiah(total) },
            { label: 'Belum dicairkan', value: rupiah(belum) },
            { label: 'Sudah dicairkan', value: rupiah(total - belum) },
            { label: 'Jumlah komponen fee', value: data.meta.total },
          ]} />
          <Panel title="Rincian per sesi">
            <Table rowKey="id_fee" rows={data.rows} empty="Belum ada fee pada periode ini."
              columns={[
                { key: 'tgl', label: 'Sesi', render: (f) => <><span className="block font-medium">{tanggal(f.sesi?.tanggal)}</span><span className="text-[13px] text-ink-faint">{f.sesi?.kode_booking}</span></> },
                { key: 'klien', label: 'Klien & layanan', render: (f) => <><span className="block">{f.sesi?.klien?.nama_lengkap}</span><span className="text-[13px] text-ink-soft">{f.sesi?.layanan?.nama_layanan}</span></> },
                { key: 'kategori', label: 'Komponen', render: (f) => f.kategori?.nama_kategori },
                { key: 'nominal', label: 'Nominal', className: 'tabular', render: (f) => rupiah(f.nominal_fee) },
                { key: 'status', label: 'Status', render: (f) => <><Badge status={f.status_distribusi} />{f.tanggal_pencairan && <span className="mt-1 block text-[12px] text-ink-faint">{tanggal(String(f.tanggal_pencairan).slice(0, 10))}</span>}</> },
              ]} />
            <Pagination meta={data.meta} onPage={setPage} />
          </Panel>
        </div>
      )}
    </>
  );
}
