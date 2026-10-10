'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { rupiah, tanggal, jam } from '@/lib/format';

const TABS = ['Menunggu Verifikasi', 'Menunggu Pembayaran', 'Ditolak', 'Lunas', 'Batal'];

function waktu(dt) { return dt ? new Date(String(dt).replace(' ', 'T')).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'; }

export default function PembayaranPage() {
  const toast = useToast();
  const [status, setStatus] = useState(TABS[0]);
  const [page, setPage] = useState(1);
  const [aksi, setAksi] = useState(null); // { row, jenis }
  const { data, meta, error, loading, reload } = useApi('/admin/pembayaran', { status, page, limit: 15 });
  const { data: info } = useApi('/info-pembayaran');

  const verifikasi = async (alasan) => {
    try {
      await api.patch(`/admin/pembayaran/${aksi.row.id_pembayaran}/verifikasi`, { status: aksi.jenis, catatan_admin: alasan || undefined });
      toast(aksi.jenis === 'Lunas' ? 'Pembayaran diverifikasi, klien dan psikolog diberi tahu' : 'Pembayaran ditolak, klien diberi tahu');
      setAksi(null); reload();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <PageHeader title="Verifikasi pembayaran"
        description="Cocokkan konfirmasi klien dengan bukti transfer di Google Form dan mutasi rekening, lalu tandai lunas atau tolak."
        action={info?.link_form_bukti_bayar && info.link_form_bukti_bayar !== '-' && (
          <a href={info.link_form_bukti_bayar} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-control border border-violet-line bg-white px-4 text-sm font-semibold text-violet-deep hover:bg-violet-tint">
            Buka Google Form bukti<ExternalLink className="h-4 w-4" />
          </a>
        )} />
      <Tabs className="mb-4" value={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={TABS} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_pembayaran" rows={data} empty="Tidak ada pembayaran pada status ini." minWidth={820}
            columns={[
              { key: 'kode', label: 'Booking', render: (p) => <Link href={`/admin/sesi/${p.sesi?.id_sesi}`} className="font-medium hover:text-violet-deep">{p.sesi?.kode_booking}</Link> },
              { key: 'klien', label: 'Klien', render: (p) => <><span className="block">{p.sesi?.klien?.nama_lengkap}</span><span className="text-[13px] text-ink-faint">{p.sesi?.klien?.no_hp || ''}</span></> },
              { key: 'layanan', label: 'Layanan & jadwal', render: (p) => <><span className="block">{p.sesi?.layanan?.nama_layanan}</span><span className="text-[13px] text-ink-soft">{tanggal(p.sesi?.tanggal)}, {jam(p.sesi?.waktu)}</span></> },
              { key: 'nominal', label: 'Nominal', className: 'font-semibold tabular', render: (p) => rupiah(p.total_bayar) },
              { key: 'waktu', label: status === 'Menunggu Pembayaran' ? 'Batas bayar' : 'Dikonfirmasi', render: (p) => <span className="text-[13px]">{waktu(status === 'Menunggu Pembayaran' ? p.batas_bayar : p.tanggal_konfirmasi || p.updated_at)}</span> },
              { key: 'aksi', label: '', render: (p) => (['Menunggu Verifikasi', 'Menunggu Pembayaran', 'Ditolak'].includes(p.status_pembayaran) && p.sesi?.status_asesmen !== 'Batal' ? (
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => setAksi({ row: p, jenis: 'Lunas' })}>Lunas</Button>
                  {p.status_pembayaran !== 'Ditolak' && <Button size="sm" variant="secondary" onClick={() => setAksi({ row: p, jenis: 'Ditolak' })}>Tolak</Button>}
                </div>
              ) : <span className="flex justify-end"><Badge status={p.status_pembayaran} /></span>) },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </Panel>
      )}
      <ConfirmDialog open={!!aksi} onClose={() => setAksi(null)} onConfirm={verifikasi}
        title={aksi?.jenis === 'Lunas' ? 'Tandai pembayaran lunas?' : 'Tolak pembayaran?'}
        confirmLabel={aksi?.jenis === 'Lunas' ? 'Tandai lunas' : 'Tolak pembayaran'} variant={aksi?.jenis === 'Lunas' ? 'primary' : 'danger'}
        withReason={aksi?.jenis === 'Ditolak'} reasonLabel="Alasan penolakan (dikirim ke klien)">
        {aksi && <>{aksi.row.sesi?.kode_booking}, {aksi.row.sesi?.klien?.nama_lengkap}, {rupiah(aksi.row.total_bayar)}. {aksi.jenis === 'Lunas' ? 'Sesi menjadi terkonfirmasi dan psikolog diberi tahu.' : 'Klien dapat memperbaiki bukti dan konfirmasi ulang.'}</>}
      </ConfirmDialog>
    </>
  );
}
