import DokumenKebijakan from '@/components/public/DokumenKebijakan';
import { KEBIJAKAN_PRIVASI } from '@/lib/kebijakan';
import { serverGet } from '@/lib/server-api';

export const metadata = { title: 'Kebijakan Privasi' };

export default async function KebijakanPrivasiPage() {
  const info = await serverGet('/info-lembaga', { revalidate: 300, fallback: {} });
  return <DokumenKebijakan dokumen={KEBIJAKAN_PRIVASI} info={info} />;
}
