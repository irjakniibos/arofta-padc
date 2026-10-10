'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import KalenderBulan from '@/components/kalender/KalenderBulan';
import { Select } from '@/components/ui/Field';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { jam, tanggal } from '@/lib/format';

const now = new Date();

export default function JadwalTersedia() {
  const params = useSearchParams();
  const [periode, setPeriode] = useState({ tahun: now.getFullYear(), bulan: now.getMonth() + 1 });
  const [filter, setFilter] = useState({ id_psikolog: params.get('psikolog') || '', tipe_sesi: '' });
  const [psikolog, setPsikolog] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [dipilih, setDipilih] = useState(null);
  const [slot, setSlot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { api.get('/psikolog').then((r) => setPsikolog(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setRingkasan(null); setError(null);
    api.get('/jadwal/kalender', { ...periode, ...filter }, { signal: ctrl.signal })
      .then((r) => setRingkasan(Object.fromEntries(r.data.tanggal.map((t) => [t.tanggal, t]))))
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); });
    return () => ctrl.abort();
  }, [periode, filter]);

  useEffect(() => {
    if (!dipilih) return undefined;
    const ctrl = new AbortController();
    setSlot(null);
    api.get('/jadwal/tersedia', { tanggal: dipilih, ...filter }, { signal: ctrl.signal })
      .then((r) => setSlot(r.data)).catch((e) => { if (e.name !== 'AbortError') setError(e.message); });
    return () => ctrl.abort();
  }, [dipilih, filter]);

  const perPsikolog = useMemo(() => {
    const m = new Map();
    (slot || []).forEach((s) => {
      const k = s.id_psikolog;
      if (!m.has(k)) m.set(k, { nama: s.psikolog.nama_lengkap, spesialisasi: s.psikolog.spesialisasi, slot: [] });
      m.get(k).slot.push(s);
    });
    return Array.from(m.values());
  }, [slot]);

  return (
    <div className="mt-8 grid gap-10 [&>*]:min-w-0 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Select label="Psikolog" value={filter.id_psikolog} placeholder="Semua psikolog"
            options={psikolog.map((p) => ({ value: String(p.id_psikolog), label: p.nama_lengkap }))}
            onChange={(e) => { setFilter({ ...filter, id_psikolog: e.target.value }); setDipilih(null); }} />
          <Select label="Jenis sesi" value={filter.tipe_sesi} placeholder="Daring dan tatap muka"
            options={[{ value: 'Online', label: 'Daring (online)' }, { value: 'Offline', label: 'Tatap muka di klinik' }]}
            onChange={(e) => { setFilter({ ...filter, tipe_sesi: e.target.value }); setDipilih(null); }} />
        </div>
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <div className="relative">
          <KalenderBulan
            tahun={periode.tahun} bulan={periode.bulan} minBulan={{ tahun: now.getFullYear(), bulan: now.getMonth() + 1 }}
            onGanti={(tahun, bulan) => { setPeriode({ tahun, bulan }); setDipilih(null); }}
            dipilih={dipilih} onPilih={setDipilih}
            aktif={(iso) => !!ringkasan?.[iso]}
            renderIsi={(iso) => ringkasan?.[iso] && (
              <span className="mt-auto text-[11px] leading-tight text-violet-deep sm:text-[12px]">
                {ringkasan[iso].slot_tersedia} jam<span className="hidden sm:inline"> kosong</span>
              </span>
            )}
          />
          {!ringkasan && !error && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><Spinner label="Memuat jadwal" /></div>}
        </div>
        {ringkasan && Object.keys(ringkasan).length === 0 && (
          <p className="mt-4 text-sm text-ink-soft">Tidak ada jam kosong di bulan ini. Coba bulan berikutnya atau ubah filter.</p>
        )}
      </div>

      <aside aria-live="polite" className="lg:pt-[92px]">
        {!dipilih ? (
          <div className="rounded-panel border border-dashed border-line p-6 text-sm text-ink-soft">Pilih tanggal yang ditandai untuk melihat jam yang tersedia.</div>
        ) : (
          <div className="rounded-panel border border-line">
            <h3 className="border-b border-line px-5 py-4 font-semibold">{tanggal(dipilih, { hari: true })}</h3>
            {!slot ? <div className="p-5"><Spinner label="Memuat jam" /></div> : (
              <ul className="divide-y divide-line">
                {perPsikolog.map((p) => (
                  <li key={p.nama} className="px-5 py-4">
                    <p className="font-medium">{p.nama}</p>
                    {p.spesialisasi && <p className="text-[13px] text-ink-faint">{p.spesialisasi}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.slot.map((s) => (
                        <Link key={s.id_jadwal} href={`/klien/booking?jadwal=${s.id_jadwal}`}
                          className="rounded-control border border-violet-line px-3 py-1.5 text-sm text-violet-deep hover:bg-violet-tint">
                          <span className="tabular">{jam(s.jam_mulai)}–{jam(s.jam_selesai)}</span>
                          {s.tipe_sesi !== 'Keduanya' && <Badge tone="neutral" className="ml-2">{s.tipe_sesi === 'Online' ? 'Daring' : 'Tatap muka'}</Badge>}
                        </Link>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-line px-5 py-3 text-[13px] text-ink-faint">Pilih jam untuk melanjutkan pemesanan. Anda akan diminta masuk terlebih dahulu.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
