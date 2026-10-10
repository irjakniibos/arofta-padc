/** Deret angka ringkasan dalam satu panel (bukan kartu terpisah), dipisah garis tipis. */
import Link from 'next/link';

export default function StatStrip({ items }) {
  return (
    <dl className={`grid grid-cols-2 overflow-hidden rounded-panel border border-line bg-white ${items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
      {items.map((it, i) => {
        const isi = (
          <>
            <dt className="text-[13px] text-ink-soft">{it.label}</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular ${it.tone === 'alert' && it.value > 0 ? 'text-danger' : 'text-ink'}`}>{it.value}</dd>
            {it.note && <dd className="mt-0.5 text-[12px] text-ink-faint">{it.note}</dd>}
          </>
        );
        const cls = `block px-5 py-4 ${i % 2 ? 'border-l border-line' : ''} ${i >= 2 ? 'border-t border-line md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`;
        return it.href
          ? <Link key={it.label} href={it.href} className={`${cls} hover:bg-mist`}>{isi}</Link>
          : <div key={it.label} className={cls}>{isi}</div>;
      })}
    </dl>
  );
}
