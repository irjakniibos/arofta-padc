'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ProfilEditor, { normalisasiProfil } from '@/components/klien/ProfilEditor';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ProfilDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const { refresh } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hapus, setHapus] = useState(false);

  const load = () => {
    setError(null);
    return api.get(`/klien/profil/${id}`).then((r) => setData(normalisasiProfil(r.data))).catch((e) => setError(e.message));
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Loading />;

  return (
    <>
      <Link href="/klien/profil" className="text-sm text-ink-soft hover:text-ink">Profil & formulir</Link>
      <PageHeader title={data.nama_lengkap} description={`No. rekam psikologi ${data.nomor_rekam_psikologi || '-'}`}
        action={data.hubungan_akun !== 'Anak' ? null : <Button variant="ghost" size="sm" onClick={() => setHapus(true)}>Hapus profil</Button>} />

      <ProfilEditor data={data} apiBase={`/klien/profil/${id}`} tabAwal={search.get('tab') || 'data'} onSaved={() => { refresh(); return load(); }} />

      <ConfirmDialog open={hapus} onClose={() => setHapus(false)} title="Hapus profil ini?" variant="danger" confirmLabel="Hapus profil"
        onConfirm={async () => {
          try { await api.del(`/klien/profil/${id}`); toast('Profil dihapus'); refresh(); router.replace('/klien/profil'); } catch (e) { toast(e.message, 'error'); setHapus(false); }
        }}>
        Profil yang sudah memiliki riwayat sesi tidak dapat dihapus.
      </ConfirmDialog>
    </>
  );
}
