'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.total_pages <= 1) return null;
  const { page, total_pages: pages, total } = meta;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-3 text-sm">
      <span className="text-ink-soft">Halaman {page} dari {pages}, total {total} data</span>
      <div className="flex gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Halaman sebelumnya"
          className="rounded-control border border-line p-1.5 hover:bg-mist disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Halaman berikutnya"
          className="rounded-control border border-line p-1.5 hover:bg-mist disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
