import { expect, test } from '@playwright/test';

test.describe('auth pages redesign', () => {
  test('sign-in renders brand shell + clerk form', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(
      page.locator('input[name="identifier"], input[type="email"]').first(),
    ).toBeVisible();
    // Brand panel wordmark — present as a styled div (demoted from h1 for single-h1 a11y).
    await expect(page.getByText('Raijuu', { exact: true })).toBeVisible();
  });

  test('sign-up renders the mirrored shell', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('mobile viewport hides the brand panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    // Brand panel (and its "Raijuu" wordmark div) are hidden on mobile via md:hidden.
    await expect(page.getByText('Raijuu', { exact: true })).not.toBeVisible();
  });

  test('ticker is aria-hidden so screen readers skip it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/sign-in');
    // data-testid="ticker-row" elements exist inside an aria-hidden container.
    const firstRow = page.getByTestId('ticker-row').first();
    await expect(firstRow).toBeAttached();
    // The ticker's wrapping section carries aria-hidden="true".
    const ariaHiddenAncestor = firstRow.locator('xpath=ancestor::*[@aria-hidden="true"][1]');
    await expect(ariaHiddenAncestor).toBeAttached();
  });
});
