import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { serverGet } from '@/lib/server-api';

export default async function PublikLayout({ children }) {
  const info = await serverGet('/info-lembaga', { revalidate: 300, fallback: {} });
  return (
    <>
      <SiteHeader />
      <main id="konten">{children}</main>
      <SiteFooter info={info} />
    </>
  );
}
