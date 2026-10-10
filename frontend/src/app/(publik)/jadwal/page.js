import { Suspense } from 'react';
import JadwalTersedia from './JadwalTersedia';

export const metadata = { title: 'Jadwal tersedia' };

export default function JadwalPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-serif text-4xl font-medium">Jadwal tersedia</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
        Tanggal yang masih memiliki jam kosong ditandai. Pilih tanggal untuk melihat jam dan psikolog yang bertugas.
      </p>
      <Suspense><JadwalTersedia /></Suspense>
    </div>
  );
}
