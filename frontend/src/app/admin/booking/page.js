'use client';

/**
 * Booking oleh Admin untuk kebutuhan mendesak atau klien yang datang langsung (walk-in).
 * Tidak terikat batas waktu booking online, pembayaran langsung tercatat Lunas, formulir intake boleh menyusul.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input, Select, Textarea, Checkbox } from '@/components/ui/Field';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { rupiah, jam, isoLokal, tanggal as fmtTanggal } from '@/lib/format';

const MODE_KLIEN = [
  ['terdaftar', 'Klien terdaftar', 'Klien sudah punya profil di sistem.'],
  ['tanpa_akun', 'Klien baru tanpa akun', 'Data klien disimpan, klien tidak login ke web. Laporan diserahkan langsung.'],
  ['buat_akun', 'Klien baru dan buatkan akun', 'Klien menerima email untuk mengatur password, lalu bisa melihat jadwal dan mengunduh laporan.'],
];
const JAM_LAIN = 'baru';

function tambahMenit(hhmm, menit) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.min(h * 60 + m + menit, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function PilihanRadio({ name, value, onChange, options }) {
  return (
    <div className="grid gap-2 xl:grid-cols-3">
      {options.map(([v, label, ket]) => (
        <label key={v} className={`cursor-pointer rounded-control border px-4 py-3 text-sm ${value === v ? 'border-violet bg-violet-tint' : 'border-line hover:border-violet-line'}`}>
          <input type="radio" name={name} value={v} className="sr-only" checked={value === v} onChange={() => onChange(v)} />
          <span className={`block ${value === v ? 'font-semibold text-violet-deep' : 'font-medium'}`}>{label}</span>
          {ket && <span className="mt-0.5 block text-[13px] text-ink-soft">{ket}</span>}
        </label>
      ))}
    </div>
  );
}

function CariKlien({ value, onPilih }) {
  const [q, setQ] = useState('');
  const [hasil, setHasil] = useState(null);
  useEffect(() => {
    if (q.trim().length < 2) { setHasil(null); return undefined; }
    const t = setTimeout(() => {
      api.get('/admin/klien', { q: q.trim(), limit: 10 }).then((r) => setHasil(r.data)).catch(() => setHasil([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  if (value) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-mist px-4 py-3 text-sm">
        <div>
          <p className="font-semibold">{value.nama_lengkap}</p>
          <p className="text-ink-soft">{value.nomor_rekam_psikologi}{value.no_hp ? `, ${value.no_hp}` : ''}{value.akun?.email ? `, ${value.akun.email}` : ', tanpa akun'}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onPilih(null)}>Ganti klien</Button>
      </div>
    );
  }
  return (
    <div>
      <Input label="Cari klien" placeholder="Nama, nomor rekam, atau nomor HP" value={q} onChange={(e) => setQ(e.target.value)} maxLength={100}
        hint="Ketik minimal 2 huruf." />
      {hasil && (
        <ul className="mt-2 divide-y divide-line rounded-control border border-line">
          {hasil.length === 0 && <li className="px-4 py-3 text-sm text-ink-faint">Klien tidak ditemukan. Pilih &ldquo;Klien baru&rdquo; di atas.</li>}
          {hasil.map((k) => (
            <li key={k.id_klien}>
              <button type="button" onClick={() => onPilih(k)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-violet-tint">
                <span className="font-medium">{k.nama_lengkap}</span>
                <span className="text-ink-soft"> {k.nomor_rekam_psikologi}{k.no_hp ? `, ${k.no_hp}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function BookingAdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [master, setMaster] = useState(null);
  const [errorMuat, setErrorMuat] = useState(null);
  const [mode, setMode] = useState('tanpa_akun');
  const [klienTerpilih, setKlienTerpilih] = useState(null);
  const [baru, setBaru] = useState({ nama_lengkap: '', no_hp: '', jenis_kelamin: '', tanggal_lahir: '', email: '' });
  const [form, setForm] = useState({ id_layanan: '', tipe_sesi: 'Offline', id_psikolog: '', tanggal: isoLokal(), metode_bayar: 'Tunai', total_bayar: '', alasan_ubah_nominal: '', catatan_klien: '' });
  const [slots, setSlots] = useState(null);
  const [slot, setSlot] = useState('');
  const [jamBaru, setJamBaru] = useState({ jam_mulai: '', jam_selesai: '' });
  const [setuju, setSetuju] = useState(false);
  const [fieldErr, setFieldErr] = useState({});
  const [error, setError] = useState(null);
  const [konfirmasi, setKonfirmasi] = useState(false);

  const muat = () => {
    setErrorMuat(null);
    Promise.all([api.get('/layanan'), api.get('/admin/psikolog', { limit: 50 })])
      .then(([l, p]) => setMaster({ layanan: l.data, psikolog: p.data.filter((x) => x.akun?.is_active) }))
      .catch((e) => setErrorMuat(e.message));
  };
  useEffect(() => { muat(); }, []);

  useEffect(() => {
    setSlot(''); setSlots(null);
    if (!form.id_psikolog || !form.tanggal) return;
    api.get(`/admin/psikolog/${form.id_psikolog}/jadwal`, { dari: form.tanggal, sampai: form.tanggal, status: 'Tersedia', limit: 50 })
      // Slot yang sudah berakhir tidak dapat dipakai
      .then((r) => setSlots(r.data.filter((x) => new Date(`${x.tanggal}T${x.jam_selesai}`) > new Date()))).catch(() => setSlots([]));
  }, [form.id_psikolog, form.tanggal]);

  const lay = useMemo(() => master?.layanan.find((l) => String(l.id_layanan) === form.id_layanan), [master, form.id_layanan]);
  const psi = master?.psikolog.find((p) => String(p.id_psikolog) === form.id_psikolog);
  const harga = lay ? Number(lay.harga) : 0;
  const total = form.total_bayar === '' ? harga : Number(form.total_bayar);
  const nominalBerubah = lay && total !== harga;

  if (errorMuat) return <ErrorState message={errorMuat} onRetry={muat} />;
  if (!master) return <Loading />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setB = (k) => (e) => setBaru({ ...baru, [k]: e.target.value });
  const pilihJamBaru = (mulai) => setJamBaru({ jam_mulai: mulai, jam_selesai: mulai ? tambahMenit(mulai, lay?.durasi_menit || 60) : '' });

  const klienSiap = mode === 'terdaftar' ? !!klienTerpilih : baru.nama_lengkap.trim() && (mode !== 'buat_akun' || baru.email.trim());
  const jadwalSiap = form.id_psikolog && form.tanggal && (slot && slot !== JAM_LAIN ? true : slot === JAM_LAIN && jamBaru.jam_mulai && jamBaru.jam_selesai);
  const siap = klienSiap && lay && jadwalSiap && (!nominalBerubah || form.alasan_ubah_nominal.trim()) && setuju;

  const payload = () => {
    const p = {
      id_layanan: Number(form.id_layanan), tipe_sesi: form.tipe_sesi, klien_mode: mode, metode_bayar: form.metode_bayar,
      setuju_persetujuan: true, catatan_klien: form.catatan_klien.trim() || undefined,
    };
    if (mode === 'terdaftar') p.id_klien = klienTerpilih.id_klien;
    else {
      p.nama_lengkap = baru.nama_lengkap.trim();
      if (baru.no_hp.trim()) p.no_hp = baru.no_hp.trim();
      if (baru.jenis_kelamin) p.jenis_kelamin = baru.jenis_kelamin;
      if (baru.tanggal_lahir) p.tanggal_lahir = baru.tanggal_lahir;
      if (mode === 'buat_akun') p.email = baru.email.trim();
    }
    if (slot === JAM_LAIN) Object.assign(p, { id_psikolog: Number(form.id_psikolog), tanggal: form.tanggal, ...jamBaru });
    else p.id_jadwal = Number(slot);
    if (nominalBerubah) Object.assign(p, { total_bayar: total, alasan_ubah_nominal: form.alasan_ubah_nominal.trim() });
    return p;
  };

  const simpan = async () => {
    setError(null); setFieldErr({});
    try {
      const r = await api.post('/admin/booking', payload());
      toast(`Booking ${r.data.kode_booking} dibuat dan tercatat lunas`);
      router.replace(`/admin/sesi/${r.data.id_sesi}`);
    } catch (e) {
      setError(e.message); setFieldErr(e.fieldErrors?.() || {}); setKonfirmasi(false);
      toast(e.message, 'error');
    }
  };

  const jadwalTeks = slot === JAM_LAIN
    ? `${fmtTanggal(form.tanggal, { hari: true })}, ${jamBaru.jam_mulai}–${jamBaru.jam_selesai} WIB`
    : (() => { const s = slots?.find((x) => String(x.id_jadwal) === slot); return s ? `${fmtTanggal(s.tanggal, { hari: true })}, ${jam(s.jam_mulai)}–${jam(s.jam_selesai)} WIB` : '-'; })();
  const namaKlien = mode === 'terdaftar' ? klienTerpilih?.nama_lengkap : baru.nama_lengkap;

  return (
    <>
      <Link href="/admin/sesi" className="text-sm text-ink-soft hover:text-ink">Sesi dan monitoring</Link>
      <PageHeader title="Booking mendesak" description="Untuk klien yang datang langsung atau membutuhkan layanan hari ini. Pembayaran langsung tercatat lunas." />
      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Panel title="Klien">
            <div className="space-y-5 px-5 py-5">
              <PilihanRadio name="mode" value={mode} onChange={(v) => { setMode(v); setFieldErr({}); }} options={MODE_KLIEN} />
              {mode === 'terdaftar' ? <CariKlien value={klienTerpilih} onPilih={setKlienTerpilih} /> : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Nama lengkap" required maxLength={150} value={baru.nama_lengkap} onChange={setB('nama_lengkap')} error={fieldErr.nama_lengkap} className="sm:col-span-2" />
                  {mode === 'buat_akun' && <Input label="Email klien" type="email" required maxLength={255} value={baru.email} onChange={setB('email')} error={fieldErr.email} hint="Tautan atur password dikirim ke email ini (berlaku 72 jam)." className="sm:col-span-2" />}
                  <Input label="Nomor HP" type="tel" inputMode="tel" maxLength={16} placeholder="081234567890" value={baru.no_hp} onChange={setB('no_hp')} error={fieldErr.no_hp} />
                  <Select label="Jenis kelamin" placeholder="Pilih" value={baru.jenis_kelamin} onChange={setB('jenis_kelamin')} options={['Laki-laki', 'Perempuan']} />
                  <Input label="Tanggal lahir" type="date" max={isoLokal()} value={baru.tanggal_lahir} onChange={setB('tanggal_lahir')} error={fieldErr.tanggal_lahir} />
                </div>
              )}
              <p className="text-[13px] text-ink-faint">Formulir identitas atau riwayat anak boleh dilengkapi setelah booking, oleh admin atau oleh klien bila memiliki akun.</p>
            </div>
          </Panel>

          <Panel title="Layanan dan jadwal">
            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Layanan" required placeholder="Pilih layanan" value={form.id_layanan} onChange={(e) => {
                  const l = master.layanan.find((x) => String(x.id_layanan) === e.target.value);
                  setForm({ ...form, id_layanan: e.target.value, total_bayar: '' });
                  if (jamBaru.jam_mulai) setJamBaru({ ...jamBaru, jam_selesai: tambahMenit(jamBaru.jam_mulai, l?.durasi_menit || 60) });
                }}
                  options={master.layanan.map((l) => ({ value: String(l.id_layanan), label: `${l.nama_layanan} (${rupiah(l.harga)})` }))} />
                <Select label="Jenis sesi" required value={form.tipe_sesi} onChange={set('tipe_sesi')}
                  options={[{ value: 'Offline', label: 'Tatap muka di klinik' }, { value: 'Online', label: 'Daring (online)' }]} />
                <Select label="Psikolog" required placeholder="Pilih psikolog" value={form.id_psikolog} onChange={set('id_psikolog')}
                  options={master.psikolog.map((p) => ({ value: String(p.id_psikolog), label: p.nama_lengkap }))} />
                <Input label="Tanggal" type="date" required min={isoLokal()} value={form.tanggal} onChange={set('tanggal')} />
              </div>
              {form.id_psikolog && (
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Jam</legend>
                  {!slots ? <Spinner /> : (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {slots.map((s) => (
                        <label key={s.id_jadwal} className={`cursor-pointer rounded-control border px-4 py-2.5 text-sm tabular ${slot === String(s.id_jadwal) ? 'border-violet bg-violet-tint font-semibold text-violet-deep' : 'border-line hover:border-violet-line'}`}>
                          <input type="radio" name="slot" className="sr-only" checked={slot === String(s.id_jadwal)} onChange={() => setSlot(String(s.id_jadwal))} />
                          {jam(s.jam_mulai)}–{jam(s.jam_selesai)}
                        </label>
                      ))}
                      <label className={`cursor-pointer rounded-control border px-4 py-2.5 text-sm ${slot === JAM_LAIN ? 'border-violet bg-violet-tint font-semibold text-violet-deep' : 'border-line hover:border-violet-line'}`}>
                        <input type="radio" name="slot" className="sr-only" checked={slot === JAM_LAIN} onChange={() => setSlot(JAM_LAIN)} />
                        Jam lain
                      </label>
                    </div>
                  )}
                  {slots?.length === 0 && <p className="mt-2 text-[13px] text-ink-faint">Belum ada slot kosong pada tanggal ini. Pilih &ldquo;Jam lain&rdquo; untuk membuat jadwal baru.</p>}
                  {slot === JAM_LAIN && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Input label="Jam mulai" type="time" required value={jamBaru.jam_mulai} onChange={(e) => pilihJamBaru(e.target.value)} error={fieldErr.jam_mulai} />
                      <Input label="Jam selesai" type="time" required value={jamBaru.jam_selesai} onChange={(e) => setJamBaru({ ...jamBaru, jam_selesai: e.target.value })} error={fieldErr.jam_selesai}
                        hint={lay ? `Durasi layanan ${lay.durasi_menit} menit.` : undefined} />
                    </div>
                  )}
                </fieldset>
              )}
              <Textarea label="Catatan (opsional)" rows={2} maxLength={1000} value={form.catatan_klien} onChange={set('catatan_klien')} hint="Misalnya keluhan singkat atau kebutuhan khusus klien." />
            </div>
          </Panel>

          <Panel title="Pembayaran">
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              <Select label="Metode pembayaran" required value={form.metode_bayar} onChange={set('metode_bayar')} options={['Tunai', 'Transfer Bank']} />
              <Input label="Nominal (Rp)" type="number" inputMode="numeric" min={0} placeholder={lay ? String(harga) : 'Pilih layanan dulu'}
                value={form.total_bayar} onChange={set('total_bayar')} error={fieldErr.total_bayar}
                hint={lay ? `Harga layanan ${rupiah(harga)}. Kosongkan bila sesuai harga.` : undefined} />
              {nominalBerubah && (
                <>
                  <Input label="Alasan perubahan nominal" required maxLength={255} placeholder="Contoh: diskon sosial" value={form.alasan_ubah_nominal}
                    onChange={set('alasan_ubah_nominal')} error={fieldErr.alasan_ubah_nominal} className="sm:col-span-2" />
                  <Alert type="warning" className="sm:col-span-2">Nominal berbeda dari harga layanan. Fee psikolog tetap mengikuti tarif layanan.</Alert>
                </>
              )}
            </div>
          </Panel>
        </div>

        <aside className="h-fit rounded-panel border border-line bg-white lg:sticky lg:top-24">
          <h2 className="border-b border-line px-5 py-3.5 text-[15px] font-semibold">Ringkasan</h2>
          <dl className="space-y-3 px-5 py-4 text-sm">
            <div><dt className="text-ink-faint">Klien</dt><dd className="font-medium">{namaKlien || '-'}</dd></div>
            <div><dt className="text-ink-faint">Layanan</dt><dd className="font-medium">{lay?.nama_layanan || '-'}</dd></div>
            <div><dt className="text-ink-faint">Psikolog</dt><dd className="font-medium">{psi?.nama_lengkap || '-'}</dd></div>
            <div><dt className="text-ink-faint">Jadwal</dt><dd className="font-medium">{slot ? jadwalTeks : '-'}</dd></div>
            <div className="flex items-baseline justify-between border-t border-line pt-3"><dt>Total ({form.metode_bayar})</dt><dd className="text-xl font-semibold tabular">{lay ? rupiah(total) : '-'}</dd></div>
          </dl>
          <div className="px-5 pb-5">
            <Checkbox className="mb-4" checked={setuju} onChange={(e) => setSetuju(e.target.checked)}>
              Klien atau wali sudah membaca dan menyetujui{' '}
              <Link href="/persetujuan-layanan" target="_blank" className="font-semibold text-violet-deep underline">Persetujuan Layanan Psikologi</Link>.
            </Checkbox>
            <Button className="w-full" size="lg" disabled={!siap} onClick={() => setKonfirmasi(true)}>Buat booking</Button>
          </div>
        </aside>
      </div>

      <ConfirmDialog open={konfirmasi} onClose={() => setKonfirmasi(false)} onConfirm={simpan} title="Buat booking dan catat lunas?" confirmLabel="Ya, buat booking">
        {namaKlien}, {lay?.nama_layanan}, {jadwalTeks}. Pembayaran {rupiah(total)} ({form.metode_bayar}) langsung tercatat lunas dan masuk laporan keuangan.
        {mode === 'buat_akun' && ` Email untuk mengatur password dikirim ke ${baru.email}.`}
      </ConfirmDialog>
    </>
  );
}
