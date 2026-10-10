'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Upload, Download, FileText } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import DynamicForm from '@/components/form/DynamicForm';
import SaveBar from '@/components/form/SaveBar';
import { useFormSubmit } from '@/components/form/useForm';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { pickFields } from '@/lib/form-defs';
import { TEMPLATE_META, TEMPLATE_ITEM } from '@/lib/form-defs-admin';

const MAX_MB = 2;
const TIPE = { skala: 'Skala', teks: 'Teks', pilihan: 'Pilihan' };

function Kode({ children }) {
  return <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[12.5px] text-violet-deep">{children}</code>;
}

function Panduan({ id }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.get(`/admin/template-laporan/${id}/panduan`).then((r) => setD(r.data)).catch((e) => setErr(e.message)); }, [id]);
  if (err) return <Alert type="error">{err}</Alert>;
  if (!d) return <Loading />;
  const Daftar = ({ rows }) => (
    <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
      {rows.map((r) => <div key={r.placeholder} className="contents"><dt><Kode>{r.placeholder}</Kode></dt><dd className="text-ink-soft">{r.keterangan}{r.tanda_centang && <span className="block text-[12.5px]">Tanda centang: {r.tanda_centang.map((t) => <Kode key={t}>{t}</Kode>).reduce((a, b) => [a, ' ', b])}</span>}</dd></div>)}
    </dl>
  );
  return (
    <div className="space-y-5 text-sm">
      <p className="text-ink-soft">{d.sintaks}</p>
      <section><h3 className="mb-2 font-semibold">Identitas klien dan sesi</h3><Daftar rows={d.identitas} /></section>
      {d.isian.length > 0 && <section><h3 className="mb-2 font-semibold">Isian teks dan pilihan</h3><Daftar rows={d.isian} /></section>}
      {d.nilai_aspek.length > 0 && <section><h3 className="mb-2 font-semibold">Nilai tiap aspek</h3><Daftar rows={d.nilai_aspek} /></section>}
      <section>
        <h3 className="mb-2 font-semibold">Tabel psikogram</h3>
        <p className="mb-1 text-ink-soft">Semua kelompok:</p><p className="break-all"><Kode>{d.tabel_psikogram.semua_kelompok}</Kode></p>
        <p className="mb-1 mt-3 text-ink-soft">Tanpa kelompok:</p><p className="break-all"><Kode>{d.tabel_psikogram.tanpa_kelompok}</Kode></p>
        {d.tabel_psikogram.per_kelompok.length > 0 && <><p className="mb-1 mt-3 text-ink-soft">Per kelompok:</p><p className="flex flex-wrap gap-1.5">{d.tabel_psikogram.per_kelompok.map((k) => <Kode key={k}>{k}</Kode>)}</p></>}
        <p className="mt-3 text-ink-faint">{d.tabel_psikogram.keterangan_kolom}</p>
      </section>
    </div>
  );
}

