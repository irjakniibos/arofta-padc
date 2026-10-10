'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { api } from '@/lib/api';

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('');
  const [terkirim, setTerkirim] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setTerkirim(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-serif text-[32px] font-medium">Atur ulang password</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru.</p>
      {terkirim ? (
        <Alert type="success" className="mt-8" title="Periksa email Anda">
          Jika {email} terdaftar, tautan atur ulang password sudah dikirim dan berlaku 30 menit. Periksa juga folder spam.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {error && <Alert type="error">{error}</Alert>}
          <Input label="Email" type="email" required maxLength={255} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg" className="w-full" loading={loading}>Kirim tautan</Button>
        </form>
      )}
      <Link href="/masuk" className="mt-6 inline-block text-sm text-violet-deep hover:underline">Kembali ke halaman masuk</Link>
    </>
  );
}
