import Link from 'next/link';

/**
 * Clickable column header that toggles sort direction when already active,
 * otherwise switches to this column with a default direction. Caller owns
 * URL generation so the surrounding page can preserve other params (filter,
 * search, pagination).
 */
export function SortHeader({
  label,
  field,
  activeField,
  activeDir,
  hrefFor,
  defaultDir = 'desc',
}: {
  label: string;
  field: string;
  activeField: string;
  activeDir: 'asc' | 'desc';
  hrefFor: (field: string, dir: 'asc' | 'desc') => string;
  defaultDir?: 'asc' | 'desc';
}) {
  const isActive = field === activeField;
  const nextDir = isActive
    ? activeDir === 'asc'
      ? 'desc'
      : 'asc'
    : defaultDir;
  const arrow = isActive ? (activeDir === 'asc' ? ' ↑' : ' ↓') : '';
  return (
    <Link
      href={hrefFor(field, nextDir)}
      className={isActive ? 'font-semibold' : 'text-neutral-700 hover:underline'}
    >
      {label}
      {arrow}
    </Link>
  );
}
