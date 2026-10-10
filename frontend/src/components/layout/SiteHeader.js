'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/layanan', label: 'Layanan' },
  { href: '/tim-psikolog', label: 'Tim psikolog' },
  { href: '/jadwal', label: 'Jadwal tersedia' },
  { href: '/#alur', label: 'Cara memesan' },
  { href: '/#kontak', label: 'Kontak' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { status, homePath } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href) => !href.includes('#') && (pathname === href || pathname.startsWith(`${href}/`));

  const actions = status === 'authenticated'
    ? <Button href={homePath} size="sm">Buka dashboard</Button>
    : (
      <>
        <Button href="/masuk" variant="ghost" size="sm">Masuk</Button>
        <Button href="/daftar" size="sm">Daftar</Button>
      </>
    );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Logo />
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`rounded-control px-3 py-2 text-sm transition-colors ${isActive(n.href) ? 'font-semibold text-violet-deep' : 'text-ink-soft hover:text-ink'}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">{status !== 'loading' && actions}</div>
        <button type="button" className="rounded-control p-2 text-ink lg:hidden" aria-expanded={open} aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Menu</span>
        </button>
      </div>
      {open && (
        <div id="menu-mobile" className="border-t border-line bg-white px-5 pb-5 lg:hidden">
          <nav aria-label="Navigasi utama" className="flex flex-col py-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-3 text-[15px] text-ink">{n.label}</Link>
            ))}
          </nav>
          <div className="mt-3 flex gap-2">{actions}</div>
        </div>
      )}
    </header>
  );
}
