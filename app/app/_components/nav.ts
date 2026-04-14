export const WORKSPACE_ITEMS = [
  { label: 'Overview', href: '/app' },
  { label: 'Runs', href: '/app/runs' },
  { label: 'Reports', href: '/app/reports' },
] as const;

export const ACCOUNT_ITEMS = [
  { label: 'Settings', href: '/app/settings' },
  { label: 'Help', href: '/app/help' },
] as const;

export function isActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === '/app') return currentPath === '/app';
  if (itemHref.startsWith('/app/')) {
    return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
  }
  return false;
}
