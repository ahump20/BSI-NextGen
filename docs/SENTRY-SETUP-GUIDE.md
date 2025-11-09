# Sentry Error Tracking Setup Guide

**Date:** 2025-01-11
**Purpose:** Set up production-grade error tracking with Sentry
**Platform:** Blaze Sports Intel

---

## Overview

Sentry provides real-time error tracking, performance monitoring, and crash reporting for production applications. This guide covers complete Sentry integration for the Blaze Sports Intel platform.

---

## Step 1: Create Sentry Account

### 1.1 Sign Up

1. Go to https://sentry.io/signup/
2. Sign up with GitHub or email
3. Create organization: `blaze-sports-intel`

### 1.2 Create Project

1. Click **Create Project**
2. Select platform: **Next.js**
3. Project name: `bsi-production`
4. Alert frequency: **On every new issue**
5. Click **Create Project**

### 1.3 Get DSN (Data Source Name)

After project creation, you'll see:
```
https://[key]@o[org-id].ingest.sentry.io/[project-id]
```

**Save this DSN** - you'll need it for configuration.

---

## Step 2: Install Sentry SDK

### 2.1 Install Dependencies

```bash
cd /Users/AustinHumphrey/BSI-NextGen

# Install Sentry Next.js SDK
pnpm --filter @bsi/web add @sentry/nextjs

# This installs:
# - @sentry/nextjs (main SDK)
# - @sentry/webpack-plugin (source maps)
# - @sentry/cli (command-line tools)
```

### 2.2 Run Sentry Wizard

```bash
cd packages/web

# Run Sentry setup wizard
npx @sentry/wizard@latest -i nextjs

# The wizard will:
# ✅ Create sentry.client.config.ts
# ✅ Create sentry.server.config.ts
# ✅ Create sentry.edge.config.ts
# ✅ Update next.config.js with Sentry plugin
# ✅ Create .sentryclirc file
```

**When prompted:**
- **Upload source maps?** Yes (for better error stack traces)
- **DSN:** Paste your DSN from Step 1.3
- **Auth token:** Create at https://sentry.io/settings/account/api/auth-tokens/

---

## Step 3: Configure Sentry

### 3.1 Client Configuration

File: `packages/web/sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

  // Session Replay
  replaysOnErrorSampleRate: 1.0, // Capture 100% of errors with session replay
  replaysSessionSampleRate: 0.1, // Capture 10% of normal sessions

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

  // Ignore known errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  // Filter breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Don't send console.log breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') {
      return null;
    }
    return breadcrumb;
  },

  // Session Replay configuration
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### 3.2 Server Configuration

File: `packages/web/sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

  // Server-specific options
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',
});
```

### 3.3 Edge Configuration

File: `packages/web/sentry.edge.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Environment
  environment: process.env.NODE_ENV,
});
```

---

## Step 4: Add Environment Variables

### 4.1 Local Development

Add to `packages/web/.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://[key]@o[org-id].ingest.sentry.io/[project-id]
SENTRY_AUTH_TOKEN=sntrys_[your-auth-token]
SENTRY_ORG=blaze-sports-intel
SENTRY_PROJECT=bsi-production
```

### 4.2 Netlify Production

```bash
# Add via Netlify CLI
netlify env:set NEXT_PUBLIC_SENTRY_DSN "https://[key]@o[org-id].ingest.sentry.io/[project-id]" --filter @bsi/web
netlify env:set SENTRY_AUTH_TOKEN "sntrys_[your-auth-token]" --filter @bsi/web
netlify env:set SENTRY_ORG "blaze-sports-intel" --filter @bsi/web
netlify env:set SENTRY_PROJECT "bsi-production" --filter @bsi/web
```

Or add in Netlify Dashboard:
https://app.netlify.com/sites/blazesportsintelligence/configuration/env

---

## Step 5: Error Boundary Setup

### 5.1 Global Error Boundary

File: `packages/web/app/error.tsx`

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>

        <p className="text-gray-600 mb-6">
          We've been notified of the error and will fix it as soon as possible.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-50 p-2 rounded">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### 5.2 Global Error Handler

File: `packages/web/app/global-error.tsx`

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Critical Error</h1>
          <p>Please refresh the page or contact support if the error persists.</p>
          <button onClick={reset}>Try Again</button>
        </div>
      </body>
    </html>
  );
}
```

---

## Step 6: Manual Error Reporting

### 6.1 Capture Exceptions

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Your code
  await fetchData();
} catch (error) {
  // Log to Sentry
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      section: 'mlb-api',
      endpoint: 'games',
    },
    extra: {
      gameId: '12345',
      userId: user?.id,
    },
  });

  // Still log to console for development
  console.error('[MLB API] Error:', error);
}
```

### 6.2 Capture Messages

```typescript
import * as Sentry from '@sentry/nextjs';

// Log important events
Sentry.captureMessage('User completed checkout', {
  level: 'info',
  tags: {
    feature: 'payments',
  },
});
```

### 6.3 Add User Context

```typescript
import * as Sentry from '@sentry/nextjs';

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Clear user context (on logout)
Sentry.setUser(null);
```

---

## Step 7: Source Maps

### 7.1 Enable Source Maps Upload

File: `packages/web/next.config.js`

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Your existing config
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry webpack plugin options
    silent: true, // Suppress logs
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Upload source maps during production builds
    widenClientFileUpload: true,
    hideSourceMaps: true, // Hide source maps from browser
    disableLogger: true, // Disable Sentry debug logs
  },
  {
    // Sentry client options
    hideSourceMaps: true,
    widenClientFileUpload: true,
  }
);
```

### 7.2 Verify Source Maps

After deployment:
1. Go to Sentry Dashboard → Releases
2. Find your latest release
3. Check **Artifacts** tab - should show uploaded source maps

