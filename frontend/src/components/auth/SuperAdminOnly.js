'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/config';
import Alert from '@/components/ui/Alert';

/** Penjaga halaman khusus Super Admin di sisi tampilan. Backend tetap menolak akses dengan 403. */
export default function SuperAdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== ROLES.SUPER_ADMIN) return <Alert type="error">Halaman ini hanya dapat diakses oleh Super Admin.</Alert>;
  return children;
}
