'use client';

/** Tab sederhana; value dikontrol oleh induk. */
export default function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div role="tablist" className={`flex gap-1 overflow-x-auto border-b border-line ${className}`}>
      {tabs.map((t) => {
        const v = typeof t === 'string' ? t : t.value;
        const label = typeof t === 'string' ? t : t.label;
        const active = v === value;
        return (
          <button key={v} type="button" role="tab" aria-selected={active} onClick={() => onChange(v)}
            className={`-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm transition-colors ${active ? 'border-violet font-semibold text-violet-deep' : 'border-transparent text-ink-soft hover:text-ink'}`}>
            {label}{t.count !== undefined && <span className="ml-1.5 rounded-full bg-mist px-1.5 text-[11px] tabular text-ink-soft">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
