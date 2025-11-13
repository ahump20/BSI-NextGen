# Performance Optimization Guide

This guide covers performance optimization strategies for BSI-NextGen to ensure blazesportsintel.com remains fast and responsive.

## Table of Contents

- [Current Performance Status](#current-performance-status)
- [Build Optimizations](#build-optimizations)
- [Runtime Optimizations](#runtime-optimizations)
- [API Performance](#api-performance)
- [Monitoring & Metrics](#monitoring--metrics)
- [Best Practices](#best-practices)

---

## Current Performance Status

### Build Performance
- ✅ **SWC Minification** enabled for fast builds
- ✅ **Package optimization** configured for @bsi/shared and @bsi/api
- ✅ **Centralized logging** reduces production bundle size

### Bundle Size
- **First Load JS**: ~87.2 kB (shared chunks)
- **Individual Pages**: 1.3 kB - 3.6 kB
- **Target**: Keep pages < 5 kB, total < 200 kB

### Lighthouse Scores (Target)
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 95

---

## Build Optimizations

### Next.js Configuration

The optimized `next.config.js` includes:

```javascript
{
  // Modern image formats
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Remove console.log in production
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
  
  // Package import optimization
  experimental: {
    optimizePackageImports: ['@bsi/shared', '@bsi/api'],
  },
}
```

### Build Caching

**GitHub Actions**: Build artifacts are cached between runs
```yaml
- uses: actions/cache@v3
  with:
    path: |
      packages/*/dist
      packages/web/.next
    key: ${{ runner.os }}-build-${{ github.sha }}
```

**Local Development**: Next.js caches builds in `.next/cache`

### Tree Shaking

Ensure unused code is eliminated:

```typescript
// ✅ Good - only imports what's needed
import { createLogger } from '@bsi/shared';

// ❌ Avoid - imports entire module
import * as shared from '@bsi/shared';
```

---

## Runtime Optimizations

### Image Optimization

Use Next.js `<Image>` component for automatic optimization:

```tsx
import Image from 'next/image';

// ✅ Good - automatic optimization
<Image 
  src="/team-logo.png" 
  alt="Team Logo"
  width={50}
  height={50}
  priority // for above-the-fold images
/>

// ❌ Avoid - no optimization
<img src="/team-logo.png" alt="Team Logo" />
```

**Benefits:**
- Lazy loading by default
- Automatic format conversion (WebP, AVIF)
- Responsive image sizes
- Prevents layout shift

### Code Splitting

#### Dynamic Imports

For large components:

```tsx
import dynamic from 'next/dynamic';

// Load heavy components only when needed
const StatsChart = dynamic(() => import('@/components/StatsChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Disable SSR if not needed
});
```

#### Route-based Splitting

Next.js automatically splits code by route:
- Each page is a separate chunk
- Shared code is in common chunks
- Only required code loads per page

### Data Fetching

#### API Route Caching

```typescript
export async function GET() {
  const data = await fetchData();
  
  return NextResponse.json(data, {
    headers: {
      // Cache for 1 minute, stale-while-revalidate for 5 minutes
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

#### Client-side Caching

Use SWR or React Query for automatic caching:

```tsx
import useSWR from 'swr';

function Games() {
  const { data, error } = useSWR('/api/sports/mlb/games', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: false,
  });
  
  // ...
}
```

### React Optimization

#### Memoization

```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
const GameCard = memo(function GameCard({ game }) {
  return <div>...</div>;
});

// Memoize expensive calculations
function StandingsTable({ teams }) {
  const sortedTeams = useMemo(
    () => teams.sort((a, b) => b.wins - a.wins),
    [teams]
  );
  
  // Memoize callbacks
  const handleClick = useCallback(() => {
    // ...
  }, [/* dependencies */]);
  
  return <div>...</div>;
}
```

#### Avoid Re-renders

```tsx
// ✅ Good - stable object reference
const INITIAL_STATE = { loading: true };

function Component() {
  const [state, setState] = useState(INITIAL_STATE);
  // ...
}

// ❌ Avoid - creates new object every render
function Component() {
  const [state, setState] = useState({ loading: true });
  // ...
}
```

---

## API Performance

### Response Time Targets

- **Static content**: < 100ms
- **Cached data**: < 200ms
- **Live data**: < 500ms
- **Complex queries**: < 1s

### Optimization Strategies

#### 1. Parallel Requests

```typescript
// ✅ Good - parallel fetching
const [gamesData, standingsData] = await Promise.all([
  fetch('/api/sports/mlb/games'),
  fetch('/api/sports/mlb/standings'),
]);

// ❌ Avoid - sequential fetching
const gamesData = await fetch('/api/sports/mlb/games');
const standingsData = await fetch('/api/sports/mlb/standings');
```

#### 2. Data Pagination

For large datasets:

```typescript
GET /api/sports/mlb/games?page=1&perPage=20
```

#### 3. Field Selection

Return only needed fields:

```typescript
GET /api/sports/mlb/teams?fields=id,name,abbreviation
```

#### 4. Compression

Responses are automatically compressed with gzip/brotli by Next.js.

### Database Optimization

For Cloudflare D1 (when implemented):

```typescript
// ✅ Good - indexed query
SELECT * FROM games WHERE date = ? ORDER BY game_time
// Ensure index exists: CREATE INDEX idx_games_date ON games(date)

// ❌ Avoid - full table scan
SELECT * FROM games WHERE LOWER(team_name) LIKE '%yankees%'
```

---

## Monitoring & Metrics

### Performance Monitoring

#### Lighthouse CI

Run Lighthouse in CI:

```bash
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun
```

**Metrics to Track:**
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Total Blocking Time (TBT) < 200ms
- Cumulative Layout Shift (CLS) < 0.1
- Speed Index < 3.4s

#### Real User Monitoring (RUM)

Add Web Vitals tracking:

```tsx
// app/layout.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics
    console.log(metric);
  }
}
```

### Bundle Analysis

Analyze bundle size:

```bash
# Install analyzer
pnpm add -D @next/bundle-analyzer

# Update next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true pnpm build
```

### Performance Budget

Set budget limits in `package.json`:

```json
{
  "bundlesize": [
    {
      "path": "packages/web/.next/static/**/*.js",
      "maxSize": "200 kB"
    }
  ]
}
```

---

## Best Practices

### 1. Optimize Fonts

Use `next/font` for automatic font optimization:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Reduce JavaScript

- Use CSS for animations instead of JS
- Avoid large libraries for simple tasks
- Code-split heavy features

### 3. Optimize Third-party Scripts

```tsx
import Script from 'next/script';

// Load analytics with low priority
<Script
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload"
/>
```

### 4. Preload Critical Resources

```tsx
<link 
  rel="preload" 
  href="/fonts/custom-font.woff2" 
  as="font" 
  type="font/woff2" 
  crossOrigin="anonymous"
/>
```

### 5. Use CDN for Static Assets

- Images hosted on CDN
- Static assets served from edge
- Cloudflare caching enabled

### 6. Database Query Optimization

```typescript
// ✅ Good - specific query
SELECT id, name, score 
FROM games 
WHERE date = ? AND status = 'live'
LIMIT 10

// ❌ Avoid - expensive query
SELECT * 
FROM games 
WHERE date LIKE '%2025%'
```

### 7. Implement Stale-While-Revalidate

```typescript
// Serve stale content while fetching fresh data
headers: {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
}
```

---

## Performance Checklist

Before deploying:

- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Check bundle size (`ANALYZE=true pnpm build`)
- [ ] Test on slow 3G network
- [ ] Test on mobile devices
- [ ] Verify images use Next.js `<Image>`
- [ ] Check for layout shift (CLS < 0.1)
- [ ] Verify API responses < 500ms
- [ ] Test with disabled JavaScript (progressive enhancement)
- [ ] Check for memory leaks
- [ ] Verify proper caching headers

---

## Performance Improvement Roadmap

### Phase 1: Immediate Wins (Week 1)
- [x] Enable SWC minification
- [x] Configure package import optimization
- [x] Remove console.log in production
- [ ] Add bundle size monitoring
- [ ] Implement image optimization everywhere

### Phase 2: Caching Strategy (Week 2)
- [ ] Implement SWR for client-side caching
- [ ] Configure optimal Cache-Control headers
- [ ] Set up CDN caching rules
- [ ] Add service worker for offline support

### Phase 3: Advanced Optimizations (Week 3-4)
- [ ] Implement code splitting for heavy components
- [ ] Add Lighthouse CI to pipeline
- [ ] Set up Real User Monitoring
- [ ] Optimize database queries
- [ ] Implement lazy loading for below-fold content

### Phase 4: Monitoring & Iteration (Ongoing)
- [ ] Monitor Web Vitals in production
- [ ] Set up performance budgets
- [ ] Regular bundle analysis
- [ ] A/B test performance improvements

---

## Resources

- [Next.js Performance Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Size Optimization](https://bundlephobia.com/)

---

**Last Updated**: November 13, 2025
**Maintained by**: Infrastructure Team
