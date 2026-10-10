'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import StatStrip from '@/components/dashboard/StatStrip';
import Tabs from '@/components/ui/Tabs';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Field';
import DynamicForm from '@/components/form/DynamicForm';
import { useFormSubmit } from '@/components/form/useForm';
import PeriodeBulan from '@/components/umum/PeriodeBulan';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { rupiah, tanggal, isoLokal } from '@/lib/format';
import { pickFields } from '@/lib/form-defs';
import { PENGELUARAN } from '@/lib/form-defs-admin';

const now = new Date();

function Ringkasan({ p }) {
  const { data, error, loading, reload } = useApi('/admin/laporan-keuangan', p);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <StatStrip items={[
        { label: 'Pemasukan', value: rupiah(data.pemasukan) },
        { label: 'Pengeluaran', value: rupiah(data.pengeluaran.total) },
        { label: data.surplus < 0 ? 'Defisit' : 'Surplus', value: <span className={data.surplus < 0 ? 'text-danger' : ''}>{rupiah(data.surplus)}</span> },
        { label: 'Fee belum dicairkan', value: rupiah(data.fee_belum_dicairkan) },
      ]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Pemasukan per layanan">
          <Table minWidth={420} rowKey="nama_layanan" rows={data.rincian_pemasukan_per_layanan} empty="Belum ada pembayaran lunas pada periode ini."
            columns={[
              { key: 'nama_layanan', label: 'Layanan' },
              { key: 'n', label: 'Transaksi', className: 'tabular', render: (r) => r.jumlah_transaksi },
              { key: 't', label: 'Total', className: 'tabular', render: (r) => rupiah(r.total) },
            ]} />
        </Panel>
        <Panel title="Pengeluaran">
          <dl className="divide-y divide-line text-sm">
            <div className="flex justify-between px-5 py-3"><dt>Fee psikolog dicairkan</dt><dd className="tabular">{rupiah(data.pengeluaran.fee_psikolog)}</dd></div>
            {data.rincian_pengeluaran_per_kategori.map((k) => (
              <div key={k.kategori} className="flex justify-between px-5 py-3"><dt>{k.kategori}</dt><dd className="tabular">{rupiah(k.total)}</dd></div>
            ))}
            <div className="flex justify-between px-5 py-3 font-semibold"><dt>Total</dt><dd className="tabular">{rupiah(data.pengeluaran.total)}</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}

function DaftarPengeluaran({ p }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useApi('/admin/pengeluaran', { ...p, page, limit: 20 });
  const f = useFormSubmit({});
  const [edit, setEdit] = useState(null);
  const [hapus, setHapus] = useState(null);
  const buka = (row) => { f.setValue(row === 'baru' ? { tanggal: isoLokal() } : { ...row, nominal: Number(row.nominal) }); setEdit(row); };
  const simpan = async (e) => {
    e.preventDefault();
    const body = pickFields(PENGELUARAN, f.value);
    const ok = await f.submit(() => (edit === 'baru' ? api.post('/admin/pengeluaran', body) : api.put(`/admin/pengeluaran/${edit.id_pengeluaran}`, body)), 'Pengeluaran tersimpan');
    if (ok) { setEdit(null); reload(); }
  };
  return (
    <Panel title="Pengeluaran operasional" action={<Button size="sm" onClick={() => buka('baru')}><Plus className="h-4 w-4" />Catat pengeluaran</Button>}>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <Table rowKey="id_pengeluaran" rows={data} empty="Belum ada pengeluaran pada periode ini."
            columns={[
              { key: 'tgl', label: 'Tanggal', render: (r) => tanggal(r.tanggal) },
              { key: 'kategori', label: 'Kategori', render: (r) => <><span className="block font-medium">{r.kategori}</span>{r.keterangan && <span className="text-[13px] text-ink-faint">{r.keterangan}</span>}</> },
              { key: 'nominal', label: 'Nominal', className: 'tabular', render: (r) => rupiah(r.nominal) },
              { key: 'oleh', label: 'Dicatat oleh', render: (r) => <span className="text-ink-soft">{r.pencatat?.email}</span> },
              { key: 'aksi', label: '', render: (r) => (
                <div className="flex justify-end gap-1">
                  <button type="button" onClick={() => buka(r)} className="rounded-control p-1.5 text-ink-soft hover:bg-mist" aria-label="Ubah"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setHapus(r)} className="rounded-control p-1.5 text-danger hover:bg-danger-tint" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                </div>) },
            ]} />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'baru' ? 'Catat pengeluaran' : 'Ubah pengeluaran'}>
        <form onSubmit={simpan}>
          <DynamicForm sections={PENGELUARAN} value={f.value} onChange={f.setValue} errors={f.errors} />
          <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEdit(null)}>Batal</Button><Button type="submit" loading={f.saving}>Simpan</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!hapus} onClose={() => setHapus(null)} title="Hapus pengeluaran?" variant="danger" confirmLabel="Hapus"
        onConfirm={async () => { try { await api.del(`/admin/pengeluaran/${hapus.id_pengeluaran}`); toast('Pengeluaran dihapus'); setHapus(null); reload(); } catch (e) { toast(e.message, 'error'); } }}>
        {hapus && `${hapus.kategori} sebesar ${rupiah(hapus.nominal)} pada ${tanggal(hapus.tanggal)} akan dihapus.`}
      </ConfirmDialog>
    </Panel>
  );
}

