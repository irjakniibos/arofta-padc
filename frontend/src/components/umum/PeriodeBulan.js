'use client';

import { Select } from '@/components/ui/Field';
import { namaBulan } from '@/lib/format';

/** Pemilih bulan & tahun untuk laporan periodik. */
export default function PeriodeBulan({ value, onChange }) {
  const th = new Date().getFullYear();
  return (
    <div className="flex gap-2">
      <Select aria-label="Bulan" value={String(value.bulan)} options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: namaBulan(i) }))}
        onChange={(e) => onChange({ ...value, bulan: Number(e.target.value) })} />
      <Select aria-label="Tahun" value={String(value.tahun)} options={[th - 2, th - 1, th, th + 1].map((t) => ({ value: String(t), label: String(t) }))}
        onChange={(e) => onChange({ ...value, tahun: Number(e.target.value) })} />
    </div>
  );
}
