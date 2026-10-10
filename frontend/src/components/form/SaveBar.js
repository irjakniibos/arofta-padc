import Button from '@/components/ui/Button';

/** Bar simpan yang menempel di bawah layar pada formulir panjang. */
export default function SaveBar({ saving, label = 'Simpan perubahan', note, children }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-white/95 px-5 py-3 backdrop-blur">
      {note && <p className="mr-auto text-[13px] text-ink-faint">{note}</p>}
      {children}
      <Button type="submit" loading={saving}>{label}</Button>
    </div>
  );
}