---

## Step 8: Performance Monitoring

### 8.1 Custom Transactions

```typescript
import * as Sentry from '@sentry/nextjs';

const transaction = Sentry.startTransaction({
  name: 'Fetch MLB Games',
  op: 'api.fetch',
});

try {
  const data = await fetch('/api/sports/mlb/games');

  // Add span for database query
  const dbSpan = transaction.startChild({
    op: 'db.query',
    description: 'Query MLB games from cache',
  });

  // ... your code ...

  dbSpan.finish();

  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  Sentry.captureException(error);
} finally {
  transaction.finish();
}
```

### 8.2 API Route Monitoring

Automatically tracked with `tracesSampleRate: 0.1`

View in Sentry Dashboard → Performance

---

## Step 9: Alerts & Notifications

### 9.1 Configure Alerts

1. Go to Sentry Dashboard → Alerts
2. Click **Create Alert Rule**
3. Select conditions:
   - **Issue Alerts:** When a new issue is created
   - **Metric Alerts:** When error rate exceeds threshold

### 9.2 Notification Channels

1. Email: ahump20@outlook.com (default)
2. Optional: Slack, Discord, PagerDuty

---

## Step 10: Testing

### 10.1 Test Error Reporting

Add test button to dev environment:

```typescript
'use client';

export function SentryTestButton() {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <button
      onClick={() => {
        throw new Error('Sentry Test Error');
      }}
      className="fixed bottom-4 right-4 px-4 py-2 bg-red-600 text-white rounded-lg"
    >
      Test Sentry
    </button>
  );
}
```

### 10.2 Verify Integration

```bash
# Build and run locally
pnpm build
pnpm start

# Click test button
# Check Sentry Dashboard → Issues
# You should see the test error
```

---

## Step 11: Production Deployment

### 11.1 Pre-deploy Checklist

- [ ] Sentry DSN added to Netlify env vars
- [ ] Auth token configured
- [ ] Source maps upload enabled
- [ ] Error boundaries in place
- [ ] Performance monitoring configured

### 11.2 Deploy

```bash
# Build with source maps
pnpm build

# Deploy to Netlify
netlify deploy --prod

# Verify source maps uploaded
# Check Netlify build logs for "Sentry" messages
```

### 11.3 Post-deploy Verification

1. Visit production site
2. Trigger an error (404 page, invalid API call)
3. Check Sentry Dashboard → Issues
4. Verify error appears with source maps

---

## Monitoring Dashboard

### Key Metrics to Track

1. **Error Rate**
   - Target: < 1% of requests
   - Alert: > 5% over 10 minutes

2. **Response Time**
   - Target: p95 < 1 second
   - Alert: p95 > 3 seconds

3. **Uptime**
   - Target: 99.9%
   - Alert: < 99% over 1 hour

4. **User Impact**
   - Track affected users per error
   - Priority: Issues affecting > 10 users

---

## Troubleshooting

### Source Maps Not Uploading

**Issue:** Errors show minified stack traces

**Solutions:**
1. Check `SENTRY_AUTH_TOKEN` is set
2. Verify build logs show "Uploading source maps"
3. Check .sentryclirc file exists
4. Run: `npx @sentry/cli releases list`

### Errors Not Appearing

**Issue:** No errors in Sentry dashboard

**Solutions:**
1. Check `NEXT_PUBLIC_SENTRY_DSN` is set
2. Verify DSN is correct (copy from Sentry dashboard)
3. Check browser console for Sentry errors
4. Ensure `enabled: true` in Sentry config

### Too Many Errors

**Issue:** Sentry quota exceeded

**Solutions:**
1. Add more `ignoreErrors` patterns
2. Reduce `tracesSampleRate` (0.1 → 0.05)
3. Filter known issues in dashboard
4. Upgrade Sentry plan

---

## Cost Optimization

### Free Tier Limits
- **5,000 errors/month** - Usually sufficient for small apps
- **10,000 performance units/month**
- **50 MB** source maps storage

### Optimization Strategies

1. **Reduce Sample Rates:**
   ```typescript
   tracesSampleRate: 0.05, // 5% instead of 10%
   replaysSessionSampleRate: 0.05, // 5% instead of 10%
   ```

2. **Ignore Common Errors:**
   ```typescript
   ignoreErrors: [
     'ResizeObserver loop limit exceeded',
     'Non-Error promise rejection',
     'AbortError',
     /^NetworkError/,
   ]
   ```

3. **Filter by Environment:**
   ```typescript
   beforeSend(event) {
     if (event.environment === 'development') {
       return null; // Don't send dev errors
     }
     return event;
   }
   ```

---

## Quick Reference Commands

```bash
# Install Sentry
pnpm --filter @bsi/web add @sentry/nextjs

# Run wizard
npx @sentry/wizard@latest -i nextjs

# Set environment variables
netlify env:set NEXT_PUBLIC_SENTRY_DSN "your-dsn" --filter @bsi/web
netlify env:set SENTRY_AUTH_TOKEN "your-token" --filter @bsi/web

# Test locally
pnpm build && pnpm start

# Deploy
netlify deploy --prod

# Check releases
npx @sentry/cli releases list

# Create release manually
npx @sentry/cli releases new [version]
npx @sentry/cli releases files [version] upload-sourcemaps .next
```

---

## Success Criteria

✅ **Setup Complete When:**
- Sentry SDK installed
- DSN configured in all environments
- Error boundaries in place
- Source maps uploading successfully
- Test error appears in dashboard
- Performance monitoring active
- Alerts configured

---

**Estimated Setup Time:** 30-45 minutes
**Cost:** Free tier (5K errors/month)
**Value:** Real-time error tracking, performance insights, better debugging

🎯 **Ready to catch bugs before users report them!**
