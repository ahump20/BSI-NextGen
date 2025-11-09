# Performance Testing & Optimization Guide

## Overview

This document outlines performance testing procedures, budgets, and optimization strategies for the BSI-NextGen application.

## Lighthouse Audit

### Running Lighthouse

#### Option 1: Chrome DevTools (Recommended for Development)
```bash
# Start production build locally
pnpm build
pnpm --filter @bsi/web start

# Then:
# 1. Open Chrome/Edge browser
# 2. Navigate to http://localhost:3000
# 3. Open DevTools (F12)
# 4. Go to "Lighthouse" tab
# 5. Select:
#    - Mode: Navigation
#    - Device: Mobile
#    - Categories: All
# 6. Click "Analyze page load"
```

#### Option 2: CLI (Recommended for CI/CD)
```bash
# Install Lighthouse CLI globally
npm install -g lighthouse

# Run Lighthouse audit
lighthouse http://localhost:3000 \
  --output html \
  --output json \
  --output-path ./lighthouse-report \
  --view \
  --preset=desktop

# Mobile audit
lighthouse http://localhost:3000 \
  --output html \
  --output json \
  --output-path ./lighthouse-mobile-report \
  --view \
  --emulated-form-factor=mobile \
  --throttling.cpuSlowdownMultiplier=4
```

#### Option 3: Automated Testing (CI/CD)
```bash
# Add to package.json scripts
"lighthouse": "lighthouse http://localhost:3000 --output json --output-path ./lighthouse-report.json --chrome-flags='--headless'",
"lighthouse:ci": "lhci autorun"

# Install Lighthouse CI
npm install -g @lhci/cli

# Create lighthouserc.js configuration file
# See section below
```

### Performance Budgets

#### Mobile Targets (Primary Focus)
```json
{
  "performance": 90,
  "accessibility": 95,
  "best-practices": 95,
  "seo": 95,
  "pwa": 80
}
```

#### Desktop Targets
```json
{
  "performance": 95,
  "accessibility": 95,
  "best-practices": 95,
  "seo": 95,
  "pwa": 80
}
```

### Core Web Vitals Budgets

| Metric | Good | Needs Improvement | Poor | Our Target |
|--------|------|-------------------|------|------------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s | **< 2.0s** |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms | **< 50ms** |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 | **< 0.05** |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3.0s | > 3.0s | **< 1.5s** |
| **TTI** (Time to Interactive) | ≤ 3.8s | 3.8s - 7.3s | > 7.3s | **< 3.0s** |
| **TBT** (Total Blocking Time) | ≤ 200ms | 200ms - 600ms | > 600ms | **< 150ms** |
| **SI** (Speed Index) | ≤ 3.4s | 3.4s - 5.8s | > 5.8s | **< 3.0s** |

### Asset Budgets

#### JavaScript
- **Initial Bundle**: < 200 KB (gzipped)
- **Total JavaScript**: < 500 KB (gzipped)
- **Third-party Scripts**: < 100 KB (gzipped)

#### CSS
- **Total CSS**: < 50 KB (gzipped)
- **Critical CSS**: < 20 KB (inline)

#### Images
- **Per Image**: < 200 KB (optimized)
- **Total Images**: < 2 MB per page
- **Format**: WebP preferred, JPEG/PNG fallback
- **Lazy Loading**: All images below the fold

#### Fonts
- **Total Fonts**: < 100 KB
- **Font Display**: swap or optional
- **Subset**: Latin only (or required characters)

## Lighthouse CI Configuration