function Tahunan() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const { data, error, loading, reload } = useApi('/admin/laporan-keuangan/tahunan', { tahun });
  const th = now.getFullYear();
  const total = data?.bulan.reduce((a, b) => ({ pemasukan: a.pemasukan + b.pemasukan, pengeluaran: a.pengeluaran + b.pengeluaran, surplus: a.surplus + b.surplus }), { pemasukan: 0, pengeluaran: 0, surplus: 0 });
  return (
    <Panel title="Ringkasan tahunan" action={<Select aria-label="Tahun" value={String(tahun)} options={[th - 2, th - 1, th].map(String)} onChange={(e) => setTahun(Number(e.target.value))} />}>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="border-b border-line text-left text-[12px] text-ink-faint"><th className="px-5 py-2.5 font-medium">Bulan</th><th className="px-5 py-2.5 text-right font-medium">Pemasukan</th><th className="px-5 py-2.5 text-right font-medium">Pengeluaran</th><th className="px-5 py-2.5 text-right font-medium">Surplus</th></tr></thead>
            <tbody className="divide-y divide-line tabular">
              {data.bulan.map((b) => (
                <tr key={b.bulan}><td className="px-5 py-2.5">{b.nama_bulan}</td><td className="px-5 py-2.5 text-right">{rupiah(b.pemasukan)}</td><td className="px-5 py-2.5 text-right">{rupiah(b.pengeluaran)}</td><td className={`px-5 py-2.5 text-right ${b.surplus < 0 ? 'text-danger' : ''}`}>{rupiah(b.surplus)}</td></tr>
              ))}
            </tbody>
            <tfoot className="tabular font-semibold"><tr className="border-t-2 border-line"><td className="px-5 py-3">Total {data.tahun}</td><td className="px-5 py-3 text-right">{rupiah(total.pemasukan)}</td><td className="px-5 py-3 text-right">{rupiah(total.pengeluaran)}</td><td className={`px-5 py-3 text-right ${total.surplus < 0 ? 'text-danger' : ''}`}>{rupiah(total.surplus)}</td></tr></tfoot>
          </table>
        </div>
      )}
    </Panel>
  );
}

export default function KeuanganPage() {
  const [tab, setTab] = useState('bulanan');
  const [p, setP] = useState({ bulan: now.getMonth() + 1, tahun: now.getFullYear() });
  return (
    <>
      <PageHeader title="Keuangan" description="Pemasukan dihitung dari pembayaran yang sudah diverifikasi lunas. Pengeluaran mencakup fee psikolog yang dicairkan dan biaya operasional."
        action={tab !== 'tahunan' && <PeriodeBulan value={p} onChange={setP} />} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'bulanan', label: 'Laporan bulanan' }, { value: 'pengeluaran', label: 'Pengeluaran operasional' }, { value: 'tahunan', label: 'Ringkasan tahunan' }]} />
      {tab === 'bulanan' && <Ringkasan p={p} />}
      {tab === 'pengeluaran' && <DaftarPengeluaran p={p} />}
      {tab === 'tahunan' && <Tahunan />}
    </>
  );
}
