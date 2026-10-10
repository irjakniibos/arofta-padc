'use client';

/**
 * Formulir dari definisi (lib/form-defs.js). Dipakai untuk formulir intake & catatan klinis
 * agar urutan isian sama dengan formulir kertas klinik.
 * value/onChange memakai objek datar; field bersarang ditulis "bagian.kolom".
 */
import { Input, Textarea, Select } from '@/components/ui/Field';
import { isoLokal } from '@/lib/format';

export function getIn(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setIn(obj, path, val) {
  const keys = path.split('.');
  const out = { ...obj };
  let cur = out;
  keys.slice(0, -1).forEach((k) => { cur[k] = { ...(cur[k] || {}) }; cur = cur[k]; });
  cur[keys[keys.length - 1]] = val;
  return out;
}

function FieldRenderer({ f, value, onChange, error, disabled, required }) {
  const common = { label: f.label, hint: f.hint, error, disabled, required };
  const v = value ?? '';
  switch (f.type) {
    case 'textarea':
      return <Textarea {...common} rows={f.rows || 3} maxLength={f.max || 5000} value={v} onChange={(e) => onChange(e.target.value)} className={f.wide !== false ? 'sm:col-span-2' : ''} />;
    case 'select':
      return <Select {...common} value={v} placeholder="Pilih" options={f.options} onChange={(e) => onChange(e.target.value || null)} />;
    case 'number':
      return <Input {...common} type="number" step={f.step || '1'} min={f.min ?? 0} max={f.maxValue} value={v} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />;
    case 'date':
      return <Input {...common} type="date" value={v ? String(v).slice(0, 10) : ''} max={f.maxToday ? isoLokal() : undefined} onChange={(e) => onChange(e.target.value || null)} />;
    case 'bool':
      return (
        <div className={f.wide ? 'sm:col-span-2' : ''}>
          <label className={`flex items-start gap-3 rounded-control border px-3 py-2.5 text-sm ${error ? 'border-danger' : 'border-line'}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-violet)]" checked={!!value} disabled={disabled} required={required} onChange={(e) => onChange(e.target.checked)} />
            <span>{f.label}{required && <span className="text-danger"> *</span>}{f.hint && <span className="block text-[13px] text-ink-faint">{f.hint}</span>}</span>
          </label>
          {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
        </div>
      );
    case 'checklist': {
      const arr = Array.isArray(value) ? value : String(value || '').split(';').filter(Boolean);
      return (
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">{f.label}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {f.options.map((o) => (
              <label key={o} className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[var(--color-violet)]" disabled={disabled} checked={arr.includes(o)}
                  onChange={(e) => onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))} />{o}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    default:
      return <Input {...common} type={f.type || 'text'} maxLength={f.max || 255} value={v} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}

export default function DynamicForm({ sections, value, onChange, errors = {}, disabled = false }) {
  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <fieldset key={s.judul} className="min-w-0">
          <legend className="mb-1 text-[15px] font-semibold text-ink">{s.judul}</legend>
          {s.keterangan && <p className="mb-3 text-[13px] text-ink-faint">{s.keterangan}</p>}
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {s.fields.filter((f) => !f.showIf || f.showIf(value)).map((f) => (
              <FieldRenderer key={f.name} f={f} value={getIn(value, f.name)} error={errors[f.name]} disabled={disabled}
                required={typeof f.required === 'function' ? f.required(value) : !!f.required}
                onChange={(v) => onChange(setIn(value, f.name, v))} />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
