'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DynamicForm from '@/components/form/DynamicForm';
import SaveBar from '@/components/form/SaveBar';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { pickFields } from '@/lib/form-defs';
import { PROFIL_PSIKOLOG } from '@/lib/form-defs-admin';

export default function DetailPsikologAdminPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const router = useRouter();
  const { data, error, loading, reload } = useApi(`/admin/psikolog/${id}`);
  const f = useFormSubmit({});
  const [konfirmasi, setKonfirmasi] = useState(false);
  useEffect(() => { if (data) f.setValue(data); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const aktif = data.akun?.is_active;
  return (
    <>
      <Link href="/admin/psikolog" className="text-sm text-ink-soft hover:text-ink">Psikolog</Link>
      <PageHeader title={data.nama_lengkap} description={data.akun?.email}
        action={<div className="flex items-center gap-3"><Badge tone={aktif ? 'success' : 'neutral'}>{aktif ? 'Aktif' : 'Nonaktif'}</Badge><Button variant="secondary" onClick={() => setKonfirmasi(true)}>{aktif ? 'Nonaktifkan' : 'Aktifkan'}</Button></div>} />
      <form className="rounded-panel border border-line bg-white px-5 pt-6"
        onSubmit={async (e) => { e.preventDefault(); const ok = await f.submit(() => api.put(`/admin/psikolog/${id}`, pickFields(PROFIL_PSIKOLOG, f.value)), 'Data psikolog tersimpan'); if (ok) router.push('/admin/psikolog'); }}>
        <DynamicForm sections={PROFIL_PSIKOLOG} value={f.value} onChange={f.setValue} errors={f.errors} />
        <SaveBar saving={f.saving} note="Atur jadwal praktik psikolog ini di menu Kalender jadwal." />
      </form>
      <ConfirmDialog open={konfirmasi} onClose={() => setKonfirmasi(false)} title={aktif ? 'Nonaktifkan psikolog?' : 'Aktifkan psikolog?'} confirmLabel={aktif ? 'Nonaktifkan' : 'Aktifkan'} variant={aktif ? 'danger' : 'primary'}
        onConfirm={async () => { try { await api.patch(`/admin/psikolog/${id}/status`, { is_active: !aktif }); toast(aktif ? 'Psikolog dinonaktifkan' : 'Psikolog diaktifkan'); reload(); } catch (e) { toast(e.message, 'error'); } setKonfirmasi(false); }}>
        {aktif ? 'Psikolog tidak dapat login dan tidak tampil di jadwal klien. Sesi aktif harus dialihkan terlebih dahulu.' : 'Psikolog dapat login dan tampil kembali di jadwal klien.'}
      </ConfirmDialog>
    </>
  );
}
