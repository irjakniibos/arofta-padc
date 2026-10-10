import { Suspense } from 'react';
import SesiList from '@/components/sesi/SesiList';

export default function Page() {
  return <Suspense><SesiList mode="admin" /></Suspense>;
}
