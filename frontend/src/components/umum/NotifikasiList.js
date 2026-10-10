'use client';

/** Daftar notifikasi (dipakai semua role). */
import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Tabs from '@/components/ui/Tabs';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

function waktu(dt) {
  if (!dt) return '';
  const d = new Date(String(dt).replace(' ', 'T'));
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotifikasiList({ sesiHref }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('semua');
  const { data, meta, error, loading, reload } = useApi('/notifikasi', { page, limit: 15, belum_dibaca: filter === 'baru' ? 'true' : undefined });

  const baca = async (n) => {
    if (n.is_read) return;
    try { await api.patch(`/notifikasi/${n.id_notifikasi}/baca`); reload(); } catch { /* abaikan */ }
  };
  const bacaSemua = async () => {
    try { await api.patch('/notifikasi/baca-semua'); toast('Semua notifikasi ditandai dibaca'); reload(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <PageHeader title="Notifikasi" description="Pemberitahuan jadwal, pembayaran, tautan sesi, dan laporan."
        action={meta?.belum_dibaca > 0 && <Button variant="secondary" onClick={bacaSemua}>Tandai semua dibaca</Button>} />
      <Tabs className="mb-4" value={filter} onChange={(v) => { setFilter(v); setPage(1); }}
        tabs={[{ value: 'semua', label: 'Semua' }, { value: 'baru', label: 'Belum dibaca', count: meta?.belum_dibaca }]} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          {data.length === 0 ? <p className="px-5 py-10 text-center text-sm text-ink-faint">Tidak ada notifikasi.</p> : (
            <ul className="divide-y divide-line">
              {data.map((n) => (
                <li key={n.id_notifikasi} className={`flex gap-4 px-5 py-4 ${n.is_read ? '' : 'bg-violet-tint/40'}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-transparent' : 'bg-violet'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className={`text-[15px] ${n.is_read ? '' : 'font-semibold'}`}>{n.judul}</p>
                      <span className="text-[12px] text-ink-faint">{waktu(n.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{n.pesan}</p>
                    <div className="mt-2 flex gap-4 text-[13px]">
                      {n.id_sesi && sesiHref && <Link href={`${sesiHref}/${n.id_sesi}`} onClick={() => baca(n)} className="font-semibold text-violet-deep hover:underline">Lihat sesi</Link>}
                      {!n.is_read && <button type="button" onClick={() => baca(n)} className="text-ink-soft hover:text-ink">Tandai dibaca</button>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
    </>
  );
}
