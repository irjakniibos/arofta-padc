'use client';

import { Suspense, use, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import StatStrip from '@/components/dashboard/StatStrip';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { Textarea } from '@/components/ui/Field';
import PeriodeBulan from '@/components/umum/PeriodeBulan';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { rupiah, tanggal } from '@/lib/format';

function DetailFee({ id }) {
  const sp = useSearchParams();
  const now = new Date();
  const toast = useToast();
  const [p, setP] = useState({ bulan: Number(sp.get('bulan')) || now.getMonth() + 1, tahun: Number(sp.get('tahun')) || now.getFullYear() });
  const [page, setPage] = useState(1);
  const [pilih, setPilih] = useState([]);
  const [modal, setModal] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);
  const { data, error, loading, reload } = useApi(`/admin/fee/psikolog/${id}`, { ...p, page, limit: 50 });

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const belum = data.rows.filter((f) => f.status_distribusi === 'Belum Dibayar');
  const totalPilih = data.rows.filter((f) => pilih.includes(f.id_fee)).reduce((a, f) => a + Number(f.nominal_fee), 0);
  const toggle = (idFee) => setPilih((s) => (s.includes(idFee) ? s.filter((x) => x !== idFee) : [...s, idFee]));
  const semua = belum.length > 0 && belum.every((f) => pilih.includes(f.id_fee));

  const bayar = async () => {
    setSaving(true);
    try {
      const r = await api.patch('/admin/fee/bayar', { id_fee: pilih, catatan });
      toast(r.message || 'Pencairan fee tercatat'); setModal(false); setPilih([]); setCatatan(''); reload();
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <>
      <Link href="/admin/fee" className="text-sm text-ink-soft hover:text-ink">Fee psikolog</Link>
      <PageHeader title={data.psikolog.nama_lengkap} description={data.psikolog.no_hp ? `No. HP ${data.psikolog.no_hp}` : undefined}
        action={<PeriodeBulan value={p} onChange={(v) => { setP(v); setPage(1); setPilih([]); }} />} />
      <div className="space-y-6">
        <StatStrip items={[
          { label: 'Total fee periode ini', value: rupiah(data.ringkasan?.total_fee) },
          { label: 'Belum dicairkan', value: rupiah(data.ringkasan?.belum_dibayar) },
          { label: 'Dipilih untuk dicairkan', value: rupiah(totalPilih) },
        ]} />
        <Panel title="Rincian fee" action={<Button size="sm" disabled={!pilih.length} onClick={() => setModal(true)}>Catat pencairan ({pilih.length})</Button>}>
          <Table rowKey="id_fee" rows={data.rows} empty="Belum ada fee pada periode ini."
            columns={[
              { key: 'pilih', label: <input type="checkbox" aria-label="Pilih semua yang belum dicairkan" checked={semua} disabled={!belum.length} onChange={() => setPilih(semua ? [] : belum.map((f) => f.id_fee))} className="h-4 w-4 accent-violet" />,
                render: (f) => (f.status_distribusi === 'Belum Dibayar'
                  ? <input type="checkbox" aria-label={`Pilih fee ${f.id_fee}`} checked={pilih.includes(f.id_fee)} onChange={() => toggle(f.id_fee)} className="h-4 w-4 accent-violet" />
                  : null) },
              { key: 'sesi', label: 'Sesi', render: (f) => <><span className="block font-medium">{tanggal(f.sesi?.tanggal)}</span><span className="text-[13px] text-ink-faint">{f.sesi?.kode_booking}</span></> },
              { key: 'klien', label: 'Klien & layanan', render: (f) => <><span className="block">{f.sesi?.klien?.nama_lengkap}</span><span className="text-[13px] text-ink-soft">{f.sesi?.layanan?.nama_layanan}</span></> },
              { key: 'komponen', label: 'Komponen', render: (f) => f.kategori?.nama_kategori },
              { key: 'nominal', label: 'Nominal', className: 'tabular', render: (f) => rupiah(f.nominal_fee) },
              { key: 'status', label: 'Status', render: (f) => <><Badge status={f.status_distribusi} />{f.tanggal_pencairan && <span className="mt-1 block text-[12px] text-ink-faint">{tanggal(String(f.tanggal_pencairan).slice(0, 10))}</span>}</> },
            ]} />
          <Pagination meta={data.meta} onPage={setPage} />
        </Panel>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Catat pencairan fee">
        <p className="text-sm text-ink-soft">Pastikan transfer sebesar <span className="font-semibold text-ink tabular">{rupiah(totalPilih)}</span> ke {data.psikolog.nama_lengkap} sudah dilakukan. Psikolog akan menerima notifikasi.</p>
        <Textarea className="mt-4" label="Catatan (opsional)" rows={2} maxLength={500} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Mis. Transfer BSI 10/10" />
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(false)}>Batal</Button><Button loading={saving} onClick={bayar}>Tandai sudah dicairkan</Button></div>
      </Modal>
    </>
  );
}

export default function DetailFeePage({ params }) {
  const { id } = use(params);
  return <Suspense fallback={<Loading />}><DetailFee id={id} /></Suspense>;
}
