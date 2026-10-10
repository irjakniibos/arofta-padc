'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

/** Pengelompokan & tipe input per kunci; kunci yang tidak terdaftar tetap tampil di kelompok "Lainnya". */
const GRUP = [
  { judul: 'Rekening dan konfirmasi pembayaran', ket: 'Ditampilkan kepada klien setelah booking.', kunci: {
    bank_nama: { label: 'Nama bank' }, bank_no_rekening: { label: 'Nomor rekening', inputMode: 'numeric', pattern: '[0-9 \\-]{4,40}' }, bank_atas_nama: { label: 'Atas nama' },
    kontak_whatsapp: { label: 'Nomor WhatsApp admin', inputMode: 'tel', pattern: '(\\+62|62|0)8[0-9\\- ]{7,14}', hint: 'Klien mengirim konfirmasi dan bukti transfer ke nomor ini. Juga dipakai untuk kebutuhan layanan mendesak.' } } },
  { judul: 'Aturan booking dan pembayaran', ket: 'Dipakai saat booking dan oleh penjadwal otomatis.', kunci: {
    batas_booking_jam: { label: 'Booking online paling lambat (jam sebelum jadwal)', type: 'number', min: 1, max: 72 },
    maks_booking_belum_bayar: { label: 'Maksimal booking belum dibayar per akun', type: 'number', min: 1, max: 20 },
    batas_bayar_jam: { label: 'Batas bayar setelah booking (jam)', type: 'number', min: 1, max: 168 },
    batas_bayar_sebelum_sesi_jam: { label: 'Batas bayar sebelum sesi dimulai (jam)', type: 'number', min: 1, max: 24, hint: 'Batas bayar adalah yang lebih dulu antara dua aturan ini. Harus lebih kecil dari batas booking online.' },
    reminder_jam_sebelum: { label: 'Pengingat dikirim sebelum sesi (jam)', type: 'number', min: 1, max: 72 } } },
  { judul: 'Identitas lembaga', ket: 'Tampil di situs, email, dan laporan.', kunci: {
    nama_lembaga: { label: 'Nama lembaga' }, alamat_klinik: { label: 'Alamat klinik', textarea: true }, email_lembaga: { label: 'Email lembaga', type: 'email' } } },
];

export default function PengaturanPage() {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [nilai, setNilai] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const load = () => api.get('/admin/pengaturan').then((r) => { setRows(r.data); setNilai(Object.fromEntries(r.data.map((x) => [x.kunci, x.nilai === '-' ? '' : x.nilai]))); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rows) return <Loading />;

  const dikenal = new Set(GRUP.flatMap((g) => Object.keys(g.kunci)));
  const lain = rows.filter((r) => !dikenal.has(r.kunci));
  const grup = lain.length ? [...GRUP, { judul: 'Lainnya', kunci: Object.fromEntries(lain.map((r) => [r.kunci, { label: r.keterangan || r.kunci }])) }] : GRUP;
  const ket = Object.fromEntries(rows.map((r) => [r.kunci, r.keterangan]));

  const simpan = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const items = rows.map((r) => ({ kunci: r.kunci, nilai: String(nilai[r.kunci] ?? '').trim() || '-' })).filter((it) => it.nilai !== rows.find((r) => r.kunci === it.kunci).nilai);
      if (!items.length) { toast('Tidak ada perubahan'); return; }
      if (Number(nilai.batas_booking_jam) <= Number(nilai.batas_bayar_sebelum_sesi_jam)) {
        toast('Batas booking online harus lebih besar dari batas bayar sebelum sesi', 'error'); return;
      }
      await api.put('/admin/pengaturan', { items });
      toast('Pengaturan tersimpan'); load();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Pengaturan" description="Informasi yang dipakai di seluruh sistem. Perubahan langsung berlaku tanpa perlu mengubah kode." />
      <form onSubmit={simpan} className="space-y-6">
        {grup.map((g) => (
          <Panel key={g.judul} title={g.judul} action={g.ket && <span className="hidden text-[13px] text-ink-faint sm:block">{g.ket}</span>}>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              {Object.entries(g.kunci).filter(([k]) => k in nilai).map(([k, c]) => {
                const props = { label: c.label, hint: c.hint || (ket[k] !== c.label ? ket[k] : undefined), value: nilai[k] ?? '', onChange: (e) => setNilai({ ...nilai, [k]: e.target.value }), maxLength: 1000 };
                return c.textarea
                  ? <Textarea key={k} {...props} rows={2} className="sm:col-span-2" />
                  : <Input key={k} {...props} type={c.type || 'text'} inputMode={c.inputMode} pattern={c.pattern} min={c.min} max={c.max} placeholder={c.placeholder} />;
              })}
            </div>
          </Panel>
        ))}
        <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-panel sm:border">
          <Button type="submit" loading={saving}>Simpan pengaturan</Button>
        </div>
      </form>
    </>
  );
}
