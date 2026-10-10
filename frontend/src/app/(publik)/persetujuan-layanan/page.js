import DokumenKebijakan from '@/components/public/DokumenKebijakan';
import { PERSETUJUAN_LAYANAN } from '@/lib/kebijakan';
import { serverGet } from '@/lib/server-api';

export const metadata = { title: 'Persetujuan Layanan Psikologi' };

export default async function PersetujuanLayananPage() {
  const info = await serverGet('/info-lembaga', { revalidate: 300, fallback: {} });
  return <DokumenKebijakan dokumen={PERSETUJUAN_LAYANAN} info={info} />;
}
