'use client';

import DashboardShell from '@/components/layout/DashboardShell';
import { ROLES } from '@/lib/config';

export default function Layout({ children }) {
  return <DashboardShell roles={[ROLES.KLIEN]}>{children}</DashboardShell>;
}
