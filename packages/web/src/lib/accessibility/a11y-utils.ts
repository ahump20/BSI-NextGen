/**
 * Accessibility Utilities
 *
 * Utilities for ensuring WCAG 2.1 Level AA compliance
 * - Color contrast checking
 * - Focus management
 * - ARIA attributes
 * - Keyboard navigation
 * - Screen reader support
 */

/**
 * Calculate relative luminance for color contrast
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    console.error('Invalid color format. Use hex format (#RRGGBB)');
    return 1;
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standards
 * - Normal text: 4.5:1
 * - Large text (18pt+): 3:1
 */
export function meetsContrastAA(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = largeText ? 3 : 4.5;
  return ratio >= minRatio;
}

/**
 * Check if color contrast meets WCAG AAA standards
 * - Normal text: 7:1
 * - Large text (18pt+): 4.5:1
 */
export function meetsContrastAAA(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = largeText ? 4.5 : 7;
  return ratio >= minRatio;
}

/**
 * Focus trap for modals and dialogs
 */
export class FocusTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previousActiveElement: HTMLElement | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.focusableElements = this.getFocusableElements();
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable =
      this.focusableElements[this.focusableElements.length - 1] || null;
  }

  private getFocusableElements(): HTMLElement[] {
    const selector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(this.element.querySelectorAll(selector));
  }

  activate() {
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.element.addEventListener('keydown', this.handleKeyDown);
    this.firstFocusable?.focus();
  }

  deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.previousActiveElement?.focus();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate unique ID for ARIA attributes
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const tabindex = element.getAttribute('tabindex');
  const isNaturallyFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
    element.tagName
  );

  return isNaturallyFocusable || (tabindex !== null && parseInt(tabindex) >= 0);
}

/**
 * Ensure click handlers have keyboard equivalent
 */
export function makeKeyboardAccessible(
  element: HTMLElement,
  onClick: (e: Event) => void
) {
  // Add click handler
  element.addEventListener('click', onClick);

  // Add keyboard handler
  element.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  });

  // Ensure element is focusable
  if (!isKeyboardAccessible(element)) {
    element.setAttribute('tabindex', '0');
  }

  // Add role if needed
  if (!element.getAttribute('role') && element.tagName !== 'BUTTON') {
    element.setAttribute('role', 'button');
  }
}

/**
 * Skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content') {
  if (typeof document === 'undefined') return;

  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className =
    'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg';

  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Validate ARIA attributes
 */
export function validateAriaAttributes(element: HTMLElement): string[] {
  const errors: string[] = [];

  // Check aria-label or aria-labelledby
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledby = element.getAttribute('aria-labelledby');

  if (
    element.getAttribute('role') &&
    !ariaLabel &&
    !ariaLabelledby &&
    !element.textContent?.trim()
  ) {
    errors.push('Element with role should have aria-label or aria-labelledby');
  }

  // Check aria-labelledby references valid ID
  if (ariaLabelledby) {
    const ids = ariaLabelledby.split(' ');
    ids.forEach((id) => {
      if (!document.getElementById(id)) {
        errors.push(`aria-labelledby references non-existent ID: ${id}`);
      }
    });
  }

  // Check aria-describedby references valid ID
  const ariaDescribedby = element.getAttribute('aria-describedby');
  if (ariaDescribedby) {
    const ids = ariaDescribedby.split(' ');
    ids.forEach((id) => {
      if (!document.getElementById(id)) {
        errors.push(`aria-describedby references non-existent ID: ${id}`);
      }
    });
  }

  return errors;
}

/**
 * Check if text is readable (minimum size and weight)
 */
export function isTextReadable(
  fontSize: number,
  fontWeight: number | string
): boolean {
  // Minimum 16px for normal text
  if (fontSize < 16) return false;

  // Large text (18pt/24px+) can be lighter
  if (fontSize >= 24) return true;

  // Normal text should be at least 400 weight
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  return weight >= 400;
}

/**
 * Accessibility checker for development
 */
export function runAccessibilityChecks(element: HTMLElement): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check images have alt text
  element.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('alt')) {
      errors.push(`Image missing alt text: ${img.src}`);
    }
  });

  // Check links have accessible names
  element.querySelectorAll('a').forEach((link) => {
    if (
      !link.textContent?.trim() &&
      !link.getAttribute('aria-label') &&
      !link.getAttribute('aria-labelledby')
    ) {
      errors.push(`Link missing accessible name: ${link.href}`);
    }
  });

  // Check buttons have accessible names
  element.querySelectorAll('button').forEach((button) => {
    if (
      !button.textContent?.trim() &&
      !button.getAttribute('aria-label') &&
      !button.getAttribute('aria-labelledby')
    ) {
      errors.push('Button missing accessible name');
    }
  });

  // Check form inputs have labels
  element.querySelectorAll('input, textarea, select').forEach((input) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledby = input.getAttribute('aria-labelledby');

    if (!id && !ariaLabel && !ariaLabelledby) {
      warnings.push('Form input should have associated label');
    }

    if (id) {
      const label = element.querySelector(`label[for="${id}"]`);
      if (!label && !ariaLabel && !ariaLabelledby) {
        warnings.push(`Form input with id="${id}" missing label`);
      }
    }
  });

  // Check headings are in order
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    if (level > previousLevel + 1) {
      warnings.push(
        `Heading level skipped: ${heading.tagName} after h${previousLevel}`
      );
    }
    previousLevel = level;
  });

  return { errors, warnings };
}
