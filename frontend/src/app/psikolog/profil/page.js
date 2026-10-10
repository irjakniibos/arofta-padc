'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import DynamicForm from '@/components/form/DynamicForm';
import SaveBar from '@/components/form/SaveBar';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { pickFields } from '@/lib/form-defs';
import { useAuth } from '@/lib/auth-context';

const PROFIL = [{ judul: 'Profil profesional', keterangan: 'Ditampilkan di halaman Tim psikolog dan saat klien memesan jadwal. SIPP dan STR diubah oleh admin.', fields: [
  { name: 'nama_lengkap', label: 'Nama lengkap dan gelar', required: true, max: 150, hint: 'Tercetak di laporan hasil, contoh: Nama, M.Psi., Psikolog' },
  { name: 'spesialisasi', label: 'Spesialisasi', max: 150 },
  { name: 'pengalaman_tahun', label: 'Pengalaman (tahun)', type: 'number', maxValue: 60 },
  { name: 'no_hp', label: 'Nomor HP', type: 'tel', max: 16 },
  { name: 'profil_singkat', label: 'Profil singkat', type: 'textarea', rows: 5, max: 2000 },
] }];

export default function ProfilPsikologPage() {
  const { data, error, loading, reload } = useApi('/psikolog/profil');
  const { refresh } = useAuth();
  const f = useFormSubmit({});
  useEffect(() => { if (data) f.setValue(data); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title="Profil" description={`${data.akun?.email}. SIPP ${data.sipp || '-'}${data.str ? `, STR ${data.str}` : ''}`} />
      <form className="rounded-panel border border-line bg-white px-5 pt-6"
        onSubmit={async (e) => { e.preventDefault(); const ok = await f.submit(() => api.put('/psikolog/profil', pickFields(PROFIL, f.value)), 'Profil tersimpan'); if (ok) refresh(); }}>
        <DynamicForm sections={PROFIL} value={f.value} onChange={f.setValue} errors={f.errors} />
        <SaveBar saving={f.saving} />
      </form>
    </>
  );
}