Create `lighthouserc.js` in project root:

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      url: [
        'http://localhost:3000',
        'http://localhost:3000/sports/mlb',
        'http://localhost:3000/sports/nfl',
        'http://localhost:3000/sports/nba',
        'http://localhost:3000/sports/college-baseball',
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],

        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['error', { maxNumericValue: 150 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 200000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 2000000 }],
        'resource-summary:font:size': ['error', { maxNumericValue: 100000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## Performance Optimization Checklist

### ✅ Completed Optimizations

#### 1. Next.js Image Optimization
- [x] Avatar component uses Next.js `<Image>` with proper sizing
- [x] Lazy loading enabled for all images
- [x] Priority flag set for above-the-fold images
- [x] External CDN images marked as unoptimized

#### 2. Error Handling & Timeouts
- [x] `fetchWithTimeout` utility created (10s timeout)
- [x] Applied to MLB adapter
- [x] Applied to NFL adapter
- [x] Retry with exponential backoff implemented

#### 3. Caching Strategy
- [x] API routes have appropriate cache headers
- [x] Live games: 30s cache
- [x] Completed games: 5min cache
- [x] Static data: 10min cache

### 🔄 Recommended Optimizations

#### 1. Code Splitting
```javascript
// Lazy load heavy components
const MLBScoreboard = dynamic(() => import('@/components/mlb/MLBScoreboard'), {
  loading: () => <LoadingSkeleton />,
  ssr: true,
});

// Route-based code splitting (automatic with Next.js App Router)
// Already implemented via /app directory structure
```

#### 2. Font Optimization
```javascript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Use swap for better FCP
  preload: true,
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

#### 3. Image Optimization
- Use WebP format with JPEG fallback
- Implement blurhash or LQIP (Low Quality Image Placeholder)
- Optimize team logos and icons

```bash
# Optimize images using sharp
npm install sharp
node scripts/optimize-images.js
```

#### 4. API Response Compression
```javascript
// middleware.ts (Next.js middleware)
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();

  // Enable compression
  response.headers.set('Content-Encoding', 'gzip');

  return response;
}
```

#### 5. Service Worker (PWA)
```javascript
// Register service worker for offline support
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('bsi-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/sports/mlb',
        '/sports/nfl',
        '/sports/nba',
        '/offline.html',
      ]);
    })
  );
});
```

## Mobile Responsiveness Testing

### Devices to Test

#### High Priority (Mobile-First)
- [ ] iPhone 12 Pro (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] Google Pixel 5 (393x851)
- [ ] iPad Air (820x1180)

#### Medium Priority (Tablet)
- [ ] iPad Pro 11" (834x1194)
- [ ] iPad Pro 12.9" (1024x1366)
- [ ] Surface Pro 7 (912x1368)

#### Low Priority (Desktop)
- [ ] 1920x1080 (Full HD)
- [ ] 2560x1440 (2K)
- [ ] 3840x2160 (4K)

### Responsive Design Checklist

#### Layout
- [x] Mobile-first CSS (min-width media queries)
- [x] Flexible grid system (Tailwind CSS)
- [x] No horizontal scrolling on mobile
- [x] Touch targets ≥ 44x44px
- [x] Adequate spacing between interactive elements

#### Typography
- [x] Font sizes scale appropriately (text-sm → text-base → text-lg)
- [x] Line height optimized for readability
- [x] No text smaller than 14px on mobile

#### Images & Media
- [x] Images scale properly
- [x] Aspect ratios maintained
- [x] No layout shift from image loading

#### Navigation
- [x] Mobile menu accessible
- [x] Navigation bar responsive
- [x] Search functionality mobile-friendly

#### Forms & Inputs
- [x] Input fields large enough for mobile
- [x] Labels properly associated
- [x] Error messages visible

### Automated Responsive Testing

```bash
# Playwright visual regression tests
npx playwright test tests/mobile-visual-regression.spec.ts

# Create baseline screenshots
npx playwright test --update-snapshots

# Compare against baseline
npx playwright test
```

## Performance Monitoring (Production)

### Real User Monitoring (RUM)

#### Option 1: Next.js Analytics (Vercel)
```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
```

#### Option 2: Google Analytics 4 with Web Vitals
```javascript
// lib/analytics.ts
export function sendWebVitals(metric) {
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

// app/layout.tsx
import { useReportWebVitals } from 'next/web-vitals';

export default function RootLayout({ children }) {
  useReportWebVitals((metric) => {
    sendWebVitals(metric);
  });

  return children;
}
```

#### Option 3: Custom Performance API
```javascript
// lib/performance.ts
export function measurePageLoad() {
  if (typeof window !== 'undefined' && window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;
    const renderTime = perfData.domComplete - perfData.domLoading;

    console.log({
      pageLoadTime,
      connectTime,
      renderTime,
    });

    // Send to analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageLoadTime, connectTime, renderTime }),
    });
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Performance CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build
        env:
          SPORTSDATAIO_API_KEY: ${{ secrets.SPORTSDATAIO_API_KEY }}

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse Report
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-report
          path: .lighthouseci
```

## Performance Regression Prevention

### Pre-commit Hook
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run bundle size check
npm run bundlesize

# Run performance tests
npm run test:performance
```

### Bundle Size Monitoring
```json
{
  "bundlesize": [
    {
      "path": "./packages/web/.next/static/chunks/*.js",
      "maxSize": "200 kB"
    },
    {
      "path": "./packages/web/.next/static/css/*.css",
      "maxSize": "50 kB"
    }
  ]
}
```

## Troubleshooting

### Slow LCP
1. Optimize largest image/element
2. Use Next.js Image with priority
3. Preload critical resources
4. Reduce server response time
5. Eliminate render-blocking resources

### High CLS
1. Set explicit width/height on images
2. Reserve space for ads/embeds
3. Avoid inserting content above existing content
4. Use CSS transforms instead of layout properties

### Poor FID
1. Reduce JavaScript execution time
2. Break up long tasks
3. Use web workers for heavy computations
4. Defer non-critical JavaScript

### Large Bundle Size
1. Enable code splitting
2. Use dynamic imports
3. Tree-shake unused code
4. Analyze bundle with webpack-bundle-analyzer

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Lighthouse Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/)
- [Chrome User Experience Report](https://developers.google.com/web/tools/chrome-user-experience-report)
