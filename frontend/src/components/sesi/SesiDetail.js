'use client';

/**
 * Detail sesi untuk psikolog (mode="psikolog") dan admin (mode="admin").
 * Psikolog: data klien, catatan klinis, laporan, ubah status.
 * Admin: + tautan Zoom/lokasi, jadwal ulang/ganti psikolog, pembatalan, buka kembali laporan.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Video, MapPin } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import { Input } from '@/components/ui/Field';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import DataKlien from './DataKlien';
import CatatanKlinis from './CatatanKlinis';
import LaporanForm from './LaporanForm';
import { api } from '@/lib/api';
import { jam, tanggal, rupiah, isoLokal } from '@/lib/format';

function TautanForm({ sesi, onDone }) {
  const toast = useToast();
  const online = sesi.tipe_sesi === 'Online';
  const [v, setV] = useState(online ? sesi.tautan_zoom || '' : sesi.lokasi_ruangan || '');
  const [saving, setSaving] = useState(false);
  const kirim = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.patch(`/admin/sesi/${sesi.id_sesi}/tautan`, online ? { tautan_zoom: v.trim() } : { lokasi_ruangan: v.trim() }); toast('Terkirim ke klien dan psikolog'); onDone(); } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={kirim} className="space-y-3 px-5 py-4">
      <Input label={online ? 'Tautan Zoom / Google Meet' : 'Lokasi ruangan'} required type={online ? 'url' : 'text'} maxLength={online ? 512 : 255}
        placeholder={online ? 'https://zoom.us/j/...' : 'Ruang konseling 1, lantai 1'} value={v} onChange={(e) => setV(e.target.value)}
        hint={online ? 'Harus diawali https://' : undefined} />
      <Button type="submit" size="sm" loading={saving}>{(online ? sesi.tautan_zoom : sesi.lokasi_ruangan) ? 'Perbarui & kirim ulang' : 'Simpan & kirim'}</Button>
    </form>
  );
}

function JadwalUlang({ sesi, open, onClose, onDone }) {
  const toast = useToast();
  const [tgl, setTgl] = useState('');
  const [slots, setSlots] = useState(null);
  const [pilih, setPilih] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!tgl) return;
    setSlots(null); setPilih(null);
    api.get('/admin/jadwal/tersedia', { tanggal: tgl, tipe_sesi: sesi.tipe_sesi }).then((r) => setSlots(r.data)).catch((e) => toast(e.message, 'error'));
  }, [tgl, sesi.tipe_sesi, toast]);
  const simpan = async () => {
    setSaving(true);
    try { await api.patch(`/admin/sesi/${sesi.id_sesi}/alokasi`, { id_jadwal: pilih }); toast('Jadwal diperbarui, klien dan psikolog diberi tahu'); onDone(); onClose(); } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Jadwal ulang / ganti psikolog" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Batal</Button><Button disabled={!pilih} loading={saving} onClick={simpan}>Pindahkan sesi</Button></>}>
      <Input label="Tanggal baru" type="date" min={isoLokal()} value={tgl} onChange={(e) => setTgl(e.target.value)} />
      {tgl && (!slots ? <Loading label="Memuat slot" /> : slots.length === 0 ? <p className="mt-4 text-sm text-ink-faint">Tidak ada slot kosong pada tanggal ini.</p> : (
        <div role="radiogroup" className="mt-4 grid gap-2 sm:grid-cols-2">
          {slots.map((s) => (
            <button key={s.id_jadwal} type="button" role="radio" aria-checked={pilih === s.id_jadwal} onClick={() => setPilih(s.id_jadwal)}
              className={`rounded-control border px-4 py-3 text-left text-sm ${pilih === s.id_jadwal ? 'border-violet bg-violet-tint' : 'border-line'}`}>
              <span className="block font-semibold tabular">{jam(s.jam_mulai)}–{jam(s.jam_selesai)} WIB</span>
              <span className="text-ink-soft">{s.psikolog.nama_lengkap}</span>
            </button>
          ))}
        </div>
      ))}
    </Modal>
  );
}

export default function SesiDetail({ id, mode }) {
  const toast = useToast();
  const isAdmin = mode === 'admin';
  const [sesi, setSesi] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('klien');
  const [dialog, setDialog] = useState(null);

  const load = () => api.get(`/${mode}/sesi/${id}`).then((r) => setSesi(r.data)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!sesi) return <Loading />;

  const bayar = sesi.pembayaran?.status_pembayaran;
  const lunas = bayar === 'Lunas';
  const aktif = ['Terdaftar', 'Berjalan'].includes(sesi.status_asesmen);
  const jenisIntake = sesi.layanan?.jenis_intake;
  const intakeKurang = aktif && ((jenisIntake === 'Dewasa' && !sesi.klien.intakeDewasa?.pernyataan_benar) || (jenisIntake === 'Anak' && !sesi.klien.intakeAnak));
  const namaFormulir = jenisIntake === 'Anak' ? 'Formulir Informasi Riwayat Anak' : 'Formulir Identitas Klien';

  const ubahStatus = async (status) => {
    try { await api.patch(`/${mode}/sesi/${id}/status`, { status }); toast(status === 'Berjalan' ? 'Sesi dimulai' : 'Sesi selesai, fee psikolog tercatat'); load(); } catch (e) { toast(e.message, 'error'); }
    setDialog(null);
  };

  return (
    <>
      <Link href={`/${mode}/sesi`} className="text-sm text-ink-soft hover:text-ink">{isAdmin ? 'Sesi & monitoring' : 'Sesi klien'}</Link>
      <PageHeader title={`${sesi.klien.nama_lengkap}`} description={`${sesi.layanan?.nama_layanan}, kode ${sesi.kode_booking}`}
        action={(
          <div className="flex flex-wrap gap-2">
            {sesi.status_asesmen === 'Terdaftar' && <Button disabled={!lunas} title={!lunas ? 'Menunggu pembayaran lunas' : undefined} onClick={() => setDialog('mulai')}>Mulai sesi</Button>}
            {sesi.status_asesmen === 'Berjalan' && <Button onClick={() => setDialog('selesai')}>Tandai sesi selesai</Button>}
          </div>
        )} />

      {intakeKurang && (
        <Alert type="warning" className="mb-6" title={`${namaFormulir} belum lengkap`}>
          {isAdmin
            ? <>Lengkapi dari formulir kertas klien melalui <Link href={`/admin/klien/${sesi.klien.id_klien}`} className="font-semibold underline">halaman klien</Link>{sesi.klien.akun ? ', atau minta klien mengisinya di akunnya' : ''}.</>
            : 'Klien didaftarkan admin untuk kebutuhan mendesak. Formulir menyusul; sesi tetap dapat dimulai.'}
        </Alert>
      )}
      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-panel border border-line bg-white p-5">
          <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[
            { value: 'klien', label: 'Data klien' }, { value: 'klinis', label: 'Catatan klinis' },
            { value: 'laporan', label: 'Laporan hasil' }, { value: 'riwayat', label: 'Riwayat sesi', count: sesi.riwayat_sesi_klien?.length },
          ]} />
          {tab === 'klien' && <DataKlien klien={sesi.klien} />}
          {tab === 'klinis' && <CatatanKlinis sesi={sesi} editable={!isAdmin} onSaved={load} />}
          {tab === 'laporan' && (isAdmin ? (
            sesi.laporan ? (
              <div className="space-y-4">
                <p className="text-sm">Status laporan: <Badge status={sesi.laporan.status_laporan} /></p>
                {sesi.laporan.status_laporan === 'Final' && (
                  <div className="flex flex-wrap gap-2">
                    <a href={api.fileUrl(`/laporan/${sesi.laporan.id_laporan}/unduh`)} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-control bg-violet px-4 text-sm font-semibold text-white"><Download className="h-4 w-4" />Unduh PDF</a>
                    <a href={api.fileUrl(`/laporan/${sesi.laporan.id_laporan}/unduh`, { format: 'docx' })} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-control border border-violet-line px-4 text-sm font-semibold text-violet-deep">Unduh Word</a>
                    <Button variant="ghost" onClick={() => setDialog('buka')}>Buka kembali untuk revisi</Button>
                  </div>
                )}
              </div>
            ) : <p className="text-sm text-ink-faint">Psikolog belum mengisi laporan.</p>
          ) : <LaporanForm sesi={sesi} onChanged={load} />)}
          {tab === 'riwayat' && (
            <ul className="divide-y divide-line">
              {sesi.riwayat_sesi_klien.map((r) => (
                <li key={r.id_sesi} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span><span className="font-medium">{tanggal(r.tanggal)}</span> <span className="text-ink-soft">{r.layanan?.nama_layanan}, {r.psikolog?.nama_lengkap}</span></span>
                  <span className="flex items-center gap-2">{r.id_sesi === sesi.id_sesi && <span className="text-[12px] text-ink-faint">sesi ini</span>}<Badge status={r.status_asesmen} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Sesi" action={<Badge status={sesi.status_asesmen} />}>
            <dl className="divide-y divide-line text-sm">
              <div className="px-5 py-3"><dt className="text-ink-faint">Jadwal</dt><dd className="font-medium">{tanggal(sesi.tanggal, { hari: true })}, {jam(sesi.waktu)} WIB</dd></div>
              {isAdmin && <div className="px-5 py-3"><dt className="text-ink-faint">Psikolog</dt><dd className="font-medium">{sesi.psikolog?.nama_lengkap}</dd></div>}
              <div className="px-5 py-3"><dt className="text-ink-faint">Pelaksanaan</dt>
                <dd className="mt-0.5">{sesi.tipe_sesi === 'Online'
                  ? (sesi.tautan_zoom ? <a href={sesi.tautan_zoom} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-violet-deep"><Video className="h-4 w-4" />Buka tautan sesi</a> : 'Daring, tautan belum diisi')
                  : <span className="inline-flex gap-1.5"><MapPin className="mt-0.5 h-4 w-4 text-violet" />{sesi.lokasi_ruangan || 'Tatap muka, ruangan belum diatur'}</span>}
                </dd>
              </div>
              <div className="px-5 py-3"><dt className="text-ink-faint">Pembayaran</dt>
                <dd className="flex flex-wrap items-center gap-2"><Badge status={bayar} /><span className="tabular text-ink-soft">{rupiah(sesi.pembayaran?.total_bayar)}{lunas && sesi.pembayaran?.metode_bayar ? `, ${sesi.pembayaran.metode_bayar}` : ''}</span></dd>
                {isAdmin && sesi.pembayaran?.alasan_ubah_nominal && <dd className="mt-1 text-[13px] text-ink-faint">Nominal diubah dari {rupiah(sesi.pembayaran.harga_layanan)}: {sesi.pembayaran.alasan_ubah_nominal}</dd>}
              </div>
              {sesi.dibuat_oleh && <div className="px-5 py-3"><dt className="text-ink-faint">Booking</dt><dd>Dibuat admin untuk kebutuhan mendesak{sesi.klien.akun ? '' : ', klien tanpa akun'}</dd></div>}
              {sesi.catatan_klien && <div className="px-5 py-3"><dt className="text-ink-faint">Catatan dari klien</dt><dd className="whitespace-pre-line">{sesi.catatan_klien}</dd></div>}
              {sesi.alasan_batal && <div className="px-5 py-3"><dt className="text-ink-faint">Alasan batal</dt><dd>{sesi.alasan_batal}</dd></div>}
            </dl>
          </Panel>

          {isAdmin && aktif && (
            <Panel title={sesi.tipe_sesi === 'Online' ? 'Tautan sesi daring' : 'Lokasi sesi'}>
              {lunas ? <TautanForm sesi={sesi} onDone={load} /> : <p className="px-5 py-4 text-sm text-ink-soft">Dapat diisi setelah pembayaran lunas. {bayar === 'Menunggu Verifikasi' && <Link href="/admin/pembayaran" className="font-semibold text-violet-deep underline">Verifikasi pembayaran</Link>}</p>}
            </Panel>
          )}
          {isAdmin && sesi.status_asesmen === 'Terdaftar' && (
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => setDialog('ulang')}>Jadwal ulang / ganti psikolog</Button>
              <Button variant="ghost-danger" onClick={() => setDialog('batal')}>Batalkan sesi</Button>
            </div>
          )}
          {!isAdmin && !lunas && sesi.status_asesmen === 'Terdaftar' && <Alert type="info">Sesi dapat dimulai setelah pembayaran klien diverifikasi admin.</Alert>}
        </aside>
      </div>

      <ConfirmDialog open={dialog === 'mulai'} onClose={() => setDialog(null)} title="Mulai sesi?" confirmLabel="Mulai sesi" onConfirm={() => ubahStatus('Berjalan')}>
        Status sesi berubah menjadi Berjalan. Sesi dapat dimulai paling cepat 1 jam sebelum jadwal.
      </ConfirmDialog>
      <ConfirmDialog open={dialog === 'selesai'} onClose={() => setDialog(null)} title="Tandai sesi selesai?" confirmLabel="Tandai selesai" onConfirm={() => ubahStatus('Selesai')}>
        Fee psikolog untuk sesi ini akan tercatat otomatis. Setelah itu laporan hasil dapat difinalisasi.
      </ConfirmDialog>
      <ConfirmDialog open={dialog === 'batal'} onClose={() => setDialog(null)} title="Batalkan sesi?" variant="danger" confirmLabel="Batalkan sesi" withReason reasonLabel="Alasan pembatalan (dikirim ke klien)"
        onConfirm={async (alasan) => { try { await api.patch(`/admin/sesi/${id}/batal`, { alasan }); toast('Sesi dibatalkan'); load(); } catch (e) { toast(e.message, 'error'); } setDialog(null); }}>
        Slot jadwal dibuka kembali. Jika klien sudah membayar, lakukan pengembalian dana secara manual.
      </ConfirmDialog>
      <ConfirmDialog open={dialog === 'buka'} onClose={() => setDialog(null)} title="Buka kembali laporan?" confirmLabel="Buka kembali"
        onConfirm={async () => { try { await api.patch(`/admin/laporan/${sesi.laporan.id_laporan}/buka-kembali`); toast('Laporan dapat direvisi psikolog'); load(); } catch (e) { toast(e.message, 'error'); } setDialog(null); }}>
        Laporan kembali menjadi draft agar psikolog dapat merevisi lalu memfinalisasi ulang. File lama tetap tersimpan.
      </ConfirmDialog>
      {isAdmin && <JadwalUlang sesi={sesi} open={dialog === 'ulang'} onClose={() => setDialog(null)} onDone={load} />}
    </>
  );
}
