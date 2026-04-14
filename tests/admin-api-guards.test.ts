import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function findRouteFiles(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await findRouteFiles(full, acc);
    else if (entry.name === 'route.ts' || entry.name === 'route.tsx') acc.push(full);
  }
  return acc;
}

/**
 * Safety net. Middleware no longer enforces role on /api/admin/* because Clerk
 * session tokens don't include publicMetadata. Each admin API route must call
 * getRole() (or an equivalent admin check) itself. This test fails loudly if
 * someone adds a new admin route without that check.
 */
describe('admin API route guards', () => {
  it('every /api/admin/** route.ts performs an explicit admin check', async () => {
    const files = await findRouteFiles('app/api/admin').catch(() => []);
    if (files.length === 0) {
      // No admin routes yet; nothing to enforce.
      return;
    }
    const offenders: string[] = [];
    for (const file of files) {
      const src = await readFile(file, 'utf8');
      const hasRoleCheck =
        /getRole\s*\(/.test(src) ||
        /role\s*!==\s*['"]admin['"]/.test(src) ||
        /requireAdmin\s*\(/.test(src);
      if (!hasRoleCheck) offenders.push(file);
    }
    expect(offenders, `Admin routes missing role check: ${offenders.join(', ')}`).toEqual([]);
  });
});
