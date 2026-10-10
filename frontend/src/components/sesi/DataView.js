/** Menampilkan data formulir (read-only) memakai definisi yang sama dengan form isian. */
import { getIn } from '@/components/form/DynamicForm';

function tampil(f, v) {
  if (v === null || v === undefined || v === '') return null;
  if (f.type === 'bool') return v ? 'Ya' : 'Tidak';
  if (f.type === 'checklist') return (Array.isArray(v) ? v : String(v).split(';')).filter(Boolean).join(', ');
  if (f.type === 'date') return new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return String(v);
}

export default function DataView({ sections, data, kosong = 'Belum diisi.' }) {
  if (!data) return <p className="text-sm text-ink-faint">{kosong}</p>;
  const isi = sections.map((s) => ({
    ...s,
    rows: s.fields.map((f) => ({ f, v: tampil(f, getIn(data, f.name)) })).filter((r) => r.v !== null),
  })).filter((s) => s.rows.length);
  if (!isi.length) return <p className="text-sm text-ink-faint">{kosong}</p>;
  return (
    <div className="space-y-6">
      {isi.map((s) => (
        <section key={s.judul}>
          <h4 className="text-[13px] font-semibold text-violet-deep">{s.judul}</h4>
          <dl className="mt-2 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {s.rows.map(({ f, v }) => (
              <div key={f.name} className={f.type === 'textarea' && f.wide !== false ? 'sm:col-span-2' : ''}>
                <dt className="text-[12px] text-ink-faint">{f.label}</dt>
                <dd className="whitespace-pre-line text-sm">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
