/**
 * Mobile Visual Regression Tests
 * Playwright tests for mobile viewport screenshots
 */

import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'iPhone_SE', width: 375, height: 667 },
  { name: 'iPhone_12_Pro', width: 390, height: 844 },
  { name: 'iPhone_14_Pro', width: 393, height: 852 },
  { name: 'iPhone_14_Pro_Max', width: 428, height: 926 },
];

const routes = [
  { path: '/', name: 'homepage' },
  { path: '/mlb', name: 'mlb' },
];

test.describe('Mobile Visual Regression', () => {
  for (const viewport of viewports) {
    for (const route of routes) {
      test(`${route.name} on ${viewport.name}`, async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Navigate to route
        await page.goto(`http://localhost:3000${route.path}`);

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Wait a bit for animations
        await page.waitForTimeout(1000);

        // Take screenshot and compare
        await expect(page).toHaveScreenshot(
          `${route.name}-${viewport.name}.png`,
          {
            maxDiffPixels: 100,
            fullPage: true,
          }
        );
      });
    }
  }
});

test.describe('Touch Target Validation', () => {
  test('All interactive elements have minimum 44px tap targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    // Get all clickable elements
    const buttons = await page.locator('button, a, input[type="button"], input[type="submit"]').all();

    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Portrait Mode Check', () => {
  test('No horizontal scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
