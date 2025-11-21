import { test, expect } from '@playwright/test';

/**
 * Example E2E tests for Blaze Sports Intel
 * Mobile-first testing approach
 */

test.describe('Landing Page', () => {
  test('should load and display key sections', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Blaze Sports Intel/);

    // Verify main navigation exists
    await expect(page.locator('nav')).toBeVisible();

    // Check for dashboard cards (adapt to your actual UI)
    const expectedSections = [
      'College Baseball',
      'MLB',
      'Rankings',
      'Live Scores',
    ];

    for (const section of expectedSections) {
      await expect(
        page.getByText(section, { exact: false })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify mobile-optimized layout
    await expect(page.locator('nav')).toBeVisible();

    // Check for hamburger menu or mobile nav
    const mobileMenu = page.locator('[aria-label="Menu"]').or(
      page.locator('button[aria-expanded]')
    );
    await expect(mobileMenu).toBeVisible();
  });
});

test.describe('College Baseball Features', () => {
  test('should load box scores', async ({ page }) => {
    await page.goto('/college-baseball/scores');

    // Wait for scores to load
    await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 });

    // Verify at least one game card exists
    const gameCards = page.locator('[data-testid="game-card"]');
    await expect(gameCards.first()).toBeVisible();
  });

  test('should display D1 rankings', async ({ page }) => {
    await page.goto('/college-baseball/rankings');

    // Wait for rankings table
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });

    // Verify rankings are numbered
    const rankings = page.locator('tr, [role="row"]');
    await expect(rankings.first()).toContainText(/1|#1/);
  });
});

test.describe('Authentication', () => {
  test('should show login button when not authenticated', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByRole('button', { name: /sign in|log in/i });
    await expect(loginButton).toBeVisible();
  });

  test.skip('should redirect to Auth0 on login click', async ({ page }) => {
    // This test requires Auth0 setup - skip for now
    await page.goto('/');

    const loginButton = page.getByRole('button', { name: /sign in|log in/i });
    await loginButton.click();

    // Verify redirect to Auth0 (or login modal)
    await expect(page).toHaveURL(/auth0|login/);
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Assert load time < 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Lighthouse scores', async ({ page, browser }) => {
    // Note: This requires @playwright/test Lighthouse integration
    // Install: npm install -D playwright-lighthouse
    await page.goto('/');

    // Placeholder - implement actual Lighthouse audit
    // const report = await playAudit({ page, browser });
    // expect(report.lhr.categories.performance.score).toBeGreaterThan(0.9);
  });
});
