function SortIcon({ active, direction }) {
  return (
    <span className="inline-block ml-1 text-[10px]">
      {active ? (direction === 'asc' ? '\u25B2' : '\u25BC') : '\u21C5'}
    </span>
  );
}

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data found',
  rowKey = 'id',
  onRowClick,
  sortKey,
  sortDir,
  onSort,
}) {
  const colSpan = columns.length;

  return (
    <div className="bg-gray-50 dark:bg-[#282843] rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-white/10 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                className={`px-4 py-3 font-semibold ${col.sortable ? 'select-none cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors' : ''} ${sortKey === col.key ? 'text-primary' : ''} ${col.className || ''}`}
              >
                {col.label}
                {col.sortable && <SortIcon active={sortKey === col.key} direction={sortDir} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                {loadingMessage}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 text-sm text-gray-700 dark:text-gray-300 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map(col => {
                  const cellContent = col.render ? col.render(row) : (row[col.key] ?? '—');
                  return (
                    <td key={col.key} className={`px-4 py-3 ${col.cellClassName || col.className || ''}`}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
