/** Judul halaman dashboard + deskripsi singkat + tombol aksi utama. */
export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
