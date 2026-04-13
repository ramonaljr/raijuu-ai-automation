import type { ReactNode } from 'react';

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
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
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left">
          <tr>
            {columns.map((c) => (
              <th
                key={c.header}
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
              {columns.map((c) => (
                <td
                  key={c.header}
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
