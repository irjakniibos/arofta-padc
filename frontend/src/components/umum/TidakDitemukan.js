import Link from 'next/link';
import { Empty } from '@/components/ui/DataState';

/** Halaman tidak ditemukan di dalam area dashboard (sidebar tetap tampil). */
export default function TidakDitemukan({ kembali }) {
  return (
    <Empty title="Halaman tidak ditemukan">
      Alamat yang Anda buka tidak tersedia. <Link href={kembali} className="font-semibold text-violet-deep underline">Kembali ke ringkasan</Link>
    </Empty>
  );
}
