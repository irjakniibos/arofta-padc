'use client';

/**
 * Pemesanan layanan: pilih layanan, profil yang diperiksa, jenis sesi, tanggal & jam dari kalender.
 * Sistem memeriksa formulir intake yang diwajibkan layanan sebelum booking dikirim.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import KalenderBulan from '@/components/kalender/KalenderBulan';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { Select, Textarea } from '@/components/ui/Field';
import { Loading } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { rupiah, durasi, jam, tanggal } from '@/lib/format';

const now = new Date();

function Langkah({ no, judul, children, selesai }) {
  return (
    <section className="rounded-panel border border-line bg-white">
      <h2 className="flex items-center gap-3 border-b border-line px-5 py-3.5 text-[15px] font-semibold">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] tabular ${selesai ? 'bg-violet text-white' : 'border border-violet text-violet-deep'}`}>{no}</span>
        {judul}
      </h2>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export default function FormBooking() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [layanan, setLayanan] = useState(null);
  const [profil, setProfil] = useState(null);
  const [pilihan, setPilihan] = useState({ id_layanan: params.get('layanan') || '', id_klien: '', tipe_sesi: 'Online', catatan_klien: '' });
  const [detailProfil, setDetailProfil] = useState(null);
  const [periode, setPeriode] = useState({ tahun: now.getFullYear(), bulan: now.getMonth() + 1 });
  const [ringkasan, setRingkasan] = useState(null);
  const [tgl, setTgl] = useState(null);
  const [slots, setSlots] = useState(null);
  const [slot, setSlot] = useState(null);
  const [kirim, setKirim] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/layanan'), api.get('/klien/profil')]).then(([l, p]) => {
      setLayanan(l.data); setProfil(p.data);
      setPilihan((s) => ({ ...s, id_klien: s.id_klien || String(p.data[0]?.id_klien || '') }));
    }).catch((e) => setError(e.message));
  }, []);

  // ?jadwal= dari halaman jadwal publik: temukan tanggal & slotnya
  useEffect(() => {
    const idJadwal = Number(params.get('jadwal'));
    if (!idJadwal) return;
    api.get('/jadwal/tersedia').then((r) => {
      const s = r.data.find((x) => x.id_jadwal === idJadwal);
      if (!s) return;
      const [y, m] = s.tanggal.split('-').map(Number);
      setPeriode({ tahun: y, bulan: m }); setTgl(s.tanggal); setSlot(s);
      if (s.tipe_sesi !== 'Keduanya') setPilihan((p) => ({ ...p, tipe_sesi: s.tipe_sesi }));
    }).catch(() => {});
  }, [params]);

  useEffect(() => {
    if (!pilihan.id_klien) return;
    setDetailProfil(null);
    api.get(`/klien/profil/${pilihan.id_klien}`).then((r) => setDetailProfil(r.data)).catch(() => {});
  }, [pilihan.id_klien]);

  useEffect(() => {
    setRingkasan(null);
    api.get('/jadwal/kalender', { ...periode, tipe_sesi: pilihan.tipe_sesi })
      .then((r) => setRingkasan(Object.fromEntries(r.data.tanggal.map((t) => [t.tanggal, t])))).catch((e) => setError(e.message));
  }, [periode, pilihan.tipe_sesi]);

  useEffect(() => {
    if (!tgl) { setSlots(null); return; }
    setSlots(null);
    api.get('/jadwal/tersedia', { tanggal: tgl, tipe_sesi: pilihan.tipe_sesi }).then((r) => setSlots(r.data)).catch((e) => setError(e.message));
  }, [tgl, pilihan.tipe_sesi]);

  const lay = useMemo(() => layanan?.find((l) => String(l.id_layanan) === String(pilihan.id_layanan)), [layanan, pilihan.id_layanan]);

  const intakeOk = useMemo(() => {
    if (!lay || !detailProfil) return null;
    if (lay.jenis_intake === 'Dewasa') return !!detailProfil.intakeDewasa?.pernyataan_benar;
    if (lay.jenis_intake === 'Anak') return !!detailProfil.intakeAnak;
    return true;
  }, [lay, detailProfil]);

  if (!layanan || !profil) return error ? <Alert type="error">{error}</Alert> : <Loading />;

  const siap = lay && pilihan.id_klien && intakeOk && slot;

  const submit = async () => {
    setKirim(true);
    try {
      const r = await api.post('/klien/booking', {
        id_klien: Number(pilihan.id_klien), id_layanan: Number(pilihan.id_layanan), id_jadwal: slot.id_jadwal,
        tipe_sesi: pilihan.tipe_sesi, catatan_klien: pilihan.catatan_klien || undefined,
      });
      toast('Booking berhasil. Selesaikan pembayaran sebelum batas waktu.');
      router.replace(`/klien/sesi/${r.data.id_sesi}`);
    } catch (e) {
      toast(e.message, 'error');
      if (e.status === 409) { setSlot(null); setTgl(null); setPeriode({ ...periode }); }
    } finally {
      setKirim(false);
    }
  };

  return (
    <>
      <PageHeader title="Pesan layanan" description="Pilih layanan, siapa yang diperiksa, lalu tentukan jadwal." />
      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Langkah no={1} judul="Layanan dan profil" selesai={!!lay && !!pilihan.id_klien}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Layanan" required value={pilihan.id_layanan} placeholder="Pilih layanan"
                options={layanan.map((l) => ({ value: String(l.id_layanan), label: `${l.nama_layanan} (${rupiah(l.harga)})` }))}
                onChange={(e) => setPilihan({ ...pilihan, id_layanan: e.target.value })} />
              <Select label="Yang diperiksa" required value={pilihan.id_klien}
                options={profil.map((p) => ({ value: String(p.id_klien), label: `${p.nama_lengkap}${p.hubungan_akun !== 'Diri Sendiri' ? ` (${p.hubungan_akun.toLowerCase()})` : ''}` }))}
                onChange={(e) => setPilihan({ ...pilihan, id_klien: e.target.value })} />
            </div>
            {lay && <p className="mt-3 text-sm text-ink-soft">{lay.deskripsi} Durasi {durasi(lay.durasi_menit)}.</p>}
            {intakeOk === false && (
              <Alert type="warning" className="mt-4" title="Formulir belum lengkap">
                Layanan ini memerlukan {lay.jenis_intake === 'Anak' ? 'Formulir Informasi Riwayat Anak' : 'Formulir Identitas Klien (termasuk centang pernyataan)'}.{' '}
                <Link className="font-semibold underline" href={`/klien/profil/${pilihan.id_klien}?tab=${lay.jenis_intake === 'Anak' ? 'anak' : 'dewasa'}`}>Isi formulir sekarang</Link>
              </Alert>
            )}
          </Langkah>

          <Langkah no={2} judul="Jadwal" selesai={!!slot}>
            <fieldset className="mb-5">
              <legend className="mb-2 text-sm font-medium">Jenis sesi</legend>
              <div className="flex flex-wrap gap-2">
                {[['Online', 'Daring (online)'], ['Offline', 'Tatap muka di klinik']].map(([v, l]) => (
                  <label key={v} className={`cursor-pointer rounded-control border px-4 py-2 text-sm ${pilihan.tipe_sesi === v ? 'border-violet bg-violet-tint font-semibold text-violet-deep' : 'border-line'}`}>
                    <input type="radio" name="tipe" value={v} className="sr-only" checked={pilihan.tipe_sesi === v}
                      onChange={() => { setPilihan({ ...pilihan, tipe_sesi: v }); setSlot(null); }} />{l}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="relative">
              <KalenderBulan tahun={periode.tahun} bulan={periode.bulan} minBulan={{ tahun: now.getFullYear(), bulan: now.getMonth() + 1 }}
                onGanti={(tahun, bulan) => { setPeriode({ tahun, bulan }); setTgl(null); setSlot(null); }}
                dipilih={tgl} onPilih={(d) => { setTgl(d); setSlot(null); }} aktif={(iso) => !!ringkasan?.[iso]}
                renderIsi={(iso) => ringkasan?.[iso] && <span className="mt-auto text-[11px] text-violet-deep sm:text-[12px]">{ringkasan[iso].slot_tersedia} jam</span>} />
              {!ringkasan && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><Spinner /></div>}
            </div>
            {tgl && (
              <div className="mt-5">
                <p className="text-sm font-medium">Jam tersedia, {tanggal(tgl, { hari: true })}</p>
                {!slots ? <div className="py-4"><Spinner /></div> : (
                  <div role="radiogroup" className="mt-3 grid gap-2 sm:grid-cols-2">
                    {slots.map((s) => {
                      const aktif = slot?.id_jadwal === s.id_jadwal;
                      return (
                        <button key={s.id_jadwal} type="button" role="radio" aria-checked={aktif} onClick={() => setSlot(s)}
                          className={`rounded-control border px-4 py-3 text-left text-sm ${aktif ? 'border-violet bg-violet-tint' : 'border-line hover:border-violet-line'}`}>
                          <span className="block font-semibold tabular">{jam(s.jam_mulai)}–{jam(s.jam_selesai)} WIB</span>
                          <span className="text-ink-soft">{s.psikolog.nama_lengkap}</span>
                        </button>
                      );
                    })}
                    {slots.length === 0 && <p className="text-sm text-ink-faint">Jam pada tanggal ini sudah terisi.</p>}
                  </div>
                )}
              </div>
            )}
          </Langkah>

          <Langkah no={3} judul="Catatan untuk psikolog (opsional)">
            <Textarea label="Hal yang perlu diketahui psikolog sebelum sesi" maxLength={1000} rows={3}
              value={pilihan.catatan_klien} onChange={(e) => setPilihan({ ...pilihan, catatan_klien: e.target.value })} />
          </Langkah>
        </div>

        <aside className="h-fit rounded-panel border border-line bg-white lg:sticky lg:top-24">
          <h2 className="border-b border-line px-5 py-3.5 text-[15px] font-semibold">Ringkasan</h2>
          <dl className="space-y-3 px-5 py-4 text-sm">
            <div><dt className="text-ink-faint">Layanan</dt><dd className="font-medium">{lay?.nama_layanan || '-'}</dd></div>
            <div><dt className="text-ink-faint">Diperiksa</dt><dd className="font-medium">{profil.find((p) => String(p.id_klien) === pilihan.id_klien)?.nama_lengkap || '-'}</dd></div>
            <div><dt className="text-ink-faint">Jadwal</dt><dd className="font-medium">{slot ? `${tanggal(slot.tanggal, { hari: true })}, ${jam(slot.jam_mulai)} WIB` : '-'}</dd></div>
            <div><dt className="text-ink-faint">Psikolog</dt><dd className="font-medium">{slot?.psikolog?.nama_lengkap || '-'}</dd></div>
            <div><dt className="text-ink-faint">Sesi</dt><dd className="font-medium">{pilihan.tipe_sesi === 'Online' ? 'Daring' : 'Tatap muka'}</dd></div>
            <div className="flex items-baseline justify-between border-t border-line pt-3"><dt>Total</dt><dd className="text-xl font-semibold tabular">{lay ? rupiah(lay.harga) : '-'}</dd></div>
          </dl>
          <div className="px-5 pb-5">
            <Button className="w-full" size="lg" disabled={!siap} loading={kirim} onClick={submit}>Pesan dan lanjut ke pembayaran</Button>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">Pembayaran melalui transfer bank. Batas waktu pembayaran ditampilkan setelah pemesanan.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
