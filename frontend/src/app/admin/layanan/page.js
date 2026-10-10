'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Tabs from '@/components/ui/Tabs';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import DynamicForm from '@/components/form/DynamicForm';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { rupiah, durasi } from '@/lib/format';
import { pickFields } from '@/lib/form-defs';
import { KATEGORI_FEE } from '@/lib/form-defs-admin';

function KategoriFeeTab() {
  const { data, error, loading, reload } = useApi('/admin/kategori-fee');
  const f = useFormSubmit({});
  const [edit, setEdit] = useState(null);
  const buka = (row) => { f.setValue(row === 'baru' ? { is_active: true } : { ...row, nominal_default: Number(row.nominal_default) }); setEdit(row); };
  const simpan = async (e) => {
    e.preventDefault();
    const body = pickFields(KATEGORI_FEE, f.value);
    const ok = await f.submit(() => (edit === 'baru' ? api.post('/admin/kategori-fee', body) : api.put(`/admin/kategori-fee/${edit.id_kategori_fee}`, body)), 'Kategori fee tersimpan');
    if (ok) { setEdit(null); reload(); }
  };
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <Panel title="Kategori fee psikolog" action={<Button size="sm" onClick={() => buka('baru')}><Plus className="h-4 w-4" />Tambah kategori</Button>}>
      <Table rowKey="id_kategori_fee" rows={data} columns={[
        { key: 'nama', label: 'Kategori', render: (k) => <><span className="block font-medium">{k.nama_kategori}</span>{k.keterangan && <span className="text-[13px] text-ink-faint">{k.keterangan}</span>}</> },
        { key: 'nominal', label: 'Nominal default', className: 'tabular', render: (k) => rupiah(k.nominal_default) },
        { key: 'status', label: 'Status', render: (k) => <Badge tone={k.is_active ? 'success' : 'neutral'}>{k.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
        { key: 'aksi', label: '', render: (k) => <button type="button" onClick={() => buka(k)} className="rounded-control p-1.5 text-ink-soft hover:bg-mist" aria-label="Ubah"><Pencil className="h-4 w-4" /></button> },
      ]} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'baru' ? 'Tambah kategori fee' : 'Ubah kategori fee'}>
        <form onSubmit={simpan}>
          <DynamicForm sections={KATEGORI_FEE} value={f.value} onChange={f.setValue} errors={f.errors} />
          <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEdit(null)}>Batal</Button><Button type="submit" loading={f.saving}>Simpan</Button></div>
        </form>
      </Modal>
    </Panel>
  );
}

export default function LayananAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('layanan');
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useApi(tab === 'layanan' ? '/admin/layanan' : null, { page, limit: 20 });
  return (
    <>
      <PageHeader title="Layanan & harga" description="Atur layanan, harga, template laporan, dan tarif fee psikolog untuk setiap layanan."
        action={tab === 'layanan' && <Button href="/admin/layanan/baru"><Plus className="h-4 w-4" />Tambah layanan</Button>} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'layanan', label: 'Layanan' }, { value: 'fee', label: 'Kategori fee' }]} />
      {tab === 'fee' ? <KategoriFeeTab /> : (
        <>
          {loading && !data && <Loading />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {data && (
            <Panel>
              <Table rowKey="id_layanan" rows={data} empty="Belum ada layanan." onRowClick={(l) => router.push(`/admin/layanan/${l.id_layanan}`)}
                columns={[
                  { key: 'nama', label: 'Layanan', render: (l) => <><span className="block font-medium">{l.nama_layanan}</span><span className="text-[13px] text-ink-faint">{l.kategori}</span></> },
                  { key: 'harga', label: 'Harga', className: 'tabular', render: (l) => rupiah(l.harga) },
                  { key: 'durasi', label: 'Durasi', render: (l) => durasi(l.durasi_menit) },
                  { key: 'template', label: 'Template laporan', render: (l) => l.template?.nama_template || <span className="text-ink-faint">Tanpa laporan</span> },
                  { key: 'status', label: 'Status', render: (l) => <Badge tone={l.is_active ? 'success' : 'neutral'}>{l.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
                ]} />
              <Pagination meta={meta} onPage={setPage} />
            </Panel>
          )}
        </>
      )}
    </>
  );
}
