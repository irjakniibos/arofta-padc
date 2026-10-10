'use client';

/** Daftar sesi dengan filter (psikolog & admin/monitoring). */
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Table from '@/components/ui/Table';
import { Input, Select } from '@/components/ui/Field';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { jam, tanggal } from '@/lib/format';

const STATUS = ['Terdaftar', 'Berjalan', 'Selesai', 'Batal'];

export default function SesiList({ mode }) {
  const router = useRouter();
  const sp = useSearchParams();
  const isAdmin = mode === 'admin';
  const [f, setF] = useState({ status: sp.get('status') || '', q: '', status_pembayaran: '', dari: '', sampai: '', page: 1 });
  const path = isAdmin ? '/admin/monitoring' : '/psikolog/sesi';
  const { data, meta, error, loading, reload } = useApi(path, { ...f, limit: 15, urut: f.status === 'Selesai' || f.status === 'Batal' ? 'terbaru' : undefined });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v, page: 1 }));
  const ring = meta?.ringkasan_status;

  return (
    <>
      <PageHeader title={isAdmin ? 'Sesi & monitoring' : 'Sesi klien'}
        description={isAdmin ? 'Pantau status asesmen seluruh klien: terdaftar, berjalan, selesai, atau batal.' : 'Sesi yang Anda tangani beserta data klien dan laporannya.'}
        action={isAdmin && <Button href="/admin/booking">Booking mendesak</Button>} />
      <Tabs className="mb-4" value={f.status} onChange={(v) => set('status', v)}
        tabs={[{ value: '', label: 'Semua' }, ...STATUS.map((s) => ({ value: s, label: s, count: ring ? ring[s] : undefined }))]} />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin && <Input placeholder="Cari nama klien / kode booking" aria-label="Cari" value={f.q} onChange={(e) => set('q', e.target.value)} maxLength={100} />}
        {isAdmin && <Select aria-label="Status pembayaran" value={f.status_pembayaran} placeholder="Semua status pembayaran" options={['Menunggu Pembayaran', 'Menunggu Verifikasi', 'Lunas', 'Ditolak', 'Batal']} onChange={(e) => set('status_pembayaran', e.target.value)} />}
        <Input type="date" aria-label="Dari tanggal" value={f.dari} onChange={(e) => set('dari', e.target.value)} />
        <Input type="date" aria-label="Sampai tanggal" value={f.sampai} onChange={(e) => set('sampai', e.target.value)} />
      </div>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_sesi" rows={data} empty="Tidak ada sesi sesuai filter." onRowClick={(s) => router.push(`/${mode}/sesi/${s.id_sesi}`)}
            columns={[
              { key: 'jadwal', label: 'Jadwal', render: (s) => <><span className="block font-medium">{tanggal(s.tanggal)}</span><span className="text-[13px] text-ink-soft tabular">{jam(s.waktu)} WIB, {s.tipe_sesi === 'Online' ? 'daring' : 'tatap muka'}</span></> },
              { key: 'klien', label: 'Klien', render: (s) => <><span className="block font-medium">{s.klien?.nama_lengkap}</span><span className="text-[13px] text-ink-faint">{s.kode_booking}</span></> },
              { key: 'layanan', label: 'Layanan', render: (s) => s.layanan?.nama_layanan },
              ...(isAdmin ? [{ key: 'psikolog', label: 'Psikolog', render: (s) => s.psikolog?.nama_lengkap }] : []),
              { key: 'bayar', label: 'Pembayaran', render: (s) => <Badge status={s.pembayaran?.status_pembayaran} /> },
              { key: 'laporan', label: 'Laporan', render: (s) => (s.laporan ? <Badge status={s.laporan.status_laporan} /> : <span className="text-ink-faint">-</span>) },
              { key: 'status', label: 'Status', render: (s) => <Badge status={s.status_asesmen} /> },
            ]} />
          <Pagination meta={meta} onPage={(p) => setF((s) => ({ ...s, page: p }))} />
        </Panel>
      )}
    </>
  );
}
