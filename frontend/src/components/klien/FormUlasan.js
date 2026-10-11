'use client';

/** Ulasan klien untuk sesi yang sudah selesai (KF-26). Dipakai di detail sesi dan menu Hasil asesmen. */
import { useState } from 'react';
import { Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

/** Tampilan bintang hanya-baca. */
export function Bintang({ rating, className = 'h-5 w-5' }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`${className} ${n <= rating ? 'fill-violet text-violet' : 'text-violet-line'}`} aria-hidden="true" />)}
    </span>
  );
}

export default function FormUlasan({ idSesi, onDone, className = 'space-y-4 px-5 py-5' }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [komentar, setKomentar] = useState('');
  const [saving, setSaving] = useState(false);
  const kirim = async () => {
    setSaving(true);
    try { await api.post(`/klien/sesi/${idSesi}/ulasan`, { rating, komentar: komentar || undefined }); toast('Terima kasih atas ulasan Anda'); onDone(); } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <div className={className}>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Penilaian Anda</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} bintang`} aria-pressed={rating === n} className="rounded-control p-1">
              <Star className={`h-7 w-7 ${n <= rating ? 'fill-violet text-violet' : 'text-violet-line'}`} />
            </button>
          ))}
        </div>
      </fieldset>
      <Textarea label="Komentar (opsional)" maxLength={1000} rows={3} value={komentar} onChange={(e) => setKomentar(e.target.value)} hint="Nama Anda akan disamarkan saat ulasan ditampilkan." />
      <Button disabled={!rating} loading={saving} onClick={kirim}>Kirim ulasan</Button>
    </div>
  );
}
