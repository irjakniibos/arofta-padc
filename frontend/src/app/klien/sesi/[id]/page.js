'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, Video, MapPin, MessageCircle } from 'lucide-react';
import FormUlasan, { Bintang } from '@/components/klien/FormUlasan';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/dashboard/Panel';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { jam, tanggal, rupiah } from '@/lib/format';
import { tautanWa, pesanKonfirmasiBayar } from '@/lib/whatsapp';

const ada = (v) => v && v !== '-';

function waktuLengkap(dt) {
  if (!dt) return '-';
  return new Date(String(dt).replace(' ', 'T')).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function PanelPembayaran({ sesi, onKonfirmasi }) {
  const toast = useToast();
  const b = sesi.pembayaran;
  const info = sesi.info_pembayaran || {};
  if (!b) return null;
  const salin = (t) => { navigator.clipboard?.writeText(t); toast('Disalin'); };

  if (b.status_pembayaran === 'Lunas') {
    return <Panel title="Pembayaran"><div className="px-5 py-4"><Alert type="success" title="Pembayaran terverifikasi">{rupiah(b.total_bayar)} diterima. Sesi Anda sudah terkonfirmasi.</Alert></div></Panel>;
  }
  if (b.status_pembayaran === 'Batal') {
    return <Panel title="Pembayaran"><p className="px-5 py-4 text-sm text-ink-soft">Tagihan dibatalkan.</p></Panel>;
  }
  const waKonfirmasi = tautanWa(info.kontak_whatsapp, pesanKonfirmasiBayar(sesi));
  if (b.status_pembayaran === 'Menunggu Verifikasi') {
    return (
      <Panel title="Pembayaran">
        <div className="space-y-3 px-5 py-4">
          <Alert type="info" title="Menunggu verifikasi admin">Konfirmasi Anda sudah diterima. Admin akan mencocokkan bukti transfer di WhatsApp dengan mutasi rekening, lalu mengonfirmasi pembayaran.</Alert>
          {waKonfirmasi && (
            <p className="text-sm text-ink-soft">Belum sempat mengirim foto bukti transfer?{' '}
              <a href={waKonfirmasi} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-deep hover:underline">Buka WhatsApp admin lagi</a>
            </p>
          )}
        </div>
      </Panel>
    );
  }
  return (
    <Panel title="Selesaikan pembayaran">
      <div className="space-y-5 px-5 py-5">
        {b.status_pembayaran === 'Ditolak' && <Alert type="error" title="Pembayaran belum dapat diverifikasi">{b.catatan_admin || 'Periksa kembali pembayaran Anda.'} Setelah diperbaiki, konfirmasi ulang melalui WhatsApp di bawah.</Alert>}
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-faint">Total</dt><dd className="text-2xl font-semibold tabular">{rupiah(b.total_bayar)}</dd></div>
          <div><dt className="text-ink-faint">Bayar sebelum</dt><dd className="font-semibold">{waktuLengkap(b.batas_bayar)}</dd></div>
        </dl>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet text-[12px] text-violet-deep">1</span>
            <div className="flex-1">
              <p className="font-medium">Transfer ke rekening berikut</p>
              {ada(info.bank_no_rekening) ? (
                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-control bg-mist px-4 py-3">
                  <div>
                    <p className="text-ink-soft">{info.bank_nama}, a.n. {info.bank_atas_nama}</p>
                    <p className="text-lg font-semibold tracking-wide tabular">{info.bank_no_rekening}</p>
                  </div>
                  <button type="button" onClick={() => salin(info.bank_no_rekening)} className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet-deep"><Copy className="h-4 w-4" />Salin</button>
                </div>
              ) : <p className="mt-1 text-ink-soft">Nomor rekening belum diatur. Hubungi admin{ada(info.kontak_whatsapp) ? ` melalui WhatsApp ${info.kontak_whatsapp}` : ''}.</p>}
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet text-[12px] text-violet-deep">2</span>
            <div className="flex-1">
              <p className="font-medium">Konfirmasi pembayaran melalui WhatsApp</p>
              <p className="mt-0.5 text-ink-soft">
                Setelah transfer, tekan tombol di bawah. WhatsApp admin akan terbuka dengan pesan berisi kode booking{' '}
                <span className="font-semibold text-ink">{sesi.kode_booking}</span>. Lampirkan foto bukti transfer, lalu kirim.
              </p>
              {waKonfirmasi
                ? <Button className="mt-3" onClick={onKonfirmasi}><MessageCircle className="h-4 w-4" />Konfirmasi via WhatsApp</Button>
                : <p className="mt-2 text-ink-soft">Nomor WhatsApp admin belum diatur. Silakan hubungi AROFTA PADC.</p>}
            </div>
          </li>
        </ol>
      </div>
    </Panel>
  );
}

export default function DetailSesiKlienPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const [sesi, setSesi] = useState(null);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);

  const load = () => api.get(`/klien/sesi/${id}`).then((r) => setSesi(r.data)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!sesi) return <Loading />;

  const bisaBatal = sesi.status_asesmen === 'Terdaftar' && ['Menunggu Pembayaran', 'Ditolak'].includes(sesi.pembayaran?.status_pembayaran);
  const lunas = sesi.pembayaran?.status_pembayaran === 'Lunas';

  return (
    <>
      <Link href="/klien/sesi" className="text-sm text-ink-soft hover:text-ink">Jadwal & pembayaran</Link>
      <PageHeader title={sesi.layanan?.nama_layanan} description={`Kode booking ${sesi.kode_booking}`}
        action={<Badge status={sesi.status_asesmen} className="text-[13px]" />} />

      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <PanelPembayaran sesi={sesi} onKonfirmasi={() => setDialog('bayar')} />

          {sesi.laporan?.id_laporan && (
            <Panel title="Laporan hasil pemeriksaan">
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <p className="text-sm text-ink-soft">Laporan terbit {tanggal(sesi.laporan.tanggal_final)}.</p>
                <a href={api.fileUrl(`/laporan/${sesi.laporan.id_laporan}/unduh`)} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-control bg-violet px-4 text-sm font-semibold text-white hover:bg-violet-deep"><Download className="h-4 w-4" />Unduh laporan</a>
              </div>
            </Panel>
          )}
          {sesi.status_asesmen === 'Selesai' && !sesi.laporan?.id_laporan && (
            <Alert type="info" title="Laporan sedang disusun">Anda akan menerima pemberitahuan saat laporan hasil pemeriksaan dapat diunduh.</Alert>
          )}

          {sesi.status_asesmen === 'Selesai' && (
            <Panel title="Ulasan">
              {sesi.ulasan ? (
                <div className="px-5 py-4 text-sm">
                  <Bintang rating={sesi.ulasan.rating} />
                  {sesi.ulasan.komentar && <p className="mt-2 text-ink-soft">{sesi.ulasan.komentar}</p>}
                </div>
              ) : <FormUlasan idSesi={sesi.id_sesi} onDone={load} />}
            </Panel>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Detail sesi">
            <dl className="divide-y divide-line text-sm">
              <div className="px-5 py-3"><dt className="text-ink-faint">Jadwal</dt><dd className="font-medium">{tanggal(sesi.tanggal, { hari: true })}, {jam(sesi.waktu)} WIB</dd></div>
              <div className="px-5 py-3"><dt className="text-ink-faint">Diperiksa</dt><dd className="font-medium">{sesi.klien?.nama_lengkap}</dd></div>
              <div className="px-5 py-3"><dt className="text-ink-faint">Psikolog</dt><dd className="font-medium">{sesi.psikolog?.nama_lengkap}</dd></div>
              <div className="px-5 py-3">
                <dt className="text-ink-faint">{sesi.tipe_sesi === 'Online' ? 'Sesi daring' : 'Sesi tatap muka'}</dt>
                <dd className="mt-1">
                  {sesi.tipe_sesi === 'Online' ? (
                    sesi.tautan_zoom ? <a href={sesi.tautan_zoom} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-violet-deep hover:underline"><Video className="h-4 w-4" />Buka tautan sesi</a>
                      : <span className="text-ink-soft">{lunas ? 'Tautan dikirim admin sebelum jadwal.' : 'Tautan tersedia setelah pembayaran terverifikasi.'}</span>
                  ) : (
                    <span className="inline-flex items-start gap-1.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet" />{sesi.lokasi_ruangan || sesi.info_pembayaran?.alamat_klinik || 'Lokasi dikirim sebelum jadwal.'}</span>
                  )}
                </dd>
              </div>
              {sesi.catatan_klien && <div className="px-5 py-3"><dt className="text-ink-faint">Catatan Anda</dt><dd className="whitespace-pre-line">{sesi.catatan_klien}</dd></div>}
              {sesi.alasan_batal && <div className="px-5 py-3"><dt className="text-ink-faint">Alasan batal</dt><dd>{sesi.alasan_batal}</dd></div>}
            </dl>
          </Panel>
          {bisaBatal && <Button variant="ghost-danger" className="w-full" onClick={() => setDialog('batal')}>Batalkan booking</Button>}
        </aside>
      </div>

      <ConfirmDialog open={dialog === 'bayar'} onClose={() => setDialog(null)} title="Konfirmasi pembayaran" confirmLabel="Ya, buka WhatsApp"
        onConfirm={async () => {
          // Dibuka sebelum await agar tidak diblokir peramban (masih dalam aksi klik pengguna)
          window.open(tautanWa(sesi.info_pembayaran?.kontak_whatsapp, pesanKonfirmasiBayar(sesi)), '_blank', 'noopener');
          try { const r = await api.patch(`/klien/sesi/${id}/konfirmasi-pembayaran`); setSesi(r.data); toast('Konfirmasi tercatat. Kirim pesan WhatsApp beserta foto bukti transfer.'); } catch (e) { toast(e.message, 'error'); }
          setDialog(null);
        }}>
        Pastikan Anda sudah transfer {rupiah(sesi.pembayaran?.total_bayar)}. WhatsApp akan terbuka di tab baru; kirim pesan yang sudah terisi beserta foto bukti transfer.
      </ConfirmDialog>
      <ConfirmDialog open={dialog === 'batal'} onClose={() => setDialog(null)} title="Batalkan booking?" variant="danger" confirmLabel="Batalkan booking" withReason reasonRequired={false} reasonLabel="Alasan (opsional)"
        onConfirm={async (alasan) => { try { const r = await api.patch(`/klien/sesi/${id}/batal`, { alasan: alasan || undefined }); setSesi(r.data); toast('Booking dibatalkan'); } catch (e) { toast(e.message, 'error'); } setDialog(null); }}>
        Jadwal akan dilepas dan dapat dipesan orang lain.
      </ConfirmDialog>
    </>
  );
}
