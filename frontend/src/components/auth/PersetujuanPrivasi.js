'use client';

/**
 * Meminta klien menyetujui Kebijakan Privasi bila belum pernah atau versinya berubah
 * (akun lama, akun yang dibuatkan Admin, atau setelah kebijakan diperbarui).
 */
import { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function PersetujuanPrivasi() {
  const { refresh, logout } = useAuth();
  const toast = useToast();
  const [setuju, setSetuju] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const kirim = async () => {
    setLoading(true); setError(null);
    try { await api.post('/auth/persetujuan-privasi'); toast('Persetujuan tersimpan. Terima kasih.'); await refresh(); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <Modal open dismissable={false} title="Persetujuan Kebijakan Privasi" size="md"
      footer={(
        <>
          <Button variant="secondary" onClick={logout}>Keluar</Button>
          <Button disabled={!setuju} loading={loading} onClick={kirim}>Setuju dan lanjutkan</Button>
        </>
      )}>
      <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
        <p>
          Sebelum melanjutkan, mohon baca Kebijakan Privasi AROFTA PADC. Kebijakan ini menjelaskan data apa saja yang kami simpan,
          termasuk data psikologis yang bersifat spesifik, siapa yang dapat mengaksesnya, dan hak Anda atas data tersebut.
        </p>
        {error && <Alert type="error">{error}</Alert>}
        <Checkbox checked={setuju} onChange={(e) => setSetuju(e.target.checked)}>
          Saya telah membaca dan menyetujui{' '}
          <Link href="/kebijakan-privasi" target="_blank" className="font-semibold text-violet-deep underline">Kebijakan Privasi</Link>.
        </Checkbox>
      </div>
    </Modal>
  );
}
