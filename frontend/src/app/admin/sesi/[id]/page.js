'use client';

import { use } from 'react';
import SesiDetail from '@/components/sesi/SesiDetail';

export default function Page({ params, searchParams }) {
  const { id } = use(params);
  const { tab } = use(searchParams);
  return <SesiDetail id={id} mode="admin" tabAwal={tab} />;
}
