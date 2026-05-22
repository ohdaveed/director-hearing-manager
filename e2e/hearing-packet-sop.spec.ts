import { test, expect, type Page } from '@playwright/test';

const requiredEnv = ['E2E_TEST_EMAIL', 'E2E_TEST_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

const seedSlug = process.env.E2E_SEED_SLUG ?? 'hearing-packet';
const seedTag = `E2E-${seedSlug}`;

async function signIn(page: Page) {
  const email = process.env.E2E_TEST_EMAIL ?? '';
  const password = process.env.E2E_TEST_PASSWORD ?? '';

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard');
}

test.describe('Director hearing packet SOP compliance', () => {
  test.skip(missingEnv.length > 0, `Missing env vars: ${missingEnv.join(', ')}`);

  test('creates/opens packet and verifies SOP compliance', async ({ page }) => {
    await signIn(page);

    await page.goto('/enforcement');
    await page.getByTestId('escalation-search').fill(seedTag);

    const targetRow = page.locator('table tbody tr', { hasText: seedTag }).first();
    await expect(targetRow).toBeVisible();
    await targetRow.click();

    const createButton = page.getByTestId('create-hearing-packet');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.getByTestId('confirm-create-packet').click();
    } else {
      const openPacket = page.getByRole('button', { name: /Open Packet/i });
      await expect(openPacket).toBeVisible();
      await openPacket.click();
    }

    await expect(page.getByTestId('packet-detail')).toBeVisible();

    await page.getByTestId('packet-tab-readiness').click();
    await page.getByTestId('packet-refresh-snapshot').click();

    await expect(page.getByTestId('packet-validation-panel')).toContainText('SOP-001');
    await expect(page.getByTestId('packet-validation-SOP-001')).toContainText('pass');
    await expect(page.getByTestId('packet-validation-SOP-010')).toContainText('pass');
    await expect(page.getByTestId('packet-validation-SIG-001')).toContainText('pass');

    const failing = page
      .locator('[data-testid^="packet-validation-"]')
      .filter({ hasText: /\bfail\b/i });
    await expect(failing).toHaveCount(0);

    await page.getByTestId('open-packet-preview').click();
    await expect(page.getByTestId('hearing-packet-print')).toBeVisible();

    const orderIsValid = await page.evaluate(() => {
      const cover = document.querySelector('[data-testid="packet-section-cover"]');
      const summary = document.querySelector('[data-testid="packet-section-summary"]');
      const chronology = document.querySelector('[data-testid="packet-section-chronology"]');
      const exhibitA = document.querySelector('[data-testid="packet-exhibit-A"]');
      const exhibitE = document.querySelector('[data-testid="packet-exhibit-e"]');

      if (!cover || !summary || !chronology || !exhibitA || !exhibitE) return false;

      const isBefore = (a, b) =>
        Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

      return (
        isBefore(cover, summary) &&
        isBefore(summary, chronology) &&
        isBefore(chronology, exhibitA) &&
        isBefore(exhibitA, exhibitE)
      );
    });

    expect(orderIsValid).toBe(true);
    await expect(page.getByTestId('exhibit-label-e')).toBeVisible();
    await expect(page.getByTestId('packet-exhibit-A')).toContainText('Exhibit A');

    const photoPages = page.getByTestId('packet-photo-page');
    const photoPageCount = await photoPages.count();
    expect(photoPageCount).toBeGreaterThan(0);

    const perPagePhotoCounts = await photoPages.evaluateAll((pages) =>
      pages.map((pageEl) => pageEl.querySelectorAll('img').length),
    );
    expect(perPagePhotoCounts.every((count) => count <= 1)).toBe(true);
  });
});
