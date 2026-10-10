'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { api } from '@/lib/api';

const PASSWORD_HINT = 'Minimal 8 karakter, berisi huruf besar, huruf kecil, dan angka.';

export default function FormDaftar() {
  const router = useRouter();
  const [form, setForm] = useState({ nama_lengkap: '', email: '', no_hp: '', password: '', konfirmasi_password: '' });
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.konfirmasi_password) {
      setFieldErr({ konfirmasi_password: 'Konfirmasi password tidak sama' });
      return;
    }
    setLoading(true); setError(null); setFieldErr({});
    try {
      await api.post('/auth/register', { ...form, nama_lengkap: form.nama_lengkap.trim(), email: form.email.trim() });
      router.replace('/masuk?daftar=ok');
    } catch (err) {
      setError(err.message);
      setFieldErr(err.fieldErrors());
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-serif text-[32px] font-medium">Buat akun klien</h1>
      <p className="mt-2 text-[15px] text-ink-soft">Sudah punya akun? <Link href="/masuk" className="font-semibold text-violet-deep hover:underline">Masuk</Link></p>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        Untuk pemeriksaan anak, daftarkan akun atas nama orang tua atau wali. Profil anak ditambahkan setelah masuk.
      </p>
      {error && <Alert type="error" className="mt-6">{error}</Alert>}
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Input label="Nama lengkap" required maxLength={150} autoComplete="name" pattern="[A-Za-zÀ-ɏ .,'’\-]+" title="Hanya huruf dan tanda baca nama"
          value={form.nama_lengkap} onChange={set('nama_lengkap')} error={fieldErr.nama_lengkap} />
        <Input label="Email" type="email" required maxLength={255} autoComplete="email" value={form.email} onChange={set('email')} error={fieldErr.email} />
        <Input label="Nomor HP (WhatsApp)" type="tel" inputMode="tel" maxLength={16} autoComplete="tel" placeholder="081234567890"
          pattern="(\+62|62|0)8[0-9\- ]{7,14}" title="Contoh: 081234567890" value={form.no_hp} onChange={set('no_hp')} error={fieldErr.no_hp} />
        <Input label="Password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" hint={PASSWORD_HINT}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}" title={PASSWORD_HINT} value={form.password} onChange={set('password')} error={fieldErr.password} />
        <Input label="Ulangi password" type="password" required maxLength={72} autoComplete="new-password"
          value={form.konfirmasi_password} onChange={set('konfirmasi_password')} error={fieldErr.konfirmasi_password} />
        <Button type="submit" size="lg" className="w-full" loading={loading}>Buat akun</Button>
      </form>
    </>
  );
}
