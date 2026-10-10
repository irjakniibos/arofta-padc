'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth-context';
import { HOME_BY_ROLE } from '@/lib/config';
import TombolGoogle, { PESAN_GOOGLE } from '@/components/auth/TombolGoogle';

/** Hanya izinkan pengalihan ke path internal (mencegah open redirect). */
function amanLanjut(path) {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
}

export default function FormMasuk() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setFieldErr({});
    try {
      const user = await login(form.email.trim(), form.password);
      router.replace(amanLanjut(params.get('lanjut')) || HOME_BY_ROLE[user.role] || '/');
    } catch (err) {
      setError(err.message);
      setFieldErr(err.fieldErrors ? err.fieldErrors() : {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-serif text-[32px] font-medium">Masuk</h1>
      <p className="mt-2 text-[15px] text-ink-soft">Belum punya akun? <Link href="/daftar" className="font-semibold text-violet-deep hover:underline">Daftar sebagai klien</Link></p>
      {params.get('reset') === 'ok' && <Alert type="success" className="mt-6">Password berhasil diatur ulang. Silakan masuk dengan password baru.</Alert>}
      {params.get('daftar') === 'ok' && <Alert type="success" className="mt-6">Akun berhasil dibuat. Silakan masuk.</Alert>}
      {PESAN_GOOGLE[params.get('google')] && <Alert type="error" className="mt-6">{PESAN_GOOGLE[params.get('google')]}</Alert>}
      {error && <Alert type="error" className="mt-6">{error}</Alert>}
      <div className="mt-8"><TombolGoogle lanjut={amanLanjut(params.get('lanjut')) || undefined} /></div>
      <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
        <Input label="Email" type="email" autoComplete="email" required maxLength={255}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={fieldErr.email} />
        <div>
          <div className="relative">
            <Input label="Password" type={lihat ? 'text' : 'password'} autoComplete="current-password" required maxLength={72}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={fieldErr.password} inputClassName="pr-11" />
            <button type="button" onClick={() => setLihat((v) => !v)} className="absolute right-2 top-[34px] rounded-control p-1.5 text-ink-faint hover:text-ink"
              aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}>
              {lihat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Link href="/lupa-password" className="mt-2 inline-block text-sm text-violet-deep hover:underline">Lupa password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Masuk</Button>
      </form>
    </>
  );
}
