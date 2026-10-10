/** Menu sidebar per role. Super Admin memakai area Admin + menu tambahan. */
import {
  LayoutDashboard, CalendarPlus, CalendarDays, FileText, UserRound, Bell, ClipboardList, Wallet, Star,
  Users, Stethoscope, Tags, Banknote, LineChart, FileCog, Settings, ShieldCheck, ScrollText, CreditCard, KeyRound,
} from 'lucide-react';
import { ROLES } from './config';

export const NAV = {
  [ROLES.KLIEN]: [
    { href: '/klien', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '/klien/booking', label: 'Pesan layanan', icon: CalendarPlus },
    { href: '/klien/sesi', label: 'Jadwal & pembayaran', icon: CalendarDays },
    { href: '/klien/hasil', label: 'Hasil asesmen', icon: FileText },
    { href: '/klien/profil', label: 'Profil & formulir', icon: UserRound },
    { href: '/klien/notifikasi', label: 'Notifikasi', icon: Bell },
    { href: '/klien/password', label: 'Ubah password', icon: KeyRound },
  ],
  [ROLES.PSIKOLOG]: [
    { href: '/psikolog', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '/psikolog/kalender', label: 'Kalender jadwal', icon: CalendarDays },
    { href: '/psikolog/sesi', label: 'Sesi klien', icon: ClipboardList },
    { href: '/psikolog/laporan', label: 'Laporan hasil', icon: FileText },
    { href: '/psikolog/fee', label: 'Fee saya', icon: Wallet },
    { href: '/psikolog/ulasan', label: 'Ulasan', icon: Star },
    { href: '/psikolog/profil', label: 'Profil', icon: UserRound },
    { href: '/psikolog/password', label: 'Ubah password', icon: KeyRound },
  ],
  [ROLES.ADMIN]: [
    { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '/admin/kalender', label: 'Kalender jadwal', icon: CalendarDays },
    { href: '/admin/sesi', label: 'Sesi & monitoring', icon: ClipboardList },
    { href: '/admin/booking', label: 'Booking mendesak', icon: CalendarPlus },
    { href: '/admin/pembayaran', label: 'Verifikasi pembayaran', icon: CreditCard },
    { href: '/admin/klien', label: 'Klien', icon: Users },
    { href: '/admin/psikolog', label: 'Psikolog', icon: Stethoscope },
    { href: '/admin/layanan', label: 'Layanan & harga', icon: Tags },
    { href: '/admin/fee', label: 'Fee psikolog', icon: Banknote },
    { href: '/admin/keuangan', label: 'Keuangan', icon: LineChart },
    { href: '/admin/template', label: 'Template laporan', icon: FileCog },
    { href: '/admin/ulasan', label: 'Ulasan', icon: Star },
    { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
  ],
};

export const NAV_SUPER_ADMIN_EXTRA = [
  { href: '/admin/pengguna', label: 'Akun pengguna', icon: ShieldCheck },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
];

const AKUN_ADMIN = { href: '/admin/password', label: 'Ubah password', icon: KeyRound };

export function navFor(role) {
  if (role === ROLES.SUPER_ADMIN) return [...NAV[ROLES.ADMIN], ...NAV_SUPER_ADMIN_EXTRA, AKUN_ADMIN];
  if (role === ROLES.ADMIN) return [...NAV[ROLES.ADMIN], AKUN_ADMIN];
  return NAV[role] || [];
}
