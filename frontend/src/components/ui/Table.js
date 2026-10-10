/** Tabel data dengan header konsisten; columns: [{ key, label, render, className }] */
export default function Table({ columns, rows, rowKey, empty = 'Belum ada data.', onRowClick, minWidth = 640 }) {
  if (!rows?.length) return <p className="px-5 py-8 text-center text-sm text-ink-faint">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line text-left text-[12px] text-ink-faint">
            {columns.map((c) => <th key={c.key} scope="col" className={`px-5 py-2.5 font-medium ${c.thClassName || ''}`}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r[rowKey]} className={onRowClick ? 'cursor-pointer hover:bg-mist/70' : ''} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map((c) => <td key={c.key} className={`px-5 py-3 align-top ${c.className || ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
