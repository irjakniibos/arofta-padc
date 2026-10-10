'use client';

/**
 * Kalender Jadwal untuk psikolog & admin: slot praktik + sesi dalam satu bulan.
 * Psikolog/Admin menambah slot (satuan atau berulang), menutup, atau menghapus slot yang belum dipesan.
 * mode="psikolog" -> endpoint /psikolog/...; mode="admin" -> /admin/... (pilih psikolog dulu untuk menambah slot)
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Repeat, Trash2, Lock, LockOpen } from 'lucide-react';
import KalenderBulan, { isoTanggal } from './KalenderBulan';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { jam, tanggal, isoLokal } from '@/lib/format';

const now = new Date();
const TIPE = [{ value: 'Keduanya', label: 'Daring & tatap muka' }, { value: 'Online', label: 'Daring saja' }, { value: 'Offline', label: 'Tatap muka saja' }];
const HARI = [[1, 'Senin'], [2, 'Selasa'], [3, 'Rabu'], [4, 'Kamis'], [5, 'Jumat'], [6, 'Sabtu'], [7, 'Minggu']];

export default function KalenderStaf({ mode }) {
  const toast = useToast();
  const isAdmin = mode === 'admin';
  const [periode, setPeriode] = useState({ tahun: now.getFullYear(), bulan: now.getMonth() + 1 });
  const [idPsikolog, setIdPsikolog] = useState('');
  const [psikolog, setPsikolog] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dipilih, setDipilih] = useState(isoTanggal(now.getFullYear(), now.getMonth() + 1, now.getDate()));
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (isAdmin) api.get('/admin/psikolog', { limit: 50 }).then((r) => setPsikolog(r.data)).catch(() => {}); }, [isAdmin]);

  const load = () => {
    setError(null);
    api.get(`/${mode}/kalender`, { ...periode, id_psikolog: isAdmin ? idPsikolog : undefined })
      .then((r) => setData(r.data)).catch((e) => setError(e.message));
  };
  useEffect(load, [periode, idPsikolog]); // eslint-disable-line react-hooks/exhaustive-deps

  const perTanggal = useMemo(() => {
    const m = {};
    (data?.slot || []).forEach((s) => { (m[s.tanggal] ||= { slot: [], sesi: [] }).slot.push(s); });
    (data?.sesi || []).forEach((s) => { (m[s.tanggal] ||= { slot: [], sesi: [] }).sesi.push(s); });
    return m;
  }, [data]);

  const hari = perTanggal[dipilih] || { slot: [], sesi: [] };
  const base = isAdmin ? `/admin/psikolog/${idPsikolog}/jadwal` : '/psikolog/jadwal';
  const slotUrl = (id) => (isAdmin ? `/admin/jadwal/${id}` : `/psikolog/jadwal/${id}`);
  const bisaTambah = !isAdmin || idPsikolog;

  const simpan = async () => {
    setSaving(true);
    try {
      if (modal === 'satu') {
        await api.post(base, { tanggal: form.tanggal, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai, tipe_sesi: form.tipe_sesi });
        toast('Slot jadwal ditambahkan');
      } else {
        const r = await api.post(`${base}/bulk`, {
          tanggal_mulai: form.tanggal_mulai, tanggal_selesai: form.tanggal_selesai, hari: form.hari, tipe_sesi: form.tipe_sesi,
          slot: form.slot.filter((s) => s.jam_mulai && s.jam_selesai),
        });
        toast(`${r.data.dibuat} slot dibuat${r.data.dilewati ? `, ${r.data.dilewati} dilewati karena bentrok/lewat` : ''}`);
      }
      setModal(null); load();
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  const [hapusSlot, setHapusSlot] = useState(null);
  const ubahSlot = async (s, aksi) => {
    try {
      if (aksi === 'hapus') await api.del(slotUrl(s.id_jadwal));
      else await api.put(slotUrl(s.id_jadwal), { status_slot: aksi });
      toast(aksi === 'hapus' ? 'Slot dihapus' : aksi === 'Ditutup' ? 'Slot ditutup' : 'Slot dibuka kembali');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const bukaSatu = () => { setForm({ tanggal: dipilih, jam_mulai: '09:00', jam_selesai: '11:00', tipe_sesi: 'Keduanya' }); setModal('satu'); };
  const bukaBulk = () => {
    const awal = new Date(); awal.setDate(awal.getDate() + 1);
    const akhir = new Date(); akhir.setDate(akhir.getDate() + 30);
    setForm({ tanggal_mulai: isoLokal(awal), tanggal_selesai: isoLokal(akhir), hari: [1, 2, 3, 4, 5], tipe_sesi: 'Keduanya', slot: [{ jam_mulai: '09:00', jam_selesai: '11:00' }, { jam_mulai: '13:00', jam_selesai: '15:00' }] });
    setModal('bulk');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="rounded-panel border border-line bg-white p-5">
        <div className="mb-5 flex flex-wrap items-end gap-3">
          {isAdmin && (
            <Select label="Psikolog" className="min-w-[240px] flex-1" value={idPsikolog} placeholder="Semua psikolog"
              options={psikolog.map((p) => ({ value: String(p.id_psikolog), label: p.nama_lengkap }))} onChange={(e) => setIdPsikolog(e.target.value)} />
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!bisaTambah} onClick={bukaBulk}><Repeat className="h-4 w-4" />Jadwal berulang</Button>
            <Button disabled={!bisaTambah} onClick={bukaSatu}><Plus className="h-4 w-4" />Tambah slot</Button>
          </div>
        </div>
        {isAdmin && !idPsikolog && <p className="mb-4 text-[13px] text-ink-faint">Pilih psikolog untuk menambah atau mengubah slot jadwalnya.</p>}
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <div className="relative">
          <KalenderBulan tahun={periode.tahun} bulan={periode.bulan} onGanti={(tahun, bulan) => setPeriode({ tahun, bulan })}
            dipilih={dipilih} onPilih={setDipilih} aktif={() => true}
            renderIsi={(iso) => {
              const d = perTanggal[iso];
              if (!d) return null;
              const kosong = d.slot.filter((s) => s.status_slot === 'Tersedia').length;
              const sesiAktif = d.sesi.filter((s) => s.status_asesmen !== 'Batal').length;
              return (
                <span className="mt-auto flex w-full flex-col gap-0.5 text-[11px] leading-tight">
                  {sesiAktif > 0 && <span className="truncate rounded bg-violet px-1 py-0.5 text-white">{sesiAktif} sesi</span>}
                  {kosong > 0 && <span className="truncate text-success">{kosong} slot kosong</span>}
                </span>
              );
            }} />
          {!data && !error && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><Spinner /></div>}
        </div>
        <p className="mt-3 flex flex-wrap gap-4 text-[12px] text-ink-soft">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-violet" />Sesi terjadwal</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-success" />Slot kosong</span>
        </p>
      </div>

      <aside className="h-fit rounded-panel border border-line bg-white xl:sticky xl:top-24">
        <h2 className="border-b border-line px-5 py-3.5 font-semibold">{tanggal(dipilih, { hari: true })}</h2>
        <section className="border-b border-line px-5 py-4">
          <h3 className="text-[13px] font-semibold text-ink-soft">Sesi</h3>
          {hari.sesi.length === 0 ? <p className="mt-2 text-sm text-ink-faint">Tidak ada sesi.</p> : (
            <ul className="mt-2 space-y-3">
              {hari.sesi.map((s) => (
                <li key={s.id_sesi}>
                  <Link href={`/${mode}/sesi/${s.id_sesi}`} className="block rounded-control border border-line px-3 py-2.5 hover:border-violet-line">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold tabular">{jam(s.waktu)} WIB<Badge status={s.status_asesmen} /></span>
                    <span className="block text-sm">{s.klien?.nama_lengkap}</span>
                    <span className="block text-[13px] text-ink-soft">{s.layanan?.nama_layanan}{isAdmin ? `, ${s.psikolog?.nama_lengkap}` : ''}</span>
                    <span className="block text-[13px] text-ink-faint">{s.tipe_sesi === 'Online' ? 'Daring' : 'Tatap muka'}, pembayaran {s.pembayaran?.status_pembayaran?.toLowerCase()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="px-5 py-4">
          <h3 className="text-[13px] font-semibold text-ink-soft">Slot praktik</h3>
          {hari.slot.length === 0 ? <p className="mt-2 text-sm text-ink-faint">Belum ada slot.</p> : (
            <ul className="mt-2 divide-y divide-line">
              {hari.slot.map((s) => (
                <li key={s.id_jadwal} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <span>
                    <span className="block font-medium tabular">{jam(s.jam_mulai)}–{jam(s.jam_selesai)}</span>
                    <span className="text-[12px] text-ink-faint">{isAdmin ? `${s.psikolog?.nama_lengkap}, ` : ''}{TIPE.find((t) => t.value === s.tipe_sesi)?.label}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge status={s.status_slot} />
                    {s.status_slot !== 'Dipesan' && (
                      <>
                        <button type="button" onClick={() => ubahSlot(s, s.status_slot === 'Tersedia' ? 'Ditutup' : 'Tersedia')} className="rounded-control p-1.5 text-ink-soft hover:bg-mist"
                          aria-label={s.status_slot === 'Tersedia' ? 'Tutup slot' : 'Buka slot'}>{s.status_slot === 'Tersedia' ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}</button>
                        <button type="button" onClick={() => setHapusSlot(s)} className="rounded-control p-1.5 text-danger hover:bg-danger-tint" aria-label="Hapus slot"><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      <Modal open={modal === 'satu'} onClose={() => setModal(null)} title="Tambah slot jadwal"
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Batal</Button><Button loading={saving} onClick={simpan}>Simpan slot</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Tanggal" type="date" required className="sm:col-span-2" value={form.tanggal || ''} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          <Input label="Jam mulai" type="time" required value={form.jam_mulai || ''} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} />
          <Input label="Jam selesai" type="time" required value={form.jam_selesai || ''} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} />
          <Select label="Jenis sesi" className="sm:col-span-2" value={form.tipe_sesi} options={TIPE} onChange={(e) => setForm({ ...form, tipe_sesi: e.target.value })} />
        </div>
      </Modal>

      <Modal open={modal === 'bulk'} onClose={() => setModal(null)} title="Buat jadwal berulang" size="lg"
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Batal</Button><Button loading={saving} onClick={simpan}>Buat slot</Button></>}>
        {modal === 'bulk' && (
          <div className="space-y-5">
            <p className="text-sm text-ink-soft">Slot dibuat untuk setiap hari terpilih dalam rentang tanggal (maksimal 62 hari). Slot yang bentrok dengan jadwal lama otomatis dilewati.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Dari tanggal" type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} />
              <Input label="Sampai tanggal" type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} />
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Hari praktik</legend>
              <div className="flex flex-wrap gap-2">
                {HARI.map(([v, l]) => {
                  const on = form.hari.includes(v);
                  return (
                    <label key={v} className={`cursor-pointer rounded-control border px-3 py-1.5 text-sm ${on ? 'border-violet bg-violet-tint font-semibold text-violet-deep' : 'border-line'}`}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => setForm({ ...form, hari: on ? form.hari.filter((h) => h !== v) : [...form.hari, v] })} />{l}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Jam praktik</legend>
              <div className="space-y-2">
                {form.slot.map((s, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <Input label={i === 0 ? 'Mulai' : undefined} type="time" value={s.jam_mulai} className="flex-1"
                      onChange={(e) => setForm({ ...form, slot: form.slot.map((x, j) => (j === i ? { ...x, jam_mulai: e.target.value } : x)) })} />
                    <Input label={i === 0 ? 'Selesai' : undefined} type="time" value={s.jam_selesai} className="flex-1"
                      onChange={(e) => setForm({ ...form, slot: form.slot.map((x, j) => (j === i ? { ...x, jam_selesai: e.target.value } : x)) })} />
                    <button type="button" className="mb-1 rounded-control p-2 text-danger hover:bg-danger-tint" aria-label="Hapus jam" disabled={form.slot.length === 1}
                      onClick={() => setForm({ ...form, slot: form.slot.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setForm({ ...form, slot: [...form.slot, { jam_mulai: '', jam_selesai: '' }] })}><Plus className="h-4 w-4" />Tambah jam</Button>
            </fieldset>
            <Select label="Jenis sesi" value={form.tipe_sesi} options={TIPE} onChange={(e) => setForm({ ...form, tipe_sesi: e.target.value })} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!hapusSlot} onClose={() => setHapusSlot(null)} title="Hapus slot jadwal?" variant="danger" confirmLabel="Hapus slot"
        onConfirm={async () => { await ubahSlot(hapusSlot, 'hapus'); setHapusSlot(null); }}>
        {hapusSlot && <>Slot {tanggal(hapusSlot.tanggal, { hari: true })}, {jam(hapusSlot.jam_mulai)}–{jam(hapusSlot.jam_selesai)} WIB akan dihapus. Untuk menutup sementara, gunakan tombol kunci.</>}
      </ConfirmDialog>
    </div>
  );
}
