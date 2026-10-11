'use client';

/**
 * Formulir dari definisi (DynamicForm) dengan umpan balik simpan yang jelas:
 * setelah tersimpan data dimuat ulang dari server (indikator memuat), lalu tampil penanda waktu simpan;
 * perubahan yang belum disimpan ditandai; bila ada kolom bermasalah, halaman bergulir ke kolom tersebut.
 * Dipakai profil & formulir klien serta catatan klinis psikolog.
 */
import { useEffect, useRef, useState } from 'react';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import DynamicForm from './DynamicForm';
import SaveBar from './SaveBar';
import { useFormSubmit } from './useForm';
import { pickFields } from '@/lib/form-defs';

const jamSekarang = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export default function FormSimpan({
  sections, initial, save, onReload, label = 'Simpan', note = 'Kolom bertanda * wajib diisi.', pesanSukses = 'Data berhasil disimpan',
  disabled = false, className = '',
}) {
  const f = useFormSubmit(initial || {});
  const ref = useRef(null);
  const [memuat, setMemuat] = useState(false);
  const [tersimpan, setTersimpan] = useState(null);
  const [berubah, setBerubah] = useState(false);
  useEffect(() => { f.setValue(initial || {}); }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!Object.keys(f.errors).length) return;
    const el = ref.current?.querySelector('[aria-invalid="true"]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  }, [f.errors]);

  const kirim = async (e) => {
    e.preventDefault();
    const ok = await f.submit(() => save(pickFields(sections, f.value)), pesanSukses);
    if (!ok) return;
    setMemuat(true);
    try { await onReload?.(); } finally { setMemuat(false); }
    setTersimpan(jamSekarang()); setBerubah(false);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <form ref={ref} onSubmit={kirim} className={`relative scroll-mt-24 ${className}`}>
      {tersimpan && !berubah && <Alert type="success" className="mb-6" title={`Data tersimpan pukul ${tersimpan}`}>Isian di bawah adalah data terbaru yang tersimpan di sistem.</Alert>}
      {tersimpan && berubah && <Alert type="warning" className="mb-6">Ada perubahan yang belum disimpan.</Alert>}
      {f.error && <Alert type="error" className="mb-6">{f.error}</Alert>}
      <DynamicForm sections={sections} value={f.value} onChange={(v) => { f.setValue(v); setBerubah(true); }} errors={f.errors} disabled={disabled} />
      {!disabled && <SaveBar saving={f.saving || memuat} note={note} label={label} />}
      {memuat && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-panel bg-white/70">
          <Spinner label="Memuat ulang data tersimpan" />
        </div>
      )}
    </form>
  );
}
