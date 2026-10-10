'use client';

import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import StatStrip from '@/components/dashboard/StatStrip';
import Panel from '@/components/dashboard/Panel';
import SesiTable from '@/components/dashboard/SesiTable';
import { Loading, ErrorState } from '@/components/ui/DataState';
import { useApi } from '@/lib/use-api';
import { rupiah } from '@/lib/format';

const URUTAN_STATUS = ['Terdaftar', 'Berjalan', 'Selesai', 'Batal'];

export default function AdminRingkasanPage() {
  const { data, error, loading, reload } = useApi('/admin/dashboard');

  return (
    <>
      <PageHeader title="Ringkasan operasional" description="Kondisi layanan hari ini dan hal yang perlu ditindaklanjuti." />
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-6">
          <StatStrip items={[
            { label: 'Menunggu verifikasi bayar', value: data.pembayaran_menunggu_verifikasi, href: '/admin/pembayaran', tone: 'alert' },
            { label: 'Laporan belum final', value: data.laporan_belum_final, href: '/admin/sesi?status=Selesai', tone: 'alert' },
            { label: 'Sesi aktif', value: data.sesi_aktif, note: `${data.sesi_7_hari_ke_depan} dalam 7 hari ke depan`, href: '/admin/sesi' },
            { label: 'Total klien', value: data.total_klien, note: `${data.psikolog_aktif} psikolog aktif`, href: '/admin/klien' },
          ]} />

          <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_320px]">
            <Panel title="Sesi hari ini" action={<Link href="/admin/kalender" className="text-sm font-semibold text-violet-deep hover:underline">Buka kalender</Link>}>
              <SesiTable rows={data.sesi_hari_ini} hrefBase="/admin/sesi" tampilTanggal={false} kosong="Tidak ada sesi hari ini." />
            </Panel>
            <div className="space-y-6">
              <Panel title="Keuangan bulan ini" action={<Link href="/admin/keuangan" className="text-sm font-semibold text-violet-deep hover:underline">Rincian</Link>}>
                <dl className="divide-y divide-line text-sm">
                  <div className="flex justify-between px-5 py-3"><dt className="text-ink-soft">Pemasukan</dt><dd className="font-semibold tabular">{rupiah(data.keuangan_bulan_ini.pemasukan)}</dd></div>
                  <div className="flex justify-between px-5 py-3"><dt className="text-ink-soft">Pengeluaran</dt><dd className="font-semibold tabular">{rupiah(data.keuangan_bulan_ini.pengeluaran)}</dd></div>
                  <div className="flex justify-between px-5 py-3"><dt className="font-semibold">Surplus</dt><dd className={`font-semibold tabular ${data.keuangan_bulan_ini.surplus < 0 ? 'text-danger' : 'text-success'}`}>{rupiah(data.keuangan_bulan_ini.surplus)}</dd></div>
                </dl>
              </Panel>
              <Panel title="Status asesmen">
                <ul className="divide-y divide-line text-sm">
                  {URUTAN_STATUS.map((s) => (
                    <li key={s}>
                      <Link href={`/admin/sesi?status=${s}`} className="flex justify-between px-5 py-3 hover:bg-mist">
                        <span className="text-ink-soft">{s}</span><span className="font-semibold tabular">{data.sesi_per_status[s]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
