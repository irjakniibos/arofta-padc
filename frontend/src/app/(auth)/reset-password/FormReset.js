'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { api } from '@/lib/api';

const PASSWORD_HINT = 'Minimal 8 karakter, berisi huruf besar, huruf kecil, dan angka.';

export default function FormReset() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [form, setForm] = useState({ password_baru: '', konfirmasi_password: '' });
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({});
  const [loading, setLoading] = useState(false);

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return (
      <>
        <h1 className="font-serif text-[32px] font-medium">Tautan tidak valid</h1>
        <p className="mt-3 text-[15px] text-ink-soft">Tautan atur ulang password rusak atau tidak lengkap. Minta tautan baru.</p>
        <Button href="/lupa-password" className="mt-8">Minta tautan baru</Button>
      </>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setFieldErr({});
    try {
      await api.post('/auth/reset-password', { token, ...form });
      router.replace('/masuk?reset=ok');
    } catch (err) {
      setError(err.message);
      setFieldErr(err.fieldErrors());
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-serif text-[32px] font-medium">Buat password baru</h1>
      {error && <Alert type="error" className="mt-6">{error} {error.includes('kedaluwarsa') && <Link href="/lupa-password" className="font-semibold underline">Minta tautan baru</Link>}</Alert>}
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Input label="Password baru" type="password" required minLength={8} maxLength={72} autoComplete="new-password" hint={PASSWORD_HINT}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}" title={PASSWORD_HINT}
          value={form.password_baru} onChange={(e) => setForm({ ...form, password_baru: e.target.value })} error={fieldErr.password_baru} />
        <Input label="Ulangi password baru" type="password" required maxLength={72} autoComplete="new-password"
          value={form.konfirmasi_password} onChange={(e) => setForm({ ...form, konfirmasi_password: e.target.value })} error={fieldErr.konfirmasi_password} />
        <Button type="submit" size="lg" className="w-full" loading={loading}>Simpan password</Button>
      </form>
    </>
  );
}
