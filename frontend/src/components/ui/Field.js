/**
 * Komponen form: label, input/textarea/select, petunjuk, dan pesan error dari backend.
 * Validasi di frontend memakai atribut HTML (required, pattern, maxLength); backend tetap memvalidasi ulang.
 */
import { useId } from 'react';

const base = 'w-full rounded-control border bg-white px-3 text-[15px] text-ink placeholder:text-ink-faint transition-colors focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20 disabled:bg-mist';

function wrap(Comp) {
  return function FieldComp({ label, hint, error, className = '', inputClassName = '', required, ...props }) {
    const id = useId();
    const border = error ? 'border-danger' : 'border-line';
    const size = Comp === 'textarea' ? 'py-2.5 min-h-24' : 'h-11';
    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
            {label}{required && <span className="text-danger"> *</span>}
          </label>
        )}
        <Comp id={id} required={required} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-desc` : undefined}
          className={`${base} ${border} ${size} ${inputClassName}`} {...props} />
        {(error || hint) && (
          <p id={`${id}-desc`} className={`mt-1.5 text-[13px] ${error ? 'text-danger' : 'text-ink-faint'}`}>{error || hint}</p>
        )}
      </div>
    );
  };
}

export const Input = wrap('input');
export const Textarea = wrap('textarea');

export function Select({ label, hint, error, options = [], placeholder, className = '', required, ...props }) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}{required && <span className="text-danger"> *</span>}</label>}
      <select id={id} required={required} aria-invalid={!!error} className={`${base} h-11 ${error ? 'border-danger' : 'border-line'}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      {(error || hint) && <p className={`mt-1.5 text-[13px] ${error ? 'text-danger' : 'text-ink-faint'}`}>{error || hint}</p>}
    </div>
  );
}

/** Kotak centang dengan label panjang (mis. persetujuan). `children` = isi label, boleh berisi tautan. */
export function Checkbox({ children, error, className = '', ...props }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <input id={id} type="checkbox" aria-invalid={!!error} className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-violet)]" {...props} />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1.5 pl-7 text-[13px] text-danger">{error}</p>}
    </div>
  );
}
