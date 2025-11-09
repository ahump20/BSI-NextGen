# Production Setup Guide - Cloudflare Deployment

## Required Environment Variables

### Authentication (Auth0)
```bash
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_AUDIENCE=https://your-api-audience
JWT_SECRET=your-secure-random-jwt-secret-here
```

**Setup Steps:**
1. Log into Auth0 Dashboard: https://manage.auth0.com/
2. Create a new Application (Regular Web Application)
3. Configure Allowed Callback URLs: `https://yourdomain.com/api/auth/callback`
4. Configure Allowed Logout URLs: `https://yourdomain.com`
5. Copy Domain, Client ID, and Client Secret to Cloudflare
6. Generate JWT_SECRET: `openssl rand -base64 32`

### Sports Data API
```bash
SPORTSDATAIO_API_KEY=your_sportsdataio_api_key_here
```

**Setup Steps:**
1. Sign up at https://sportsdata.io/
2. Subscribe to NFL and NBA data feeds (free tier available)
3. Copy API key to Cloudflare environment variables

### Application Configuration
```bash
NEXT_PUBLIC_APP_URL=https://blazesportsintel.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Cloudflare Pages Configuration

### Build Settings
- **Framework preset**: Next.js
- **Build command**: `pnpm build`
- **Build output directory**: `packages/web/.next`
- **Root directory**: `/` (monorepo root)
- **Node version**: `18` or higher

### Environment Variables Setup

1. Go to your Cloudflare Pages project
2. Navigate to: **Settings** → **Environment Variables**
3. Add the following variables for **Production** environment:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `AUTH0_DOMAIN` | your-tenant.us.auth0.com | From Auth0 dashboard |
| `AUTH0_CLIENT_ID` | ••••• | From Auth0 dashboard |
| `AUTH0_CLIENT_SECRET` | ••••• | From Auth0 dashboard |
| `AUTH0_AUDIENCE` | https://your-api-audience | From Auth0 API settings |
| `JWT_SECRET` | ••••• | Generate with openssl |
| `SPORTSDATAIO_API_KEY` | ••••• | From SportsDataIO dashboard |
| `NEXT_PUBLIC_APP_URL` | https://blazesportsintel.com | Your production domain |
| `NODE_ENV` | production | Set automatically |
| `NEXT_TELEMETRY_DISABLED` | 1 | Disable Next.js telemetry |

### Build Configuration

Add the following to your project settings:

**Build command:**
```bash
pnpm install && pnpm build
```

**Environment Variables (Build):**
- Add all variables above to both **Production** and **Preview** environments
- For Preview, use `NEXT_PUBLIC_APP_URL` with your preview domain

### Custom Domain Setup

1. Navigate to **Custom domains** in Cloudflare Pages
2. Add your custom domain: `blazesportsintel.com`
3. Update Auth0 callback URLs to include production domain
4. Wait for DNS propagation (usually < 5 minutes with Cloudflare)

## Performance Budgets

### Lighthouse Targets (Mobile)
- **Performance**: ≥ 90
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 95
- **SEO**: ≥ 95

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Asset Budget
- **JavaScript (Initial)**: < 200 KB
- **CSS**: < 50 KB
- **Images**: Lazy-loaded, WebP format preferred
- **Fonts**: Subset, preloaded

## Monitoring & Alerts

### Cloudflare Analytics
- Enable **Web Analytics** in Cloudflare dashboard
- Monitor Core Web Vitals
- Set up alerts for:
  - 5xx error rate > 1%
  - Response time > 3s
  - Build failures

### Error Tracking
Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **DataDog** for APM

## Security Checklist

- [ ] Environment variables are set and never committed to git
- [ ] Auth0 callback URLs include production domain only
- [ ] JWT_SECRET is strong (min 32 characters)
- [ ] HTTPS enforced (automatic with Cloudflare)
- [ ] CORS configured properly for API routes
- [ ] CSP headers configured (if applicable)
- [ ] Rate limiting enabled on API routes

## Deployment Process

### Initial Deploy
1. Push to `main` branch
2. Cloudflare Pages automatically builds and deploys
3. Verify environment variables are set
4. Test authentication flow
5. Verify API endpoints return data
6. Run Lighthouse audit

### Subsequent Deploys
1. Create feature branch
2. Make changes and test locally
3. Push to branch → Cloudflare creates preview deployment
4. Test preview deployment
5. Merge to `main` → Auto-deploy to production

## Rollback Procedure

If deployment fails:
1. Go to Cloudflare Pages → **Deployments**
2. Find last successful deployment
3. Click **Rollback to this deployment**
4. Investigate issues in failed deployment logs
5. Fix issues and redeploy

## Testing Production Build Locally

```bash
# Build production bundle
pnpm build

# Start production server
pnpm --filter @bsi/web start

# Test on http://localhost:3000
```

## Common Issues

### Build Fails - Missing Dependencies
**Solution**: Ensure all workspace dependencies are built in order
```bash
pnpm --filter @bsi/shared build
pnpm --filter @bsi/api build
pnpm --filter @bsi/web build
```

### API Returns 500 Errors
**Solution**: Check environment variables are set correctly
- Verify `SPORTSDATAIO_API_KEY` is valid
- Check Auth0 configuration matches production URLs

### Authentication Fails
**Solution**: Verify Auth0 configuration
- Callback URLs include production domain
- JWT_SECRET is set
- Auth0 credentials are correct

## Next Steps

1. Set up monitoring with Sentry or DataDog
2. Configure Cloudflare R2 for media storage (see R2_STORAGE_SETUP.md)
3. Implement database monitoring (see DATABASE_MONITORING.md)
4. Set up Hyperdrive for connection pooling (see HYPERDRIVE_SETUP.md)