function BerkasWord({ tpl, onUploaded }) {
  const toast = useToast();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [panduan, setPanduan] = useState(false);

  const pilih = (e) => {
    const f = e.target.files?.[0];
    setErr(null); setHasil(null);
    if (!f) return setFile(null);
    if (!f.name.toLowerCase().endsWith('.docx')) { e.target.value = ''; setFile(null); return setErr('Hanya file Word .docx yang diizinkan.'); }
    if (f.size > MAX_MB * 1024 * 1024) { e.target.value = ''; setFile(null); return setErr(`Ukuran file maksimal ${MAX_MB} MB.`); }
    setFile(f);
  };
  const unggah = async () => {
    const fd = new FormData();
    fd.append('file', file);
    setSaving(true); setErr(null);
    try {
      const r = await api.post(`/admin/template-laporan/${tpl.id_template}/file`, fd);
      setHasil(r.data.placeholder_terdeteksi || []); setFile(null); if (input.current) input.current.value = '';
      toast('File template diunggah'); onUploaded();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <Panel title="File Word laporan">
      <div className="space-y-4 px-5 py-4 text-sm">
        {tpl.file_docx ? (
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 shrink-0 text-violet" aria-hidden />
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{tpl.file_docx}</p><p className="text-[13px] text-ink-faint">Versi {tpl.versi}</p></div>
            <a href={api.fileUrl(`/admin/template-laporan/${tpl.id_template}/file`)} download className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line px-3 text-sm font-medium hover:bg-mist"><Download className="h-4 w-4" />Unduh</a>
          </div>
        ) : <Alert type="warning">Template ini belum memiliki file Word. Laporan belum dapat dibuat sampai file diunggah.</Alert>}
        <div className="border-t border-line pt-4">
          <label htmlFor="file-template" className="mb-1.5 block font-medium">Unggah file baru</label>
          <input ref={input} id="file-template" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={pilih}
            className="block w-full text-sm file:mr-3 file:rounded-control file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-mist" />
          <p className="mt-1.5 text-[13px] text-ink-faint">Format .docx, maksimal {MAX_MB} MB, satu file. File lama tetap disimpan sebagai arsip dan versi dinaikkan.</p>
          {err && <p className="mt-2 text-[13px] text-danger" role="alert">{err}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={!file} loading={saving} onClick={unggah}><Upload className="h-4 w-4" />Unggah</Button>
            <Button size="sm" variant="ghost" onClick={() => setPanduan(true)}>Lihat panduan placeholder</Button>
          </div>
          {hasil && (
            <div className="mt-3 rounded-control bg-success-tint px-3 py-2.5 text-[13px] text-success">
              {hasil.length ? <>Placeholder terdeteksi: {hasil.slice(0, 40).join(', ')}{hasil.length > 40 ? ` dan ${hasil.length - 40} lainnya` : ''}</> : 'File diterima. Tidak ada placeholder yang terdeteksi, periksa kembali isi file.'}
            </div>
          )}
        </div>
      </div>
      <Modal open={panduan} onClose={() => setPanduan(false)} title="Panduan placeholder" size="lg"><Panduan id={tpl.id_template} /></Modal>
    </Panel>
  );
}

function DaftarItem({ tpl, onChanged }) {
  const toast = useToast();
  const f = useFormSubmit({});
  const [edit, setEdit] = useState(null);
  const [hapus, setHapus] = useState(null);
  const items = tpl.items || [];
  const buka = (it) => {
    const next = Math.max(0, ...items.map((i) => i.urutan)) + 1;
    f.setValue(it === 'baru' ? { tipe: 'skala', urutan: next, wajib: true, is_active: true, kelompok: items.at(-1)?.kelompok || '' } : { ...it });
    setEdit(it);
  };
  const simpan = async (e) => {
    e.preventDefault();
    const body = pickFields(TEMPLATE_ITEM, f.value);
    if (body.tipe !== 'pilihan') delete body.opsi;
    const base = `/admin/template-laporan/${tpl.id_template}/item`;
    const ok = await f.submit(() => (edit === 'baru' ? api.post(base, body) : api.put(`${base}/${edit.id_item}`, body)), 'Aspek tersimpan');
    if (ok) { setEdit(null); onChanged(); }
  };
  return (
    <Panel title={`Aspek dan isian (${items.length})`} action={<Button size="sm" onClick={() => buka('baru')}><Plus className="h-4 w-4" />Tambah aspek</Button>}>
      <Table rowKey="id_item" rows={items} empty="Belum ada aspek. Tambahkan aspek yang akan dinilai psikolog."
        columns={[
          { key: 'no', label: 'No', className: 'tabular text-ink-faint', render: (i) => i.urutan },
          { key: 'label', label: 'Aspek', render: (i) => <><span className={`block font-medium ${i.is_active ? '' : 'text-ink-faint line-through'}`}>{i.label}</span><span className="text-[13px] text-ink-faint">{i.kelompok}</span></> },
          { key: 'kode', label: 'Placeholder', render: (i) => <Kode>{`{${i.kode}}`}</Kode> },
          { key: 'tipe', label: 'Tipe', render: (i) => <>{TIPE[i.tipe]}{i.wajib && <span className="ml-1 text-danger" title="Wajib">*</span>}</> },
          { key: 'aksi', label: '', render: (i) => (
            <div className="flex justify-end gap-1">
              <button type="button" onClick={() => buka(i)} className="rounded-control p-1.5 text-ink-soft hover:bg-mist" aria-label={`Ubah ${i.label}`}><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => setHapus(i)} className="rounded-control p-1.5 text-danger hover:bg-danger-tint" aria-label={`Hapus ${i.label}`}><Trash2 className="h-4 w-4" /></button>
            </div>) },
        ]} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'baru' ? 'Tambah aspek' : 'Ubah aspek'}>
        <form onSubmit={simpan}>
          <DynamicForm sections={TEMPLATE_ITEM} value={f.value} onChange={f.setValue} errors={f.errors} />
          <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEdit(null)}>Batal</Button><Button type="submit" loading={f.saving}>Simpan</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!hapus} onClose={() => setHapus(null)} title="Hapus aspek?" variant="danger" confirmLabel="Hapus"
        onConfirm={async () => { try { const r = await api.del(`/admin/template-laporan/${tpl.id_template}/item/${hapus.id_item}`); toast(r.data?.dinonaktifkan ? 'Aspek sudah dipakai di laporan, sehingga dinonaktifkan' : 'Aspek dihapus'); setHapus(null); onChanged(); } catch (e) { toast(e.message, 'error'); } }}>
        {hapus && <>Aspek <b>{hapus.label}</b> akan dihapus. Jika sudah pernah dipakai di laporan, aspek hanya dinonaktifkan.</>}
      </ConfirmDialog>
    </Panel>
  );
}

