'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import DynamicForm from '@/components/form/DynamicForm';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { tanggal } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';

const PROFIL_BARU = [{ judul: 'Data anak / anggota keluarga', fields: [
  { name: 'hubungan_akun', label: 'Hubungan dengan Anda', type: 'select', required: true, options: [{ value: 'Anak', label: 'Anak' }, { value: 'Lainnya', label: 'Lainnya' }] },
  { name: 'nama_lengkap', label: 'Nama lengkap', required: true, max: 150 },
  { name: 'jenis_kelamin', label: 'Jenis kelamin', type: 'select', required: true, options: ['Laki-laki', 'Perempuan'] },
  { name: 'tempat_lahir', label: 'Tempat lahir', required: true, max: 100 },
  { name: 'tanggal_lahir', label: 'Tanggal lahir', type: 'date', required: true, maxToday: true },
] }];

export default function ProfilListPage() {
  const { data, error, loading, reload } = useApi('/klien/profil');
  const { refresh } = useAuth();
  const form = useFormSubmit({ hubungan_akun: 'Anak' });
  const [open, setOpen] = useState(false);

  const simpan = async (e) => {
    e.preventDefault();
    const ok = await form.submit(() => api.post('/klien/profil', form.value), 'Profil ditambahkan');
    if (ok) { setOpen(false); form.setValue({ hubungan_akun: 'Anak' }); reload(); refresh(); }
  };

  return (
    <>
      <PageHeader title="Profil & formulir"
        description="Lengkapi data diri dan formulir sebelum memesan layanan. Orang tua dapat menambahkan profil anak yang akan diperiksa."
        action={<Button variant="secondary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Tambah profil anak</Button>} />
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <ul className="divide-y divide-line">
            {data.map((p) => (
              <li key={p.id_klien}>
                <Link href={`/klien/profil/${p.id_klien}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-mist/60">
                  <div>
                    <p className="font-semibold">{p.nama_lengkap}</p>
                    <p className="text-[13px] text-ink-soft">No. rekam psikologi {p.nomor_rekam_psikologi || '-'}{p.tanggal_lahir ? `, lahir ${tanggal(p.tanggal_lahir)}` : ''}</p>
                  </div>
                  <Badge tone={p.hubungan_akun === 'Diri Sendiri' ? 'violet' : 'neutral'}>{p.hubungan_akun === 'Diri Sendiri' ? 'Profil utama' : p.hubungan_akun}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah profil" size="lg">
        <form onSubmit={simpan}>
          <DynamicForm sections={PROFIL_BARU} value={form.value} onChange={form.setValue} errors={form.errors} />
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" loading={form.saving}>Tambah profil</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
