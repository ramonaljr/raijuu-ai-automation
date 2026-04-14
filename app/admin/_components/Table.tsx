import type { ReactNode } from 'react';

export type Column<T> = {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  // Stable React key for columns whose header is a ReactNode (e.g. a sort link).
  // Falls back to the index when omitted.
  key?: string;
};

export function Table<T extends { id: number | string }>({
  columns,
  rows,
  emptyFallback,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyFallback?: ReactNode;
}) {
  if (rows.length === 0 && emptyFallback) return <>{emptyFallback}</>;
  const colKey = (c: Column<T>, i: number) =>
    c.key ?? (typeof c.header === 'string' ? c.header : String(i));
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left">
          <tr>
            {columns.map((c, i) => (
              <th
                key={colKey(c, i)}
                className={`px-3 py-2 font-medium text-neutral-600 ${c.className ?? ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              {columns.map((c, i) => (
                <td
                  key={colKey(c, i)}
                  className={`px-3 py-2 align-top ${c.className ?? ''}`}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
