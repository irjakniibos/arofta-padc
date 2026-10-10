'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Field';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { rupiah, tanggal, jam } from '@/lib/format';

const TABS = ['Menunggu Verifikasi', 'Menunggu Pembayaran', 'Ditolak', 'Lunas', 'Batal'];
const BELUM_LUNAS = ['Menunggu Verifikasi', 'Menunggu Pembayaran', 'Ditolak'];

function waktu(dt) { return dt ? new Date(String(dt).replace(' ', 'T')).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'; }

/** Ubah nominal tagihan dalam dua langkah: isi nominal & alasan, lalu konfirmasi. */
function UbahNominal({ row, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ total_bayar: String(Number(row.total_bayar)), alasan_ubah_nominal: '' });
  const [fieldErr, setFieldErr] = useState({});
  const [yakin, setYakin] = useState(false);
  const [saving, setSaving] = useState(false);
  const baru = Number(form.total_bayar);
  const valid = form.total_bayar !== '' && baru >= 0 && baru !== Number(row.total_bayar) && form.alasan_ubah_nominal.trim();

  const simpan = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/pembayaran/${row.id_pembayaran}/nominal`, { total_bayar: baru, alasan_ubah_nominal: form.alasan_ubah_nominal.trim() });
      toast('Nominal tagihan diperbarui, klien diberi tahu');
      onDone();
    } catch (e) {
      toast(e.message, 'error'); setFieldErr(e.fieldErrors?.() || {}); setYakin(false);
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={yakin ? 'Yakin mengubah nominal?' : 'Ubah nominal tagihan'} size="sm"
      footer={yakin ? (
        <>
          <Button variant="secondary" onClick={() => setYakin(false)}>Kembali</Button>
          <Button loading={saving} onClick={simpan}>Ya, ubah nominal</Button>
        </>
      ) : (
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button disabled={!valid} onClick={() => setYakin(true)}>Lanjutkan</Button>
        </>
      )}>
      {yakin ? (
        <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft">
          <p>Tagihan {row.sesi?.kode_booking} ({row.sesi?.klien?.nama_lengkap}) berubah dari <span className="font-semibold text-ink">{rupiah(row.total_bayar)}</span> menjadi <span className="font-semibold text-ink">{rupiah(baru)}</span>.</p>
          <p>Alasan: {form.alasan_ubah_nominal}</p>
          <Alert type="warning">Klien menerima notifikasi perubahan ini. Fee psikolog tidak berubah karena mengikuti tarif layanan.</Alert>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">Harga layanan {rupiah(row.harga_layanan ?? row.total_bayar)}. Nominal saat ini {rupiah(row.total_bayar)}.</p>
          <Input label="Nominal baru (Rp)" type="number" inputMode="numeric" min={0} required value={form.total_bayar}
            onChange={(e) => setForm({ ...form, total_bayar: e.target.value })} error={fieldErr.total_bayar} />
          <Input label="Alasan perubahan" required maxLength={255} placeholder="Contoh: diskon mahasiswa" value={form.alasan_ubah_nominal}
            onChange={(e) => setForm({ ...form, alasan_ubah_nominal: e.target.value })} error={fieldErr.alasan_ubah_nominal}
            hint="Dicatat di audit log dan dikirim ke klien." />
        </div>
      )}
    </Modal>
  );
}

export default function PembayaranPage() {
  const toast = useToast();
  const [status, setStatus] = useState(TABS[0]);
  const [page, setPage] = useState(1);
  const [aksi, setAksi] = useState(null); // { row, jenis }
  const [nominal, setNominal] = useState(null);
  const { data, meta, error, loading, reload } = useApi('/admin/pembayaran', { status, page, limit: 15 });

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
        description="Cocokkan konfirmasi klien dengan foto bukti transfer di WhatsApp admin dan mutasi rekening, lalu tandai lunas atau tolak." />
      <Tabs className="mb-4" value={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={TABS} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <Panel>
          <Table rowKey="id_pembayaran" rows={data} empty="Tidak ada pembayaran pada status ini." minWidth={880}
            columns={[
              { key: 'kode', label: 'Booking', render: (p) => <Link href={`/admin/sesi/${p.sesi?.id_sesi}`} className="font-medium hover:text-violet-deep">{p.sesi?.kode_booking}</Link> },
              { key: 'klien', label: 'Klien', render: (p) => <><span className="block">{p.sesi?.klien?.nama_lengkap}</span><span className="text-[13px] text-ink-faint">{p.sesi?.klien?.no_hp || ''}</span></> },
              { key: 'layanan', label: 'Layanan & jadwal', render: (p) => <><span className="block">{p.sesi?.layanan?.nama_layanan}</span><span className="text-[13px] text-ink-soft">{tanggal(p.sesi?.tanggal)}, {jam(p.sesi?.waktu)}</span></> },
              { key: 'nominal', label: 'Nominal', render: (p) => (
                <>
                  <span className="block font-semibold tabular">{rupiah(p.total_bayar)}</span>
                  {p.alasan_ubah_nominal && <span className="block text-[13px] text-ink-faint" title={p.alasan_ubah_nominal}>Diubah: {p.alasan_ubah_nominal}</span>}
                  {status === 'Lunas' && <span className="block text-[13px] text-ink-faint">{p.metode_bayar}</span>}
                </>
              ) },
              { key: 'waktu', label: status === 'Menunggu Pembayaran' || status === 'Ditolak' ? 'Batas bayar' : 'Dikonfirmasi', render: (p) => <span className="text-[13px]">{waktu(status === 'Menunggu Pembayaran' || status === 'Ditolak' ? p.batas_bayar : p.tanggal_konfirmasi || p.updated_at)}</span> },
              { key: 'aksi', label: '', render: (p) => (BELUM_LUNAS.includes(p.status_pembayaran) && p.sesi?.status_asesmen !== 'Batal' ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button size="sm" onClick={() => setAksi({ row: p, jenis: 'Lunas' })}>Lunas</Button>
                  {p.status_pembayaran !== 'Ditolak' && <Button size="sm" variant="secondary" onClick={() => setAksi({ row: p, jenis: 'Ditolak' })}>Tolak</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setNominal(p)}>Ubah nominal</Button>
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
        {aksi && <>{aksi.row.sesi?.kode_booking}, {aksi.row.sesi?.klien?.nama_lengkap}, {rupiah(aksi.row.total_bayar)}. {aksi.jenis === 'Lunas' ? 'Pastikan dana sudah masuk ke rekening. Sesi menjadi terkonfirmasi dan psikolog diberi tahu.' : 'Klien mendapat batas bayar baru dan dapat mengonfirmasi ulang.'}</>}
      </ConfirmDialog>
      {nominal && <UbahNominal row={nominal} onClose={() => setNominal(null)} onDone={() => { setNominal(null); reload(); }} />}
    </>
  );
}
