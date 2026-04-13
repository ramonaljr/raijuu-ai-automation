import { test, expect } from '@playwright/test';

test('signed-out user hitting /admin is redirected to /sign-in', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('signed-out user hitting /app is redirected to /sign-in', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('landing page is publicly accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/raijuu/i);
});
