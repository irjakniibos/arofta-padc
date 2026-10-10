'use client';

import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import StatStrip from '@/components/dashboard/StatStrip';
import Panel from '@/components/dashboard/Panel';
import SesiTable from '@/components/dashboard/SesiTable';
import Button from '@/components/ui/Button';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/lib/auth-context';

export default function KlienRingkasanPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi('/klien/dashboard');
  const nama = user?.profil_klien?.find((p) => p.hubungan_akun === 'Diri Sendiri')?.nama_lengkap?.split(' ')[0];

  return (
    <>
      <PageHeader title={nama ? `Halo, ${nama}` : 'Ringkasan'} description="Jadwal terdekat, tagihan, dan laporan hasil pemeriksaan Anda."
        action={<Button href="/klien/booking">Pesan layanan</Button>} />
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-6">
          <StatStrip items={[
            { label: 'Sesi mendatang', value: data.sesi_mendatang.length, href: '/klien/sesi' },
            { label: 'Tagihan belum dibayar', value: data.tagihan_belum_dibayar, href: '/klien/sesi', tone: 'alert' },
            { label: 'Laporan tersedia', value: data.laporan_tersedia, href: '/klien/hasil' },
            { label: 'Notifikasi baru', value: data.notifikasi_belum_dibaca, href: '/klien/notifikasi' },
          ]} />
          <Panel title="Sesi mendatang" action={<Link href="/klien/sesi" className="text-sm font-semibold text-violet-deep hover:underline">Semua jadwal</Link>}>
            <SesiTable rows={data.sesi_mendatang} hrefBase="/klien/sesi" tampilKlien={user?.profil_klien?.length > 1}
              kosong="Belum ada sesi yang dijadwalkan. Pilih layanan untuk memesan jadwal." />
          </Panel>
        </div>
      )}
    </>
  );
}
