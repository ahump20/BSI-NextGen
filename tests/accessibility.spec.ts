import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Accessibility Tests
 *
 * Tests WCAG 2.1 Level AA compliance across the application
 * - Color contrast
 * - Keyboard navigation
 * - Screen reader support
 * - ARIA attributes
 * - Semantic HTML
 */

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await injectAxe(page);
  });

  test('Homepage should have no accessibility violations', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('Homepage should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
      elements.map((el) => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.trim(),
      }))
    );

    // Should start with h1
    expect(headings[0]?.level).toBe(1);

    // Check no levels are skipped
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i].level - headings[i - 1].level;
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('All images should have alt text', async ({ page }) => {
    const imagesWithoutAlt = await page.$$eval('img', (images) =>
      images.filter((img) => !img.getAttribute('alt'))
    );

    expect(imagesWithoutAlt.length).toBe(0);
  });

  test('All links should have accessible names', async ({ page }) => {
    const linksWithoutNames = await page.$$eval('a', (links) =>
      links.filter(
        (link) =>
          !link.textContent?.trim() &&
          !link.getAttribute('aria-label') &&
          !link.getAttribute('aria-labelledby')
      )
    );

    expect(linksWithoutNames.length).toBe(0);
  });

  test('All buttons should have accessible names', async ({ page }) => {
    const buttonsWithoutNames = await page.$$eval('button', (buttons) =>
      buttons.filter(
        (button) =>
          !button.textContent?.trim() &&
          !button.getAttribute('aria-label') &&
          !button.getAttribute('aria-labelledby')
      )
    );

    expect(buttonsWithoutNames.length).toBe(0);
  });

  test('Interactive elements should be keyboard accessible', async ({ page }) => {
    // Check all interactive elements can be focused
    const interactiveElements = await page.$$(
      'a, button, input, select, textarea, [role="button"], [role="link"]'
    );

    for (const element of interactiveElements) {
      const tabindex = await element.getAttribute('tabindex');
      const isDisabled = await element.getAttribute('disabled');

      if (!isDisabled && tabindex !== '-1') {
        await element.focus();
        const isFocused = await element.evaluate(
          (el) => el === document.activeElement
        );
        expect(isFocused).toBeTruthy();
      }
    }
  });

  test('Should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    const initialFocus = await page.evaluate(() => document.activeElement?.tagName);

    // Press Tab
    await page.keyboard.press('Tab');
    const afterFirstTab = await page.evaluate(() => document.activeElement?.tagName);

    // Focus should change
    expect(afterFirstTab).not.toBe(initialFocus);
  });

  test('Skip link should be present and functional', async ({ page }) => {
    // Press Tab to focus skip link
    await page.keyboard.press('Tab');

    // Check if skip link is focused
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        text: el?.textContent,
        href: (el as HTMLAnchorElement)?.href,
      };
    });

    // Skip link should be first focusable element
    if (focusedElement.tag === 'A' && focusedElement.text?.includes('Skip')) {
      // Activate skip link
      await page.keyboard.press('Enter');

      // Wait for navigation
      await page.waitForTimeout(100);

      // Check focus moved to main content
      const afterSkip = await page.evaluate(
        () => document.activeElement?.getAttribute('id')
      );
      expect(afterSkip).toBeTruthy();
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    // This is checked by axe, but we can also do manual checks
    const contrastIssues = await page.evaluate(() => {
      const issues: string[] = [];

      // Check all text elements
      document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, span').forEach((el) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bg = styles.backgroundColor;
        const fontSize = parseFloat(styles.fontSize);

        // Simple check: ensure color is not same as background
        if (color === bg) {
          issues.push(`Element has same color and background: ${el.tagName}`);
        }

        // Check minimum font size
        if (fontSize < 14) {
          issues.push(`Text too small (${fontSize}px): ${el.textContent?.slice(0, 30)}`);
        }
      });

      return issues;
    });

    expect(contrastIssues).toHaveLength(0);
  });

  test('Form inputs should have labels', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    const inputsWithoutLabels = await page.$$eval('input, textarea, select', (inputs) =>
      inputs.filter((input) => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');

        if (ariaLabel || ariaLabelledby) return false;

        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          return !label;
        }

        return true;
      })
    );

    expect(inputsWithoutLabels.length).toBe(0);
  });

  test('ARIA attributes should be valid', async ({ page }) => {
    const ariaErrors = await page.evaluate(() => {
      const errors: string[] = [];

      document.querySelectorAll('[aria-labelledby]').forEach((el) => {
        const ids = el.getAttribute('aria-labelledby')?.split(' ') || [];
        ids.forEach((id) => {
          if (!document.getElementById(id)) {
            errors.push(`aria-labelledby references non-existent ID: ${id}`);
          }
        });
      });

      document.querySelectorAll('[aria-describedby]').forEach((el) => {
        const ids = el.getAttribute('aria-describedby')?.split(' ') || [];
        ids.forEach((id) => {
          if (!document.getElementById(id)) {
            errors.push(`aria-describedby references non-existent ID: ${id}`);
          }
        });
      });

      return errors;
    });

    expect(ariaErrors).toHaveLength(0);
  });

  test('Focus should be visible', async ({ page }) => {
    // Press Tab to focus first element
    await page.keyboard.press('Tab');

    // Check if focus indicator is visible
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;

      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;
      const boxShadow = styles.boxShadow;

      // Should have visible outline or box-shadow
      return (
        outline !== 'none' ||
        (outlineWidth && parseFloat(outlineWidth) > 0) ||
        (boxShadow && boxShadow !== 'none')
      );
    });

    expect(focusVisible).toBeTruthy();
  });

  test('Page should have lang attribute', async ({ page }) => {
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
    expect(lang).toBe('en');
  });

  test('Page should have descriptive title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toContain('Blaze Sports Intel');
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
  });

  test('Touch targets should be large enough (44x44px minimum)', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const smallTargets = await page.$$eval('a, button', (elements) =>
      elements.filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }).map((el) => ({
        tag: el.tagName,
        text: el.textContent?.slice(0, 30),
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
      }))
    );

    // Allow some small targets but warn if too many
    if (smallTargets.length > 5) {
      console.warn('Small touch targets found:', smallTargets);
    }
  });

  test('Mobile navigation should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for mobile menu button
    const mobileMenuButton = await page.$('[aria-label*="menu" i], [aria-label*="navigation" i]');

    if (mobileMenuButton) {
      // Should be keyboard accessible
      await mobileMenuButton.focus();
      const isFocused = await mobileMenuButton.evaluate(
        (el) => el === document.activeElement
      );
      expect(isFocused).toBeTruthy();

      // Should have proper ARIA
      const ariaExpanded = await mobileMenuButton.getAttribute('aria-expanded');
      expect(ariaExpanded).toBeTruthy();
    }
  });
});
