import Image from 'next/image';
import Link from 'next/link';
import { BASE_PATH } from '@/lib/config';

/** Logo resmi AROFTA (vektor dari kop dokumen klinik) + nama lembaga. */
export default function Logo({ href = '/', compact = false, className = '' }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-3 ${className}`} aria-label="AROFTA PADC, ke beranda">
      <Image src={`${BASE_PATH}/brand/arofta-logo.svg`} alt="" width={40} height={31} priority unoptimized />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-wide text-violet-deep">AROFTA</span>
          <span className="hidden text-[11px] text-ink-soft sm:block">Psychological Assessment &amp; Development Center</span>
        </span>
      )}
    </Link>
  );
}
