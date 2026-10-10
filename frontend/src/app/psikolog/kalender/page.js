'use client';

import PageHeader from '@/components/layout/PageHeader';
import KalenderStaf from '@/components/kalender/KalenderStaf';

export default function KalenderPage() {
  return (
    <>
      <PageHeader title="Kalender jadwal" description="Atur jam praktik Anda. Slot kosong tampil di kalender klien dan dapat dipesan." />
      <KalenderStaf mode="psikolog" />
    </>
  );
}
