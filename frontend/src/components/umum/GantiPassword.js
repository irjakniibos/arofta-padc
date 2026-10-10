'use client';

import PageHeader from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useFormSubmit } from '@/components/form/useForm';
import { api } from '@/lib/api';

const HINT = 'Minimal 8 karakter, berisi huruf besar, huruf kecil, dan angka.';

export default function GantiPassword() {
  const f = useFormSubmit({ password_lama: '', password_baru: '', konfirmasi_password: '' });
  const set = (k) => (e) => f.setValue({ ...f.value, [k]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await f.submit(() => api.put('/auth/password', f.value), 'Password berhasil diubah');
    if (ok) f.setValue({ password_lama: '', password_baru: '', konfirmasi_password: '' });
  };
  return (
    <>
      <PageHeader title="Ubah password" description="Gunakan password yang belum pernah dipakai di layanan lain." />
      <form onSubmit={onSubmit} className="max-w-md space-y-5 rounded-panel border border-line bg-white p-6">
        {f.error && <Alert type="error">{f.error}</Alert>}
        <Input label="Password saat ini" type="password" required autoComplete="current-password" maxLength={72} value={f.value.password_lama} onChange={set('password_lama')} error={f.errors.password_lama} />
        <Input label="Password baru" type="password" required minLength={8} maxLength={72} autoComplete="new-password" hint={HINT}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}" title={HINT} value={f.value.password_baru} onChange={set('password_baru')} error={f.errors.password_baru} />
        <Input label="Ulangi password baru" type="password" required maxLength={72} autoComplete="new-password" value={f.value.konfirmasi_password} onChange={set('konfirmasi_password')} error={f.errors.konfirmasi_password} />
        <Button type="submit" loading={f.saving}>Simpan password</Button>
      </form>
    </>
  );
}
