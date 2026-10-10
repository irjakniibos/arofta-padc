'use client';

import PageHeader from '@/components/layout/PageHeader';
import KalenderStaf from '@/components/kalender/KalenderStaf';

export default function KalenderPage() {
  return (
    <>
      <PageHeader title="Kalender jadwal" description="Slot praktik dan sesi seluruh psikolog. Pilih psikolog untuk mengatur jadwalnya." />
      <KalenderStaf mode="admin" />
    </>
  );
}
