'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import StatStrip from '@/components/dashboard/StatStrip';
import Table from '@/components/ui/Table';
import PeriodeBulan from '@/components/umum/PeriodeBulan';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { rupiah } from '@/lib/format';

const now = new Date();

export default function RekapFeePage() {
  const router = useRouter();
  const [p, setP] = useState({ bulan: now.getMonth() + 1, tahun: now.getFullYear() });
  const { data, error, loading, reload } = useApi('/admin/fee', p);
  return (
    <>
      <PageHeader title="Fee psikolog" description="Rekap fee per psikolog per bulan. Buka salah satu psikolog untuk mencatat pencairan setelah transfer."
        action={<PeriodeBulan value={p} onChange={setP} />} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-6">
          <StatStrip items={[
            { label: 'Total fee', value: rupiah(data.ringkasan.total_fee) },
            { label: 'Belum dicairkan', value: rupiah(data.ringkasan.belum_dibayar) },
            { label: 'Sudah dicairkan', value: rupiah(data.ringkasan.sudah_dibayar) },
          ]} />
          <Panel>
            <Table rowKey="id_psikolog" rows={data.psikolog} empty="Belum ada psikolog."
              onRowClick={(r) => router.push(`/admin/fee/${r.id_psikolog}?bulan=${p.bulan}&tahun=${p.tahun}`)}
              columns={[
                { key: 'nama', label: 'Psikolog', render: (r) => <span className="font-medium">{r.nama_lengkap}</span> },
                { key: 'sesi', label: 'Sesi selesai', className: 'tabular', render: (r) => Number(r.jumlah_sesi) },
                { key: 'total', label: 'Total fee', className: 'tabular', render: (r) => rupiah(r.total_fee) },
                { key: 'belum', label: 'Belum dicairkan', className: 'tabular', render: (r) => (Number(r.belum_dibayar) > 0 ? <span className="font-medium text-warning">{rupiah(r.belum_dibayar)}</span> : <span className="text-ink-faint">Rp0</span>) },
                { key: 'sudah', label: 'Sudah dicairkan', className: 'tabular', render: (r) => rupiah(r.sudah_dibayar) },
              ]} />
          </Panel>
        </div>
      )}
    </>
  );
}
