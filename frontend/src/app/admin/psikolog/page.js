'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import DynamicForm from '@/components/form/DynamicForm';
import { Input } from '@/components/ui/Field';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { AKUN_PSIKOLOG, PROFIL_PSIKOLOG } from '@/lib/form-defs-admin';

export default function PsikologAdminPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const f = useFormSubmit({});
  const { data, meta, error, loading, reload } = useApi('/admin/psikolog', { q, page, limit: 15 });

  const simpan = async (e) => {
    e.preventDefault();
    const r = await f.submit(() => api.post('/admin/psikolog', f.value), 'Akun psikolog dibuat');
    if (r) { setOpen(false); f.setValue({}); router.push(`/admin/psikolog/${r.data.id_psikolog}`); }
  };

  return (
    <>
      <PageHeader title="Psikolog" description="Akun dan profil psikolog. Psikolog nonaktif tidak tampil di jadwal klien."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Tambah psikolog</Button>} />
      <Input className="mb-4 max-w-md" aria-label="Cari psikolog" placeholder="Cari nama psikolog" maxLength={100} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_psikolog" rows={data} empty="Belum ada psikolog." onRowClick={(p) => router.push(`/admin/psikolog/${p.id_psikolog}`)}
            columns={[
              { key: 'nama', label: 'Nama', render: (p) => <><span className="block font-medium">{p.nama_lengkap}</span><span className="text-[13px] text-ink-faint">{p.akun?.email}</span></> },
              { key: 'sipp', label: 'SIPP', render: (p) => p.sipp || '-' },
              { key: 'spes', label: 'Spesialisasi', render: (p) => p.spesialisasi || '-' },
              { key: 'sesi', label: 'Jumlah sesi', className: 'tabular', render: (p) => p.jumlah_sesi },
              { key: 'status', label: 'Status', render: (p) => <Badge tone={p.akun?.is_active ? 'success' : 'neutral'}>{p.akun?.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah psikolog" size="lg">
        <form onSubmit={simpan}>
          <DynamicForm sections={[...AKUN_PSIKOLOG, ...PROFIL_PSIKOLOG]} value={f.value} onChange={f.setValue} errors={f.errors} />
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" loading={f.saving}>Buat akun</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
