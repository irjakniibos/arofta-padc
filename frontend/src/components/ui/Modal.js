'use client';

/**
 * Dialog modal yang dapat diakses keyboard (Esc untuk menutup, fokus berpindah ke dialog).
 * `dismissable={false}` untuk dialog wajib: tanpa tombol tutup, Esc, atau klik latar.
 */
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, size = 'md', dismissable = true }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = dismissable ? onClose : null;
  // Efek hanya bergantung pada `open` agar fokus tidak berpindah setiap kali induk dirender ulang (mis. saat mengetik)
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open]);

  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      {dismissable ? <button type="button" aria-label="Tutup" className="absolute inset-0 bg-ink/40" onClick={onClose} /> : <div className="absolute inset-0 bg-ink/40" />}
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="modal-title"
        className={`relative flex max-h-[92dvh] w-full ${width} flex-col rounded-t-panel bg-white shadow-xl outline-none sm:rounded-panel`}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id="modal-title" className="text-[17px] font-semibold">{title}</h2>
          {dismissable && <button type="button" onClick={onClose} className="rounded-control p-1 text-ink-faint hover:bg-mist hover:text-ink" aria-label="Tutup"><X className="h-5 w-5" /></button>}
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
