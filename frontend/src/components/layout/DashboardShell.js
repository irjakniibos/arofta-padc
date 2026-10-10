'use client';

/**
 * Kerangka halaman dashboard: sidebar menu sesuai role, bar atas, dan penjaga akses.
 * Jika role tidak sesuai area, pengguna diarahkan ke dashboard miliknya.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth-context';
import { navFor } from '@/lib/nav';
import { HOME_BY_ROLE, ROLES } from '@/lib/config';
import { api } from '@/lib/api';

function namaTampil(user) {
  if (!user) return '';
  if (user.psikolog) return user.psikolog.nama_lengkap;
  const utama = user.profil_klien?.find((p) => p.hubungan_akun === 'Diri Sendiri');
  return utama?.nama_lengkap || user.email;
}

export default function DashboardShell({ roles, children }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [belumDibaca, setBelumDibaca] = useState(0);
  const allowed = user && roles.includes(user.role);

  useEffect(() => {
    if (status === 'guest') router.replace(`/masuk?lanjut=${encodeURIComponent(pathname)}`);
    else if (status === 'authenticated' && !allowed) router.replace(HOME_BY_ROLE[user.role] || '/');
  }, [status, allowed, user, router, pathname]);

  useEffect(() => {
    if (!allowed) return;
    api.get('/notifikasi', { limit: 1, belum_dibaca: 'true' }).then((r) => setBelumDibaca(r.meta?.belum_dibaca || 0)).catch(() => {});
  }, [allowed, pathname]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (!allowed) {
    return <div className="flex min-h-dvh items-center justify-center bg-mist"><Spinner label="Memeriksa akses" /></div>;
  }

  const items = navFor(user.role);
  const root = items[0].href;
  const isActive = (href) => (href === root ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const notifHref = user.role === ROLES.KLIEN ? '/klien/notifikasi' : `${root}/notifikasi`;

  const sidebar = (
    <nav aria-label="Menu dashboard" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors ${isActive(href) ? 'bg-violet-tint font-semibold text-violet-deep' : 'text-ink-soft hover:bg-mist hover:text-ink'}`}>
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />{label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-mist lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="hidden border-r border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="border-b border-line px-5 py-4"><Logo href={root} /></div>
        {sidebar}
        <div className="border-t border-line p-3">
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-ink-soft hover:bg-mist hover:text-ink">
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />Keluar
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/30" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo href={root} />
              <button type="button" onClick={() => setMenuOpen(false)} className="p-1" aria-label="Tutup menu"><X className="h-5 w-5" /></button>
            </div>
            {sidebar}
            <div className="border-t border-line p-3">
              <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-ink-soft"><LogOut className="h-[18px] w-[18px]" />Keluar</button>
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-white px-4 sm:px-8">
          <button type="button" className="rounded-control p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu className="h-5 w-5" /></button>
          <span className="hidden text-sm text-ink-soft lg:block">{user.role === ROLES.KLIEN ? 'Area klien' : user.role === ROLES.PSIKOLOG ? 'Area psikolog' : `Area ${user.role === ROLES.SUPER_ADMIN ? 'super admin' : 'admin'}`}</span>
          <div className="flex items-center gap-3">
            <Link href={notifHref} className="relative rounded-control p-2 text-ink-soft hover:bg-mist hover:text-ink" aria-label={`Notifikasi, ${belumDibaca} belum dibaca`}>
              <Bell className="h-5 w-5" />
              {belumDibaca > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-check px-1 text-[10px] font-bold text-white tabular">{belumDibaca > 9 ? '9+' : belumDibaca}</span>}
            </Link>
            <div className="text-right leading-tight">
              <p className="max-w-[180px] truncate text-sm font-semibold">{namaTampil(user)}</p>
              <p className="text-[12px] text-ink-faint">{user.role}</p>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
