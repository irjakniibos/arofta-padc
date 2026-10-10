'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Loading, ErrorState } from '@/components/ui/DataState';
import SuperAdminOnly from '@/components/auth/SuperAdminOnly';
import { useApi } from '@/lib/use-api';
import { tanggalJam } from '@/lib/format';

const AKSI = {
  LOGIN: 'Masuk', REGISTER: 'Daftar akun', CHANGE_PASSWORD: 'Ubah password', RESET_PASSWORD: 'Reset password', CREATE: 'Membuat data', UPDATE: 'Mengubah data', DELETE: 'Menghapus data',
  STATUS: 'Ubah status akun', ROLE: 'Ubah role', BOOKING: 'Booking', CANCEL: 'Pembatalan', VERIFY_PAYMENT: 'Verifikasi pembayaran', ALOKASI: 'Alokasi jadwal', TAUTAN: 'Tautan sesi',
  STATUS_SESI: 'Status sesi', FINALISASI_LAPORAN: 'Finalisasi laporan', REOPEN_REPORT: 'Buka kembali laporan', DOWNLOAD_REPORT: 'Unduh laporan', PAY_FEE: 'Pencairan fee',
  UPLOAD_TEMPLATE: 'Unggah template', MODERASI_ULASAN: 'Moderasi ulasan', BACKUP: 'Backup database',
};

function Audit() {
  const [f, setF] = useState({ aksi: '', dari: '', sampai: '' });
  const [q, setQ] = useState(f);
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useApi('/superadmin/audit-log', { ...q, page, limit: 25 });
  return (
    <>
      <PageHeader title="Audit log" description="Catatan aktivitas penting di sistem: siapa melakukan apa, kapan, dan dari alamat IP mana." />
      <form onSubmit={(e) => { e.preventDefault(); setQ(f); setPage(1); }} className="mb-4 flex flex-wrap items-end gap-3">
        <Select label="Aktivitas" value={f.aksi} placeholder="Semua aktivitas" options={Object.entries(AKSI).map(([value, label]) => ({ value, label }))} onChange={(e) => setF({ ...f, aksi: e.target.value })} />
        <Input label="Dari tanggal" type="date" value={f.dari} max={f.sampai || undefined} onChange={(e) => setF({ ...f, dari: e.target.value })} />
        <Input label="Sampai tanggal" type="date" value={f.sampai} min={f.dari || undefined} onChange={(e) => setF({ ...f, sampai: e.target.value })} />
        <Button type="submit" variant="secondary">Terapkan</Button>
      </form>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_log" rows={data} empty="Tidak ada aktivitas pada filter ini." minWidth={760}
            columns={[
              { key: 'waktu', label: 'Waktu', className: 'whitespace-nowrap tabular', render: (l) => tanggalJam(l.created_at) },
              { key: 'user', label: 'Pengguna', render: (l) => (l.user ? <><span className="block">{l.user.email}</span><span className="text-[13px] text-ink-faint">{l.user.role}</span></> : <span className="text-ink-faint">Sistem</span>) },
              { key: 'aksi', label: 'Aktivitas', render: (l) => <><span className="block font-medium">{AKSI[l.aksi] || l.aksi}</span>{l.entitas && <span className="text-[13px] text-ink-faint">{l.entitas}{l.id_entitas ? ` #${l.id_entitas}` : ''}</span>}</> },
              { key: 'desk', label: 'Keterangan', render: (l) => <span className="text-ink-soft">{l.deskripsi || ''}</span> },
              { key: 'ip', label: 'IP', className: 'font-mono text-[12.5px] text-ink-soft', render: (l) => l.ip_address || '' },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
    </>
  );
}

export default function AuditPage() {
  return <SuperAdminOnly><Audit /></SuperAdminOnly>;
}
