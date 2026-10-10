'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Field';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { tanggal } from '@/lib/format';
import { hitungUsia } from '@/lib/usia';

export default function KlienAdminPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useApi('/admin/klien', { q, page, limit: 15 });
  return (
    <>
      <PageHeader title="Klien" description="Data klien terpusat. Satu akun dapat memiliki beberapa profil (mis. orang tua dan anak)." />
      <Input className="mb-4 max-w-md" aria-label="Cari klien" placeholder="Cari nama, no. rekam psikologi, atau no. HP" maxLength={100} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_klien" rows={data} empty="Klien tidak ditemukan." onRowClick={(k) => router.push(`/admin/klien/${k.id_klien}`)}
            columns={[
              { key: 'nama', label: 'Nama', render: (k) => <><span className="block font-medium">{k.nama_lengkap}</span><span className="text-[13px] text-ink-faint">{k.nomor_rekam_psikologi}</span></> },
              { key: 'profil', label: 'Profil', render: (k) => (k.hubungan_akun === 'Diri Sendiri' ? 'Pemilik akun' : k.hubungan_akun) },
              { key: 'usia', label: 'Usia', render: (k) => hitungUsia(k.tanggal_lahir) || '-' },
              { key: 'kontak', label: 'Kontak', render: (k) => <><span className="block">{k.akun?.email}</span><span className="text-[13px] text-ink-soft">{k.no_hp || ''}</span></> },
              { key: 'sesi', label: 'Sesi', className: 'tabular', render: (k) => k.jumlah_sesi },
              { key: 'daftar', label: 'Terdaftar', render: (k) => tanggal(k.created_at) },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
    </>
  );
}
