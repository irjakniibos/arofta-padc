import { Suspense } from 'react';
import FormMasuk from './FormMasuk';

export const metadata = { title: 'Masuk' };

export default function MasukPage() {
  return <Suspense><FormMasuk /></Suspense>;
}
