/** Panel konten dashboard dengan judul dan aksi opsional. */
export default function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-panel border border-line bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
