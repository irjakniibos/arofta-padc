'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DynamicForm from '@/components/form/DynamicForm';
import SaveBar from '@/components/form/SaveBar';
import { Select, Input } from '@/components/ui/Field';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { pickFields } from '@/lib/form-defs';
import { LAYANAN } from '@/lib/form-defs-admin';

function TarifFee({ layanan, onSaved }) {
  const toast = useToast();
  const [kategori, setKategori] = useState([]);
  const [rows, setRows] = useState(() => (layanan.tarifFee || []).map((t) => ({ id_kategori_fee: String(t.id_kategori_fee), nominal: Number(t.nominal) })));
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get('/admin/kategori-fee', { is_active: 'true' }).then((r) => setKategori(r.data)).catch(() => {}); }, []);
  const total = useMemo(() => rows.reduce((a, r) => a + (Number(r.nominal) || 0), 0), [rows]);
  const simpan = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/layanan/${layanan.id_layanan}/fee`, { items: rows.filter((r) => r.id_kategori_fee).map((r) => ({ id_kategori_fee: Number(r.id_kategori_fee), nominal: Number(r.nominal) || 0 })) });
      toast('Tarif fee tersimpan'); onSaved();
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Panel title="Tarif fee psikolog" action={<span className="text-sm text-ink-soft">Total per sesi <span className="font-semibold text-ink tabular">{rupiah(total)}</span></span>}>
      <div className="space-y-3 px-5 py-4">
        <p className="text-[13px] text-ink-faint">Fee dibuat otomatis untuk psikolog saat sesi layanan ini ditandai selesai.</p>
        {rows.map((r, i) => (
          <div key={i} className="flex items-end gap-2">
            <Select className="flex-1" label={i === 0 ? 'Komponen' : undefined} value={r.id_kategori_fee} placeholder="Pilih kategori"
              options={kategori.map((k) => ({ value: String(k.id_kategori_fee), label: k.nama_kategori }))}
              onChange={(e) => { const k = kategori.find((x) => String(x.id_kategori_fee) === e.target.value); setRows(rows.map((x, j) => (j === i ? { id_kategori_fee: e.target.value, nominal: k ? Number(k.nominal_default) : x.nominal } : x))); }} />
            <Input className="w-36" label={i === 0 ? 'Nominal (Rp)' : undefined} type="number" min={0} value={r.nominal}
              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, nominal: e.target.value } : x)))} />
            <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="mb-1 rounded-control p-2 text-danger hover:bg-danger-tint" aria-label="Hapus komponen"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <div className="flex flex-wrap justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => setRows([...rows, { id_kategori_fee: '', nominal: 0 }])}><Plus className="h-4 w-4" />Tambah komponen</Button>
          <Button size="sm" loading={saving} onClick={simpan}>Simpan tarif fee</Button>
        </div>
      </div>
    </Panel>
  );
}

export default function FormLayananPage({ params }) {
  const { id } = use(params);
  const baru = id === 'baru';
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState(baru ? { is_active: true, durasi_menit: 60, jenis_intake: 'Dewasa' } : null);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);
  const [hapus, setHapus] = useState(false);
  const f = useFormSubmit(data || {});

  const load = () => api.get(`/admin/layanan/${id}`).then((r) => {
    const d = { ...r.data, harga: Number(r.data.harga), id_template: r.data.id_template ? String(r.data.id_template) : '' };
    setData(d); f.setValue(d);
  }).catch((e) => setError(e.message));
  useEffect(() => {
    api.get('/admin/template-laporan').then((r) => setTemplates(r.data.filter((t) => t.is_active))).catch(() => {});
    if (!baru) load(); else f.setValue(data);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Loading />;
  const sections = LAYANAN(templates);

  const simpan = async (e) => {
    e.preventDefault();
    const body = pickFields(sections, f.value);
    body.id_template = body.id_template ? Number(body.id_template) : null;
    const r = await f.submit(() => (baru ? api.post('/admin/layanan', body) : api.put(`/admin/layanan/${id}`, body)), 'Layanan tersimpan');
    if (r && baru) router.replace(`/admin/layanan/${r.data.id_layanan}`);
    else if (r) load();
  };

  return (
    <>
      <Link href="/admin/layanan" className="text-sm text-ink-soft hover:text-ink">Layanan & harga</Link>
      <PageHeader title={baru ? 'Tambah layanan' : data.nama_layanan} action={!baru && <Button variant="ghost-danger" onClick={() => setHapus(true)}>Hapus layanan</Button>} />
      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_380px]">
        <form onSubmit={simpan} className="h-fit rounded-panel border border-line bg-white px-5 pt-6">
          <DynamicForm sections={sections} value={f.value} onChange={f.setValue} errors={f.errors} />
          <SaveBar saving={f.saving} label={baru ? 'Buat layanan' : 'Simpan perubahan'} />
        </form>
        {!baru ? <TarifFee key={data.updated_at} layanan={data} onSaved={load} /> : <p className="text-sm text-ink-faint">Tarif fee psikolog dapat diatur setelah layanan dibuat.</p>}
      </div>
      <ConfirmDialog open={hapus} onClose={() => setHapus(false)} title="Hapus layanan?" variant="danger" confirmLabel="Hapus"
        onConfirm={async () => { try { const r = await api.del(`/admin/layanan/${id}`); toast(r.message); router.replace('/admin/layanan'); } catch (e) { toast(e.message, 'error'); setHapus(false); } }}>
        Layanan yang sudah pernah dipesan tidak dihapus permanen, tetapi dinonaktifkan agar riwayat sesi tetap aman.
      </ConfirmDialog>
    </>
  );
}
