import { test, expect } from '@playwright/test';

test('happy path: submit demo and land on result screen', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: /see raijuu in action/i })).toBeVisible();

  await page.fill('input[type=email]', `test-${Date.now()}@raijuu.test`);
  await page.selectOption('select', 'saas');
  await page.fill('textarea', 'We get 80 support tickets a day and spend half of Monday just categorizing them. It is slow.');
  await page.getByRole('button', { name: /run analysis/i }).click();

  await expect(page.getByText(/analyzing your situation/i)).toBeVisible();
  await expect(page.getByText(/analysis complete/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(3);
});

test('rejects obviously invalid email client-side', async ({ page }) => {
  await page.goto('/demo');
  await page.fill('input[type=email]', 'not-an-email');
  await page.fill('textarea', 'Some real situation text that is long enough to pass the minimum character check here.');
  await page.getByRole('button', { name: /run analysis/i }).click();
  await expect(page.getByRole('heading', { name: /see raijuu in action/i })).toBeVisible();
});
