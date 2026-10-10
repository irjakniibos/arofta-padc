'use client';

/**
 * Laporan hasil pemeriksaan berbasis template (psikogram + kesimpulan).
 * Psikolog mengisi nilai skala tiap aspek, isian teks, dan pilihan kesimpulan,
 * lalu simpan draft, pratinjau dokumen, dan finalisasi (PDF dikirim ke klien).
 */
import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Select, Textarea } from '@/components/ui/Field';
import { Loading } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';
import { tanggal } from '@/lib/format';

function keterangan(skala) {
  return Object.fromEntries(String(skala || '').split(';').filter(Boolean).map((p) => p.split('=')));
}

export default function LaporanForm({ sesi, onChanged }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [nilai, setNilai] = useState({});
  const [error, setError] = useState(null);
  const [errs, setErrs] = useState({});
  const [templates, setTemplates] = useState(null);
  const [pilihTemplate, setPilihTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);

  const load = (idTemplate) => {
    setError(null);
    api.get(`/psikolog/sesi/${sesi.id_sesi}/laporan`, { id_template: idTemplate }).then((r) => {
      setForm(r.data);
      setNilai(Object.fromEntries(r.data.items.map((it) => [it.id_item, it.tipe === 'skala' ? it.nilai_skala : it.jawaban_teks])));
    }).catch((e) => {
      setError(e.message);
      if (e.status === 400) api.get('/psikolog/template-laporan').then((t) => setTemplates(t.data)).catch(() => {});
    });
  };
  useEffect(() => { load(); }, [sesi.id_sesi]); // eslint-disable-line react-hooks/exhaustive-deps

  const kelompok = useMemo(() => {
    if (!form) return [];
    const m = new Map();
    form.items.forEach((it) => { if (!m.has(it.kelompok)) m.set(it.kelompok, []); m.get(it.kelompok).push(it); });
    return Array.from(m.entries());
  }, [form]);

  if (error && !form) {
    return (
      <div className="space-y-4">
        <Alert type="info">{error}</Alert>
        {templates && (
          <div className="flex flex-wrap items-end gap-3">
            <Select label="Template laporan" className="min-w-[260px]" value={pilihTemplate} placeholder="Pilih template"
              options={templates.map((t) => ({ value: String(t.id_template), label: t.nama_template }))} onChange={(e) => setPilihTemplate(e.target.value)} />
            <Button disabled={!pilihTemplate} onClick={() => load(pilihTemplate)}>Gunakan template</Button>
          </div>
        )}
      </div>
    );
  }
  if (!form) return <Loading />;

  const final = form.laporan?.status_laporan === 'Final';
  const ket = keterangan(form.template.keterangan_skala);
  const skala = Array.from({ length: form.template.skala_max - form.template.skala_min + 1 }, (_, i) => form.template.skala_min + i);
  const set = (id, v) => setNilai((s) => ({ ...s, [id]: v }));
  const payload = () => ({
    id_template: form.template.id_template,
    jawaban: form.items.map((it) => (it.tipe === 'skala'
      ? { id_item: it.id_item, nilai_skala: nilai[it.id_item] ?? null }
      : { id_item: it.id_item, jawaban_teks: nilai[it.id_item] || null })),
  });

  const simpan = async (silent = false) => {
    setSaving(true); setErrs({});
    try {
      await api.put(`/psikolog/sesi/${sesi.id_sesi}/laporan`, payload());
      if (!silent) toast('Draft laporan tersimpan');
      return true;
    } catch (e) {
      toast(e.message, 'error');
      if (e instanceof ApiError) setErrs(e.fieldErrors());
      return false;
    } finally { setSaving(false); }
  };

  const finalisasi = async () => {
    if (!(await simpan(true))) { setKonfirmasi(false); return; }
    try {
      const r = await api.post(`/psikolog/sesi/${sesi.id_sesi}/laporan/finalisasi`);
      toast(`Laporan final (${r.data.format.toUpperCase()}) dan telah dikirim ke klien`);
      setKonfirmasi(false); load(); onChanged?.();
    } catch (e) {
      toast(e.message, 'error'); if (e instanceof ApiError) setErrs(e.fieldErrors()); setKonfirmasi(false);
    }
  };

  const errKode = (it) => errs[it.kode];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{form.template.nama_template}</p>
          <p className="text-[13px] text-ink-soft">Skala {form.template.skala_min}–{form.template.skala_max}{form.template.keterangan_skala ? ` (${form.template.keterangan_skala.split(';').join(', ')})` : ''}</p>
        </div>
        <Badge status={form.laporan?.status_laporan || 'Draft'}>{form.laporan ? form.laporan.status_laporan : 'Belum diisi'}</Badge>
      </div>

      {final && (
        <Alert type="success" className="mb-5" title="Laporan sudah final">
          Terbit {tanggal(form.laporan.tanggal_final)} dan dapat diunduh klien. Perubahan memerlukan admin membuka kembali laporan.
          <a className="ml-2 inline-flex items-center gap-1 font-semibold underline" target="_blank" rel="noopener" href={api.fileUrl(`/laporan/${form.laporan.id_laporan}/unduh`)}><Download className="h-4 w-4" />Unduh</a>
        </Alert>
      )}
      {sesi.status_asesmen !== 'Selesai' && !final && <Alert type="info" className="mb-5">Laporan dapat diisi kapan saja, tetapi baru dapat difinalisasi setelah sesi berstatus Selesai.</Alert>}

      <fieldset disabled={final} className="space-y-8">
        {kelompok.map(([nama, items]) => {
          const skalaItems = items.filter((i) => i.tipe === 'skala');
          const lain = items.filter((i) => i.tipe !== 'skala');
          return (
            <section key={nama}>
              <h3 className="mb-3 text-[13px] font-semibold text-violet-deep">{nama}</h3>
              {skalaItems.length > 0 && (
                <div className="overflow-x-auto rounded-panel border border-line">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead>
                      <tr className="border-b border-line bg-mist text-[12px] text-ink-soft">
                        <th scope="col" className="px-4 py-2 text-left font-medium">Aspek</th>
                        {skala.map((n) => <th key={n} scope="col" className="w-12 py-2 text-center font-medium tabular" title={ket[n] || ''}>{n}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {skalaItems.map((it) => (
                        <tr key={it.id_item} className={errKode(it) ? 'bg-danger-tint' : ''}>
                          <th scope="row" className="px-4 py-2.5 text-left font-normal">
                            <span className="font-medium">{it.urutan}. {it.label}{it.wajib && <span className="text-danger"> *</span>}</span>
                            {it.deskripsi && <span className="block text-[12px] text-ink-faint">{it.deskripsi}</span>}
                          </th>
                          {skala.map((n) => (
                            <td key={n} className="border-l border-line text-center">
                              <label className="flex h-11 cursor-pointer items-center justify-center">
                                <input type="radio" name={`item-${it.id_item}`} className="h-4 w-4 accent-[var(--color-check)]"
                                  aria-label={`${it.label} nilai ${n}`} checked={nilai[it.id_item] === n} onChange={() => set(it.id_item, n)} />
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {lain.length > 0 && (
                <div className={`grid gap-4 sm:grid-cols-2 ${skalaItems.length ? 'mt-4' : ''}`}>
                  {lain.map((it) => (it.tipe === 'pilihan' ? (
                    <fieldset key={it.id_item} className="sm:col-span-2">
                      <legend className="mb-2 text-sm font-medium">{it.label}{it.wajib && <span className="text-danger"> *</span>}</legend>
                      <div className="flex flex-wrap gap-2">
                        {it.opsi.map((o) => (
                          <label key={o} className={`cursor-pointer rounded-control border px-3 py-2 text-sm ${nilai[it.id_item] === o ? 'border-violet bg-violet-tint font-semibold text-violet-deep' : 'border-line'}`}>
                            <input type="radio" className="sr-only" name={`item-${it.id_item}`} checked={nilai[it.id_item] === o} onChange={() => set(it.id_item, o)} />{o}
                          </label>
                        ))}
                      </div>
                      {errKode(it) && <p className="mt-1 text-[13px] text-danger">{errKode(it)}</p>}
                    </fieldset>
                  ) : (
                    <Textarea key={it.id_item} label={it.label} required={it.wajib} hint={it.deskripsi} rows={it.kode.includes('iq') || it.label.length < 25 ? 2 : 4}
                      className={/uraian|saran|kesimpulan|kelebihan|kekurangan|rekomendasi|minat/i.test(it.kode) ? 'sm:col-span-2' : ''}
                      maxLength={10000} value={nilai[it.id_item] || ''} error={errKode(it)} onChange={(e) => set(it.id_item, e.target.value)} />
                  )))}
                </div>
              )}
            </section>
          );
        })}
      </fieldset>

      {!final && (
        <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white/95 px-5 py-3 backdrop-blur">
          <p className="mr-auto text-[13px] text-ink-faint">Identitas klien di laporan terisi otomatis dari data klien.</p>
          <Button variant="secondary" loading={saving} onClick={() => simpan()}>Simpan draft</Button>
          <Button variant="secondary" onClick={async () => {
            // simpan dulu agar pratinjau memakai isian terbaru; tab dibuka lebih dulu agar tidak diblokir browser
            const w = window.open('', '_blank');
            if (await simpan(true)) { if (w) w.location = api.fileUrl(`/psikolog/sesi/${sesi.id_sesi}/laporan/pratinjau`); load(); } else if (w) w.close();
          }}><Eye className="h-4 w-4" />Pratinjau</Button>
          <Button disabled={sesi.status_asesmen !== 'Selesai'} onClick={() => setKonfirmasi(true)}><Lock className="h-4 w-4" />Finalisasi & kirim</Button>
        </div>
      )}
      <ConfirmDialog open={konfirmasi} onClose={() => setKonfirmasi(false)} title="Finalisasi laporan?" confirmLabel="Finalisasi & kirim ke klien" onConfirm={finalisasi}>
        Laporan akan dikunci, dibuat dalam format PDF, dan dikirim ke klien. Pastikan isian sudah benar (gunakan Pratinjau). Pembuatan PDF memerlukan beberapa detik.
      </ConfirmDialog>
    </div>
  );
}
