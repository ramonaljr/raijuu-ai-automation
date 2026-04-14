import { expect, test } from '@playwright/test';

test.describe('auth pages redesign', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sign-in renders brand shell + clerk form', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    // Wait for Clerk's hydrated form — matches the pattern from portal-visual.spec.ts.
    await expect(
      page.getByRole('textbox', { name: /email/i }),
    ).toBeVisible({ timeout: 10_000 });
    // Brand-panel wordmark is scoped to the section to avoid strict-mode conflicts
    // with any future exact-match "Raijuu" elsewhere on the page.
    await expect(
      page.locator('section[aria-label="Brand"]').getByText('Raijuu', { exact: true }),
    ).toBeVisible();
  });

  test('sign-up renders the mirrored shell', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    // Confirm Clerk's SignUp widget actually hydrated (not just the server shell).
    await expect(
      page.getByRole('textbox', { name: /email/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('mobile viewport hides the brand panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    // Brand section is rendered with display:none on mobile (hidden md:block).
    await expect(
      page.locator('section[aria-label="Brand"]').getByText('Raijuu', { exact: true }),
    ).not.toBeVisible();
  });

  test('ticker is aria-hidden so screen readers skip it', async ({ page }) => {
    await page.goto('/sign-in');
    const firstRow = page.getByTestId('ticker-row').first();
    await expect(firstRow).toBeAttached();
    // Idiomatic Playwright: assert there is an aria-hidden container that contains the ticker row.
    const ariaHiddenContainer = page
      .locator('[aria-hidden="true"]')
      .filter({ has: page.getByTestId('ticker-row') });
    await expect(ariaHiddenContainer).toHaveCount(1);
  });
});
