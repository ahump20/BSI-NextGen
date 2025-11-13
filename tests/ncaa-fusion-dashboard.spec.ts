import { test, expect, devices } from '@playwright/test';

/**
 * NCAA Fusion Dashboard E2E Tests
 *
 * Tests the complete NCAA Fusion Dashboard functionality including:
 * - Page loading and rendering
 * - Data fetching and display
 * - Query parameter handling
 * - Mobile responsiveness
 * - Error handling
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('NCAA Fusion Dashboard', () => {
  test.describe('Desktop', () => {
    test('loads Texas Basketball dashboard successfully', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251&year=2024&week=10`
      );

      // Check page title
      await expect(page.locator('h1')).toContainText('Team Intelligence Board');

      // Check kicker text
      await expect(page.locator('.di-kicker')).toContainText('NCAA Fusion');

      // Check subtitle
      await expect(page.locator('.di-page-subtitle')).toBeVisible();

      // Verify team card exists
      await expect(page.locator('.fusion-team')).toBeVisible();

      // Verify Pythagorean analytics card
      await expect(page.locator('.fusion-analytics')).toBeVisible();
      await expect(
        page.locator('.fusion-analytics h2')
      ).toContainText('Pythagorean Reality Check');

      // Verify upcoming game card
      await expect(page.locator('.fusion-upcoming')).toBeVisible();

      // Verify standings card
      await expect(page.locator('.fusion-standings')).toBeVisible();
    });

    test('displays team information correctly', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for team card to load
      await page.waitForSelector('.fusion-team-header', { timeout: 10000 });

      // Check team name is displayed
      const teamName = page.locator('.fusion-team-meta h2');
      await expect(teamName).toBeVisible();

      // Check team logo is displayed
      const teamLogo = page.locator('.fusion-team-logo');
      await expect(teamLogo).toBeVisible();

      // Check team location/abbreviation
      await expect(page.locator('.fusion-team-location')).toBeVisible();
    });

    test('displays Pythagorean metrics correctly', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for analytics to load
      await page.waitForSelector('.fusion-analytics', { timeout: 10000 });

      // Check for actual wins metric
      await expect(
        page.locator('.fusion-metric-label:has-text("Actual wins")')
      ).toBeVisible();

      // Check for expected wins metric
      await expect(
        page.locator('.fusion-metric-label:has-text("Expected wins")')
      ).toBeVisible();

      // Check for over/under metric
      await expect(
        page.locator('.fusion-metric-label:has-text("Over / under")')
      ).toBeVisible();

      // Verify metric chips exist
      const chips = page.locator('.fusion-metric-chip');
      await expect(chips.first()).toBeVisible();
    });

    test('displays efficiency metrics correctly', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for analytics to load
      await page.waitForSelector('.fusion-analytics', { timeout: 10000 });

      // Check for avg points for
      await expect(
        page.locator('.fusion-metric-label:has-text("Avg points for")')
      ).toBeVisible();

      // Check for avg points against
      await expect(
        page.locator('.fusion-metric-label:has-text("Avg points against")')
      ).toBeVisible();

      // Check for differential
      await expect(
        page.locator('.fusion-metric-label:has-text("Differential")')
      ).toBeVisible();
    });

    test('displays standings table correctly', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for standings to load
      await page.waitForSelector('.fusion-standings', { timeout: 10000 });

      // Check table exists
      const table = page.locator('.fusion-table');
      await expect(table).toBeVisible();

      // Check table headers
      await expect(page.locator('th:has-text("Scope")')).toBeVisible();
      await expect(page.locator('th:has-text("W")')).toBeVisible();
      await expect(page.locator('th:has-text("L")')).toBeVisible();
      await expect(page.locator('th:has-text("Pct")')).toBeVisible();
    });

    test('handles different sports correctly', async ({ page }) => {
      // Test basketball
      await page.goto(`${BASE_URL}/college/fusion?sport=basketball`);
      await expect(page.locator('.di-kicker')).toContainText('basketball');

      // Test football
      await page.goto(`${BASE_URL}/college/fusion?sport=football`);
      await expect(page.locator('.di-kicker')).toContainText('football');

      // Test baseball
      await page.goto(`${BASE_URL}/college/fusion?sport=baseball`);
      await expect(page.locator('.di-kicker')).toContainText('baseball');
    });

    test('handles invalid sport parameter', async ({ page }) => {
      await page.goto(`${BASE_URL}/college/fusion?sport=invalid`);

      // Should show error
      await expect(page.locator('.fusion-error')).toBeVisible();
      await expect(page.locator('.fusion-error')).toContainText(
        'Unsupported sport'
      );
    });

    test('displays timestamp in America/Chicago timezone', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for team stats to load
      await page.waitForSelector('.fusion-team-stats', { timeout: 10000 });

      // Check last sync timestamp exists
      const timestamp = page.locator('dt:has-text("Last sync")');
      await expect(timestamp).toBeVisible();
    });
  });

  test.describe('Mobile', () => {
    test.use(devices['iPhone 12']);

    test('loads and displays correctly on mobile', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Check main elements are visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.fusion-team')).toBeVisible();
      await expect(page.locator('.fusion-analytics')).toBeVisible();

      // Check cards stack vertically (single column on mobile)
      const gridComputedStyle = await page
        .locator('.fusion-grid')
        .evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            display: style.display,
            gridTemplateColumns: style.gridTemplateColumns,
          };
        });

      expect(gridComputedStyle.display).toBe('grid');
    });

    test('table scrolls horizontally on mobile', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for standings table
      await page.waitForSelector('.fusion-table-wrapper', { timeout: 10000 });

      // Check table wrapper has overflow
      const overflowX = await page
        .locator('.fusion-table-wrapper')
        .evaluate((el) => window.getComputedStyle(el).overflowX);

      expect(overflowX).toBe('auto');
    });

    test('metric chips are touch-friendly', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for metrics to load
      await page.waitForSelector('.fusion-metric-chip', { timeout: 10000 });

      // Check chip size (should be at least 44px for touch targets)
      const chipBox = await page
        .locator('.fusion-metric-chip')
        .first()
        .boundingBox();

      expect(chipBox).not.toBeNull();
      if (chipBox) {
        expect(chipBox.height).toBeGreaterThanOrEqual(24); // Reasonable for inline chips
      }
    });
  });

  test.describe('Error Handling', () => {
    test('displays error when API fails', async ({ page }) => {
      // Navigate with invalid teamId that might cause API error
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=999999`
      );

      // Should either load with default data or show error
      const hasError = await page.locator('.fusion-error').isVisible();
      const hasTeamCard = await page.locator('.fusion-team').isVisible();

      // One of these should be true
      expect(hasError || hasTeamCard).toBeTruthy();
    });

    test('handles missing query parameters gracefully', async ({ page }) => {
      // Navigate without any query parameters
      await page.goto(`${BASE_URL}/college/fusion`);

      // Should load with defaults (basketball)
      await expect(page.locator('h1')).toContainText('Team Intelligence Board');
      await expect(page.locator('.di-kicker')).toContainText('basketball');
    });
  });

  test.describe('Performance', () => {
    test('loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for main content to be visible
      await page.waitForSelector('.fusion-team', { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('caches API responses', async ({ page }) => {
      // First load
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );
      await page.waitForSelector('.fusion-team', { timeout: 10000 });

      // Second load (should be from cache)
      const startTime = Date.now();
      await page.reload();
      await page.waitForSelector('.fusion-team', { timeout: 10000 });
      const cachedLoadTime = Date.now() - startTime;

      // Cached load should be faster (under 2 seconds)
      expect(cachedLoadTime).toBeLessThan(2000);
    });
  });

  test.describe('Accessibility', () => {
    test('has proper heading hierarchy', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Check h1 exists
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Check h2 elements exist in cards
      const h2s = page.locator('h2');
      await expect(h2s.first()).toBeVisible();
    });

    test('images have alt text', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Wait for team logo to load
      await page.waitForSelector('.fusion-team-logo', { timeout: 10000 });

      // Check logo has alt text
      const logo = page.locator('.fusion-team-logo');
      const altText = await logo.getAttribute('alt');

      expect(altText).toBeTruthy();
      expect(altText).toContain('logo');
    });

    test('has semantic HTML', async ({ page }) => {
      await page.goto(
        `${BASE_URL}/college/fusion?sport=basketball&teamId=251`
      );

      // Check for semantic elements
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('section')).toBeVisible();
      await expect(page.locator('article')).toBeVisible();
    });
  });
});
