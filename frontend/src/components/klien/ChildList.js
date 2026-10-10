'use client';

/** Daftar data turunan profil (keluarga / organisasi / referensi) dengan tambah, ubah, hapus. */
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DynamicForm from '@/components/form/DynamicForm';
import { useFormSubmit } from '@/components/form/useForm';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { pickFields } from '@/lib/form-defs';
import { useToast } from '@/components/ui/Toast';
import { Loading, ErrorState } from '@/components/ui/DataState';

/** `apiBase` = alamat profil klien di API, mis. /klien/profil/12 (klien) atau /admin/klien/12 (admin). */
export default function ChildList({ apiBase, jenis, sections, judul, pk, ringkas, defaults = {}, tambahLabel }) {
  const base = `${apiBase}/${jenis}`;
  const { data, error, loading, reload } = useApi(base);
  const toast = useToast();
  const form = useFormSubmit();
  const [edit, setEdit] = useState(null); // null | 'baru' | row
  const [hapus, setHapus] = useState(null);

  const buka = (row) => { form.setValue(row === 'baru' ? { ...defaults } : { ...row }); setEdit(row); };
  const simpan = async (e) => {
    e.preventDefault();
    const body = pickFields(sections, form.value);
    const ok = await form.submit(() => (edit === 'baru' ? api.post(base, body) : api.put(`${base}/${edit[pk]}`, body)), 'Data tersimpan');
    if (ok) { setEdit(null); reload(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-semibold">{judul}</h3>
        <Button size="sm" variant="secondary" onClick={() => buka('baru')}><Plus className="h-4 w-4" />{tambahLabel || 'Tambah'}</Button>
      </div>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (data.length === 0 ? <p className="mt-3 text-sm text-ink-faint">Belum ada data.</p> : (
        <ul className="mt-3 divide-y divide-line rounded-panel border border-line bg-white">
          {data.map((r) => (
            <li key={r[pk]} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="text-sm">{ringkas(r)}</div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => buka(r)} className="rounded-control p-1.5 text-ink-soft hover:bg-mist" aria-label="Ubah"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => setHapus(r)} className="rounded-control p-1.5 text-danger hover:bg-danger-tint" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      ))}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'baru' ? `Tambah ${judul.toLowerCase()}` : `Ubah ${judul.toLowerCase()}`} size="lg">
        <form onSubmit={simpan}>
          <DynamicForm sections={sections} value={form.value} onChange={form.setValue} errors={form.errors} />
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEdit(null)}>Batal</Button>
            <Button type="submit" loading={form.saving}>Simpan</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!hapus} onClose={() => setHapus(null)} title="Hapus data?" variant="danger" confirmLabel="Hapus"
        onConfirm={async () => {
          try { await api.del(`${base}/${hapus[pk]}`); toast('Data dihapus'); setHapus(null); reload(); } catch (e) { toast(e.message, 'error'); }
        }}>
        Data ini akan dihapus dari profil.
      </ConfirmDialog>
    </div>
  );
}
