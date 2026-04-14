import Link from 'next/link';

export function Pager({
  total,
  page,
  pageSize,
  totalPages,
  hrefFor,
}: {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between text-xs text-neutral-600">
      <span>
        {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="rounded border px-2 py-0.5 hover:bg-neutral-50"
          >
            ← Prev
          </Link>
        ) : (
          <span className="rounded border px-2 py-0.5 opacity-40">← Prev</span>
        )}
        <span>
          Page {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="rounded border px-2 py-0.5 hover:bg-neutral-50"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded border px-2 py-0.5 opacity-40">Next →</span>
        )}
      </div>
    </div>
  );
}
