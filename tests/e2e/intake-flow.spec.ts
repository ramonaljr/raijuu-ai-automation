import { test, expect } from '@playwright/test';
import {
  seedTestEngagement,
  cleanupTestEngagement,
} from './fixtures/seed-engagement';

let engagementId: number;
let leadId: number;
let token: string;

test.beforeEach(async () => {
  const seed = await seedTestEngagement();
  engagementId = seed.engagementId;
  leadId = seed.leadId;
  token = seed.token;
});

test.afterEach(async () => {
  try {
    await cleanupTestEngagement(engagementId, leadId);
  } catch (err) {
    // Don't mask test failures with cleanup errors; just log
    console.error('[intake-flow.spec] cleanup failed', err);
  }
});

test('intake happy path: walk all 5 steps and land on success screen', async ({
  page,
}) => {
  await page.goto(`/onboard/${engagementId}?token=${token}`);

  // Step 1 — company prefilled, fill role
  await expect(
    page.getByRole('heading', { name: /welcome, e2e test co/i }),
  ).toBeVisible();
  await page.getByLabel(/your role/i).fill('Head of Ops');
  await page.getByRole('button', { name: /^next$/i }).click();

  // Step 2 — pick a known tool (rendered as a <button>, not a labeled checkbox)
  await expect(
    page.getByRole('heading', { name: /what tools does your team live in/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Slack', exact: true }).click();
  await page.getByRole('button', { name: /^next$/i }).click();

  // Step 3 — credentials vault URL is optional, leave blank
  await expect(
    page.getByRole('heading', { name: /how should we share credentials/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^next$/i }).click();

  // Step 4 — three goal textareas
  await expect(
    page.getByRole('heading', { name: /your top 3 target automations/i }),
  ).toBeVisible();
  await page.getByLabel('Goal 1').fill('Auto-tag inbound support tickets by product area');
  await page.getByLabel('Goal 2').fill('Push paid Stripe invoices into QuickBooks nightly');
  await page.getByLabel('Goal 3').fill('Summarize weekly sales calls into a Slack digest');
  await page.getByRole('button', { name: /^next$/i }).click();

  // Step 5 — success metric (label includes a counter, so use partial match)
  await expect(
    page.getByRole('heading', { name: /how will we know it/i }),
  ).toBeVisible();
  await page
    .getByLabel(/success metric/i)
    .fill('Cut the weekly ops sync from 90 minutes to under 15');

  await page.getByRole('button', { name: /submit intake/i }).click();

  // Done screen
  await expect(page.getByText(/you're in\./i)).toBeVisible({ timeout: 15_000 });
});
