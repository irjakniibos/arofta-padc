'use client';

import { useEffect, useRef, useState } from 'react'; // FOTO: tambah useRef, useState
import PageHeader from '@/components/layout/PageHeader';
import DynamicForm from '@/components/form/DynamicForm';
import SaveBar from '@/components/form/SaveBar';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { API_URL } from '@/lib/config'; // FOTO
import { pickFields } from '@/lib/form-defs';
import { useAuth } from '@/lib/auth-context';

const PROFIL = [{ judul: 'Profil profesional', keterangan: 'Ditampilkan di halaman Tim psikolog dan saat klien memesan jadwal. SIPP dan STR diubah oleh admin.', fields: [
  { name: 'nama_lengkap', label: 'Nama lengkap dan gelar', required: true, max: 150, hint: 'Tercetak di laporan hasil, contoh: Nama, M.Psi., Psikolog' },
  { name: 'spesialisasi', label: 'Spesialisasi', max: 150 },
  { name: 'pengalaman_tahun', label: 'Pengalaman (tahun)', type: 'number', maxValue: 60 },
  { name: 'no_hp', label: 'Nomor HP', type: 'tel', max: 16 },
  { name: 'profil_singkat', label: 'Profil singkat', type: 'textarea', rows: 5, max: 2000 },
] }];

const FOTO_MAX_BYTES = 2 * 1024 * 1024; // FOTO
const FOTO_EXT = ['.jpg', '.jpeg', '.png']; // FOTO

export default function ProfilPsikologPage() {
  const { data, error, loading, reload } = useApi('/psikolog/profil');
  const { refresh } = useAuth();
  const f = useFormSubmit({});
  const fotoInput = useRef(null); // FOTO
  const [fotoBusy, setFotoBusy] = useState(false); // FOTO
  const [fotoErr, setFotoErr] = useState(''); // FOTO
  useEffect(() => { if (data) f.setValue(data); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // FOTO: pilih dan unggah
  async function pilihFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!FOTO_EXT.includes(ext)) return setFotoErr('Format foto harus JPG atau PNG');
    if (file.size > FOTO_MAX_BYTES) return setFotoErr('Ukuran foto maksimal 2 MB');
    setFotoErr('');
    setFotoBusy(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      await api.put('/psikolog/profil/foto', fd);
      reload();
      refresh();
    } catch (ex) {
      setFotoErr(ex.message || 'Gagal mengunggah foto');
    } finally {
      setFotoBusy(false);
    }
  }

  // FOTO: hapus
  async function hapusFoto() {
    if (!window.confirm('Hapus foto profil?')) return;
    setFotoErr('');
    setFotoBusy(true);
    try {
      await api.del('/psikolog/profil/foto');
      reload();
      refresh();
    } catch (ex) {
      setFotoErr(ex.message || 'Gagal menghapus foto');
    } finally {
      setFotoBusy(false);
    }
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const fotoSrc = data.punya_foto ? `${API_URL}/public/psikolog/${data.id_psikolog}/foto?v=${data.foto_versi}` : null; // FOTO
  const btn = 'rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60'; // FOTO

  return (
    <>
      <PageHeader title="Profil" description={`${data.akun?.email}. SIPP ${data.sipp || '-'}${data.str ? `, STR ${data.str}` : ''}`} />

      {/* FOTO: kartu foto profil */}
      <div className="mb-6 flex flex-col gap-5 rounded-panel border border-line bg-white p-5 sm:flex-row sm:items-center">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-mist text-center text-xs text-ink-faint">
          {fotoSrc ? <img src={fotoSrc} alt="Foto profil psikolog" className="h-full w-full object-cover" /> : 'Belum ada foto'}
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold">Foto profil</h2>
          <p className="mt-1 text-sm text-ink-soft">JPG atau PNG, maksimal 2 MB. Ditampilkan di halaman Tim psikolog dan saat klien memesan jadwal.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input ref={fotoInput} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={pilihFoto} />
            <button type="button" disabled={fotoBusy} onClick={() => fotoInput.current?.click()} className={`${btn} bg-ink text-white`}>
              {fotoBusy ? 'Memproses...' : data.punya_foto ? 'Ganti foto' : 'Unggah foto'}
            </button>
            {data.punya_foto && (
              <button type="button" disabled={fotoBusy} onClick={hapusFoto} className={`${btn} border border-line bg-white`}>
                Hapus foto
              </button>
            )}
          </div>
          {fotoErr && <p role="alert" className="mt-2 text-sm text-red-600">{fotoErr}</p>}
        </div>
      </div>

      <form className="rounded-panel border border-line bg-white px-5 pt-6"
        onSubmit={async (e) => { e.preventDefault(); const ok = await f.submit(() => api.put('/psikolog/profil', pickFields(PROFIL, f.value)), 'Profil tersimpan'); if (ok) refresh(); }}>
        <DynamicForm sections={PROFIL} value={f.value} onChange={f.setValue} errors={f.errors} />
        <SaveBar saving={f.saving} />
      </form>
    </>
  );
}