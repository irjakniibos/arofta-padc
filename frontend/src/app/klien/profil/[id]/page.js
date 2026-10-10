'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DynamicForm from '@/components/form/DynamicForm';
import SaveBar from '@/components/form/SaveBar';
import ChildList from '@/components/klien/ChildList';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PROFIL_KLIEN, INTAKE_DEWASA, INTAKE_ANAK, KELUARGA, KELUARGA_LABEL, ORGANISASI, REFERENSI, pickFields } from '@/lib/form-defs';

function FormSection({ sections, initial, save, note, label }) {
  const f = useFormSubmit(initial || {});
  useEffect(() => { f.setValue(initial || {}); }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <form onSubmit={async (e) => { e.preventDefault(); await f.submit(() => save(pickFields(sections, f.value)), 'Data tersimpan'); }}
      className="rounded-panel border border-line bg-white px-5 pt-6">
      <DynamicForm sections={sections} value={f.value} onChange={f.setValue} errors={f.errors} />
      <SaveBar saving={f.saving} note={note} label={label} />
    </form>
  );
}

export default function ProfilDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const { refresh } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(search.get('tab') || 'data');
  const [hapus, setHapus] = useState(false);

  const load = () => {
    setError(null);
    api.get(`/klien/profil/${id}`).then((r) => {
      const d = r.data;
      if (d.intakeAnak) d.intakeAnak = { ...d.intakeAnak, pendidikan_sosial: d.intakeAnak.pendidikanSosial || {} };
      setData(d);
    }).catch((e) => setError(e.message));
  };
  useEffect(load, [id]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Loading />;

  const isAnak = data.hubungan_akun === 'Anak';
  const tabs = [
    { value: 'data', label: 'Data diri' },
    { value: 'dewasa', label: 'Formulir identitas klien' },
    { value: 'anak', label: 'Formulir riwayat anak' },
    { value: 'keluarga', label: 'Susunan keluarga' },
    ...(!isAnak ? [{ value: 'lainnya', label: 'Organisasi & referensi' }] : []),
  ];

  return (
    <>
      <Link href="/klien/profil" className="text-sm text-ink-soft hover:text-ink">Profil & formulir</Link>
      <PageHeader title={data.nama_lengkap} description={`No. rekam psikologi ${data.nomor_rekam_psikologi || '-'}`}
        action={!isAnak ? null : <Button variant="ghost" size="sm" onClick={() => setHapus(true)}>Hapus profil</Button>} />

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'data' && (
        <FormSection sections={PROFIL_KLIEN} initial={data} label="Simpan data diri"
          save={async (body) => { const { hubungan_akun: _h, ...rest } = body; const r = await api.put(`/klien/profil/${id}`, rest); refresh(); load(); return r; }} />
      )}
      {tab === 'dewasa' && (
        <>
          <Alert type="info" className="mb-4">Wajib diisi untuk layanan dewasa (psikotes umum, minat bakat, rekrutmen, konseling). Centang pernyataan di bagian akhir agar dapat memesan layanan.</Alert>
          <FormSection sections={INTAKE_DEWASA} initial={data.intakeDewasa} label="Simpan formulir"
            save={async (body) => { const r = await api.put(`/klien/profil/${id}/intake-dewasa`, body); load(); return r; }} />
        </>
      )}
      {tab === 'anak' && (
        <>
          <Alert type="info" className="mb-4">Diisi oleh orang tua/wali untuk layanan tes psikologi anak. Data orang tua dan saudara diisi di tab Susunan keluarga.</Alert>
          <FormSection sections={INTAKE_ANAK} initial={data.intakeAnak} label="Simpan formulir"
            save={async (body) => { const r = await api.put(`/klien/profil/${id}/intake-anak`, body); load(); return r; }} />
        </>
      )}
      {tab === 'keluarga' && (
        <div className="rounded-panel border border-line bg-white p-5">
          <ChildList idKlien={id} jenis="keluarga" sections={KELUARGA} judul="Anggota keluarga" pk="id_keluarga" tambahLabel="Tambah anggota"
            defaults={{ kategori: isAnak ? 'Ayah' : 'Pasangan', masih_hidup: true }}
            ringkas={(r) => (
              <>
                <p className="font-medium">{r.nama} <span className="font-normal text-ink-soft">({KELUARGA_LABEL[r.kategori]}{r.status_hubungan ? `, ${r.status_hubungan.toLowerCase()}` : ''})</span></p>
                <p className="text-[13px] text-ink-faint">{[r.usia && `${r.usia}`, r.pendidikan, r.pekerjaan, !r.masih_hidup && 'sudah meninggal'].filter(Boolean).join(', ') || '-'}</p>
              </>
            )} />
        </div>
      )}
      {tab === 'lainnya' && (
        <div className="space-y-8 rounded-panel border border-line bg-white p-5">
          <ChildList idKlien={id} jenis="organisasi" sections={ORGANISASI} judul="Riwayat organisasi" pk="id_organisasi"
            ringkas={(r) => <><p className="font-medium">{r.nama_organisasi}</p><p className="text-[13px] text-ink-faint">{[r.jenis_organisasi, r.jabatan, r.tahun].filter(Boolean).join(', ')}</p></>} />
          <ChildList idKlien={id} jenis="referensi" sections={REFERENSI} judul="Referensi" pk="id_referensi"
            ringkas={(r) => <><p className="font-medium">{r.nama}</p><p className="text-[13px] text-ink-faint">{[r.hubungan, r.jabatan, r.alamat_telepon].filter(Boolean).join(', ')}</p></>} />
        </div>
      )}

      <ConfirmDialog open={hapus} onClose={() => setHapus(false)} title="Hapus profil ini?" variant="danger" confirmLabel="Hapus profil"
        onConfirm={async () => {
          try { await api.del(`/klien/profil/${id}`); toast('Profil dihapus'); refresh(); router.replace('/klien/profil'); } catch (e) { toast(e.message, 'error'); setHapus(false); }
        }}>
        Profil yang sudah memiliki riwayat sesi tidak dapat dihapus.
      </ConfirmDialog>
    </>
  );
}
