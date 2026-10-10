import { Suspense } from 'react';
import FormReset from './FormReset';

export const metadata = { title: 'Password baru' };

export default function ResetPage() {
  return <Suspense><FormReset /></Suspense>;
}
