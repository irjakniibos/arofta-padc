'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Pagination from '@/components/ui/Pagination';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import UlasanItem from '@/components/umum/UlasanList';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';

export default function UlasanAdminPage() {
  const toast = useToast();
  const [tampil, setTampil] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const { data, meta, error, loading, reload } = useApi('/admin/ulasan', { page, limit: 15, is_tampil: tampil, rating });
  const ubah = async (u) => {
    setBusy(u.id_ulasan);
    try { await api.patch(`/admin/ulasan/${u.id_ulasan}/tampil`, { is_tampil: !u.is_tampil }); toast(u.is_tampil ? 'Ulasan disembunyikan dari halaman publik' : 'Ulasan ditampilkan kembali'); reload(); } catch (e) { toast(e.message, 'error'); } finally { setBusy(null); }
  };
  return (
    <>
      <PageHeader title="Ulasan klien" description="Ulasan tampil di profil psikolog pada situs publik dengan nama klien disamarkan. Sembunyikan ulasan yang tidak pantas atau memuat data pribadi." />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Tabs value={tampil} onChange={(v) => { setTampil(v); setPage(1); }} tabs={[{ value: '', label: 'Semua' }, { value: 'true', label: 'Tampil' }, { value: 'false', label: 'Disembunyikan' }]} />
        <Select aria-label="Filter rating" value={rating} placeholder="Semua rating" options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} bintang` }))} onChange={(e) => { setRating(e.target.value); setPage(1); }} />
      </div>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          {data.length === 0 ? <p className="px-5 py-10 text-center text-sm text-ink-faint">Belum ada ulasan.</p> : (
            <ul className="divide-y divide-line">
              {data.map((u) => (
                <UlasanItem key={u.id_ulasan} u={u} aksi={(
                  <div className="flex items-center gap-2">
                    {!u.is_tampil && <span className="text-[13px] text-ink-faint">Disembunyikan</span>}
                    <Button size="sm" variant={u.is_tampil ? 'secondary' : 'primary'} loading={busy === u.id_ulasan} onClick={() => ubah(u)}>{u.is_tampil ? 'Sembunyikan' : 'Tampilkan'}</Button>
                  </div>
                )} />
              ))}
            </ul>
          )}
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
    </>
  );
}
