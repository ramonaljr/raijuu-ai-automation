import { test, expect, request } from '@playwright/test';

test('signed-out user hitting /app/runs is redirected to /sign-in', async ({ page }) => {
  await page.goto('/app/runs');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('signed-out user hitting /app/reports is redirected to /sign-in', async ({ page }) => {
  await page.goto('/app/reports');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('/no-engagement renders the dead-end message (no auth required for the page itself)', async ({ page }) => {
  await page.goto('/no-engagement');
  await expect(page.getByText("We can't find your engagement")).toBeVisible();
});

test('webhook rejects unauthenticated requests', async () => {
  const ctx = await request.newContext();
  const res = await ctx.post('http://localhost:3000/api/n8n/run-callback', {
    data: { n8nExecutionId: 'e2e', automationId: 1, startedAt: new Date().toISOString(), status: 'success' },
  });
  expect(res.status()).toBe(401);
});
