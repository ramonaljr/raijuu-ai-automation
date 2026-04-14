import { test, expect } from '@playwright/test';

test.describe('Portal visual — signed out', () => {
  test('/sign-in renders split brand panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/sign-in');
    await expect(page.getByText(/Your automations, live/i)).toBeVisible();
    await expect(page).toHaveScreenshot('sign-in.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('/no-engagement renders portal-branded dead-end', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/no-engagement');
    await expect(page.getByText(/One more step/i)).toBeVisible();
    await expect(page).toHaveScreenshot('no-engagement.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Reduced motion', () => {
  test('/sign-in honors prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/sign-in');
    await expect(page).toHaveScreenshot('sign-in-reduced-motion.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
