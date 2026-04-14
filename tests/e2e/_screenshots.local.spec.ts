/**
 * One-shot screenshot harness. Not part of CI. Generates PNGs in
 * /tmp/raijuu-shots/ for the signed-in portal surfaces using a Clerk
 * sign-in ticket minted via the backend SDK.
 *
 * Run: pnpm exec playwright test tests/e2e/_screenshots.local.spec.ts
 */
import { test, expect } from '@playwright/test';
import { createClerkClient } from '@clerk/backend';

const USER_EMAIL =
  process.env.E2E_SCREENSHOT_EMAIL ?? 'ramonvallejerajr@gmail.com';
const OUT_DIR = '/tmp/raijuu-shots';

async function signInWithTicket(page: import('@playwright/test').Page) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    throw new Error('Missing CLERK_SECRET_KEY / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }
  const clerk = createClerkClient({ secretKey, publishableKey });
  const users = await clerk.users.getUserList({
    emailAddress: [USER_EMAIL],
    limit: 1,
  });
  if (users.data.length === 0) {
    throw new Error(`No Clerk user found for ${USER_EMAIL}`);
  }
  const userId = users.data[0].id;
  const token = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 600,
  });

  await page.goto(
    `/sign-in?__clerk_ticket=${encodeURIComponent(token.token)}&redirect_url=/app`,
  );
  await page.waitForURL(/\/app/, { timeout: 20000 });
  // Let content settle (data fetches + motion).
  await page.waitForLoadState('networkidle');
}

test.describe('portal signed-in screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signInWithTicket(page);
  });

  test('overview', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/here's today/i)).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/overview.png`, fullPage: true });
  });

  test('runs', async ({ page }) => {
    await page.goto('/app/runs');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /^Runs$/ })).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/runs.png`, fullPage: true });
  });

  test('reports', async ({ page }) => {
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /^Reports$/ })).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/reports.png`, fullPage: true });
  });

  test('settings', async ({ page }) => {
    await page.goto('/app/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /^Settings$/ })).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/settings.png`, fullPage: true });
  });

  test('help', async ({ page }) => {
    await page.goto('/app/help');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT_DIR}/help.png`, fullPage: true });
  });

  test('mobile overview', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/here's today/i)).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/mobile-overview.png`, fullPage: true });
  });
});
