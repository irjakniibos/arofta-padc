'use client';

import { use } from 'react';
import SesiDetail from '@/components/sesi/SesiDetail';

export default function Page({ params }) {
  const { id } = use(params);
  return <SesiDetail id={id} mode="admin" />;
}