export default function TemplateDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [tpl, setTpl] = useState(null);
  const [error, setError] = useState(null);
  const [hapus, setHapus] = useState(false);
  const f = useFormSubmit({});
  const load = () => api.get(`/admin/template-laporan/${id}`).then((r) => { setTpl(r.data); f.setValue(r.data); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!tpl) return <Loading />;
  const simpan = async (e) => {
    e.preventDefault();
    const r = await f.submit(() => api.put(`/admin/template-laporan/${id}`, pickFields(TEMPLATE_META(false), f.value)), 'Template tersimpan');
    if (r) { setTpl(r.data); f.setValue(r.data); }
  };
  return (
    <>
      <Link href="/admin/template" className="text-sm text-ink-soft hover:text-ink">Template laporan</Link>
      <PageHeader title={tpl.nama_template} description={<>Kode <Kode>{tpl.kode}</Kode> {!tpl.is_active && <Badge tone="neutral">Nonaktif</Badge>}</>}
        action={<Button variant="ghost-danger" onClick={() => setHapus(true)}>Hapus template</Button>} />
      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-6">
          <DaftarItem tpl={tpl} onChanged={load} />
        </div>
        <div className="space-y-6">
          <BerkasWord tpl={tpl} onUploaded={load} />
          <form onSubmit={simpan} className="rounded-panel border border-line bg-white px-5 pt-6">
            <DynamicForm sections={TEMPLATE_META(false)} value={f.value} onChange={f.setValue} errors={f.errors} />
            <SaveBar saving={f.saving} />
          </form>
        </div>
      </div>
      <ConfirmDialog open={hapus} onClose={() => setHapus(false)} title="Hapus template?" variant="danger" confirmLabel="Hapus"
        onConfirm={async () => { try { const r = await api.del(`/admin/template-laporan/${id}`); toast(r.data?.dinonaktifkan ? 'Template sudah dipakai di laporan, sehingga dinonaktifkan' : 'Template dihapus'); router.replace('/admin/template'); } catch (e) { toast(e.message, 'error'); setHapus(false); } }}>
        Template yang sudah pernah dipakai di laporan tidak dihapus permanen, melainkan dinonaktifkan. Layanan yang memakai template ini akan dilepas dari template.
      </ConfirmDialog>
    </>
  );
}
