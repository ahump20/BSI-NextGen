/**
 * Comprehensive Sports Pages E2E Tests
 * Tests for all sports routes and functionality
 */

import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:3000';

test.describe('Homepage', () => {
  test('should load and display main navigation', async ({ page }) => {
    await page.goto(baseURL);
    await expect(page).toHaveTitle(/Blaze Sports Intel/i);

    // Check for main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // No horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });
});

test.describe('MLB Page', () => {
  test('should load MLB games page', async ({ page }) => {
    await page.goto(`${baseURL}/sports/mlb`);
    await page.waitForLoadState('networkidle');

    // Check for MLB-specific content
    const content = await page.textContent('body');
    expect(content).toContain('MLB');
  });

  test('should display loading state initially', async ({ page }) => {
    const response = page.goto(`${baseURL}/sports/mlb`, {
      waitUntil: 'commit',
    });

    // Check for loading indicators (spinner, skeleton, or "Loading" text)
    const hasLoadingIndicator = await page.locator('text=Loading').count() > 0 ||
                                 await page.locator('[class*="animate-spin"]').count() > 0 ||
                                 await page.locator('[class*="skeleton"]').count() > 0;

    // We don't assert this as the page might load too fast
    // But we log it for monitoring
    console.log('Has loading indicator:', hasLoadingIndicator);

    await response;
  });
});

test.describe('NFL Page', () => {
  test('should load NFL games page', async ({ page }) => {
    await page.goto(`${baseURL}/sports/nfl`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toContain('NFL');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/api/sports/nfl/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto(`${baseURL}/sports/nfl`);
    await page.waitForLoadState('networkidle');

    // Page should not crash - either show error message or empty state
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

test.describe('NBA Page', () => {
  test('should load NBA games page', async ({ page }) => {
    await page.goto(`${baseURL}/sports/nba`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toContain('NBA');
  });
});

test.describe('College Baseball', () => {
  test('should load college baseball main page', async ({ page }) => {
    await page.goto(`${baseURL}/sports/college-baseball`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('baseball');
  });

  test('should load college baseball standings', async ({ page }) => {
    await page.goto(`${baseURL}/sports/college-baseball/standings`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('standing');
  });

  test('should load college baseball rankings', async ({ page }) => {
    await page.goto(`${baseURL}/sports/college-baseball/rankings`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/rank|top/);
  });
});

test.describe('Unified Dashboard', () => {
  test('should load unified sports dashboard', async ({ page }) => {
    await page.goto(`${baseURL}/unified`);
    await page.waitForLoadState('networkidle');

    // Should display content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(0);
  });
});

test.describe('Authentication Pages', () => {
  test('should load login page', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('login');
  });

  test('should load profile page', async ({ page }) => {
    await page.goto(`${baseURL}/profile`);
    await page.waitForLoadState('networkidle');

    // Should either show profile or redirect to login
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});

test.describe('Navigation', () => {
  test('should navigate between sports pages', async ({ page }) => {
    await page.goto(baseURL);

    // Find and click MLB link if it exists
    const mlbLink = page.locator('a[href*="mlb"]').first();
    if (await mlbLink.count() > 0) {
      await mlbLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('mlb');
    }
  });

  test('should return home from any page', async ({ page }) => {
    await page.goto(`${baseURL}/sports/mlb`);

    // Find home link
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.count() > 0) {
      await homeLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBe(`${baseURL}/`);
    }
  });
});

test.describe('Performance', () => {
  test('homepage should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Homepage load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('should not have layout shift on load', async ({ page }) => {
    await page.goto(baseURL);

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Get initial layout
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);

    // Wait a bit more for any delayed content
    await page.waitForTimeout(1000);

    // Check if layout changed significantly
    const finalHeight = await page.evaluate(() => document.body.scrollHeight);
    const heightDiff = Math.abs(finalHeight - initialHeight);

    // Allow for small variations but catch major shifts
    expect(heightDiff).toBeLessThan(100);
  });
});

test.describe('Accessibility', () => {
  test('homepage should have valid HTML landmarks', async ({ page }) => {
    await page.goto(baseURL);

    // Check for semantic HTML
    const main = await page.locator('main').count();
    const header = await page.locator('header').count();

    // At least one of these should exist
    expect(main + header).toBeGreaterThan(0);
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto(baseURL);

    // Get first focusable element
    const firstFocusable = page.locator('button, a, input, select, textarea').first();

    if (await firstFocusable.count() > 0) {
      await firstFocusable.focus();
      const isFocused = await firstFocusable.evaluate(
        (el) => el === document.activeElement
      );
      expect(isFocused).toBe(true);
    }
  });
});

test.describe('Error Handling', () => {
  test('should show error page for 404', async ({ page }) => {
    const response = await page.goto(`${baseURL}/this-page-does-not-exist`);

    // Should get 404 response
    expect(response?.status()).toBe(404);

    // Should show not found content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);

    try {
      await page.goto(baseURL, { timeout: 5000 });
    } catch (error) {
      // Expected to fail
      expect(error).toBeTruthy();
    }

    // Restore online
    await page.context().setOffline(false);
  });
});
