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
import DynamicForm from '@/components/form/DynamicForm';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { pickFields } from '@/lib/form-defs';
import { TEMPLATE_META } from '@/lib/form-defs-admin';

export default function TemplateListPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useApi('/admin/template-laporan');
  const [baru, setBaru] = useState(false);
  const f = useFormSubmit({ skala_min: 1, skala_max: 5, is_active: true });
  const simpan = async (e) => {
    e.preventDefault();
    const r = await f.submit(() => api.post('/admin/template-laporan', pickFields(TEMPLATE_META(true), f.value)), 'Template dibuat');
    if (r) router.push(`/admin/template/${r.data.id_template}`);
  };
  return (
    <>
      <PageHeader title="Template laporan" description="Template menentukan aspek yang diisi psikolog dan file Word yang dipakai untuk membuat laporan PDF."
        action={<Button onClick={() => setBaru(true)}><Plus className="h-4 w-4" />Template baru</Button>} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_template" rows={data} onRowClick={(t) => router.push(`/admin/template/${t.id_template}`)}
            columns={[
              { key: 'nama', label: 'Template', render: (t) => <><span className="block font-medium">{t.nama_template}</span><span className="text-[13px] text-ink-faint">{t.kode}</span></> },
              { key: 'item', label: 'Aspek aktif', className: 'tabular', render: (t) => t.jumlah_item },
              { key: 'skala', label: 'Skala', className: 'tabular', render: (t) => `${t.skala_min} sampai ${t.skala_max}` },
              { key: 'file', label: 'File Word', render: (t) => (t.file_docx ? <span>Versi {t.versi}</span> : <span className="text-warning">Belum ada file</span>) },
              { key: 'status', label: 'Status', render: (t) => <Badge tone={t.is_active ? 'success' : 'neutral'}>{t.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
            ]} />
        </Panel>
      )}
      <Modal open={baru} onClose={() => setBaru(false)} title="Template laporan baru">
        <form onSubmit={simpan}>
          <DynamicForm sections={TEMPLATE_META(true)} value={f.value} onChange={f.setValue} errors={f.errors} />
          <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setBaru(false)}>Batal</Button><Button type="submit" loading={f.saving}>Buat template</Button></div>
        </form>
      </Modal>
    </>
  );
}
