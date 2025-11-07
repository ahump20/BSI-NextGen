# Sandlot Sluggers - Production Deployment Guide

## Phase 6: CI/CD, Monitoring, and Production Deployment

This document provides instructions for deploying Sandlot Sluggers to production with full monitoring and CI/CD automation.

---

## 🚀 Quick Start

### Prerequisites
- GitHub repository with admin access
- Cloudflare account with Pages project
- (Optional) Sentry account for error tracking
- (Optional) Discord webhook for deployment notifications

### Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```bash
CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
DISCORD_WEBHOOK=<your-discord-webhook-url>  # Optional
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>  # Optional
SENTRY_ORG=<your-sentry-organization>        # Optional
```

---

## 📋 Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically runs on:
- Every push to `main` branch
- Pull requests to `main` branch
- Manual trigger (workflow_dispatch)

### Workflow Steps

1. **Code Quality Checks**
   - TypeScript type checking
   - ESLint linting (warnings allowed)

2. **Build Application**
   - Install dependencies
   - Build production bundle
   - Upload build artifacts

3. **Deploy to Cloudflare Pages**
   - Download build artifacts
   - Deploy to Cloudflare Pages
   - Send Discord notification

4. **Performance Monitoring**
   - Wait for deployment to propagate
   - Run Lighthouse CI tests
   - Upload performance results

5. **Error Tracking** (if configured)
   - Create Sentry release
   - Associate deployment with release

---

## 🔧 Manual Deployment

To deploy manually without CI/CD:

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
CLOUDFLARE_API_TOKEN="your-token" npx wrangler pages deploy dist \
  --project-name sandlot-sluggers \
  --branch main \
  --commit-dirty=true
```

---

## 📊 Monitoring and Analytics

### Lighthouse CI

Performance benchmarks are automatically run on every deployment:
- Performance score: minimum 85%
- Accessibility score: minimum 90%
- Best practices: minimum 85%
- SEO: minimum 90%
- First Contentful Paint: < 2 seconds
- Largest Contentful Paint: < 3 seconds
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 300ms

Results are uploaded as GitHub Actions artifacts.

### Sentry Error Tracking

If configured, Sentry will:
- Capture all runtime errors
- Track performance metrics (10% sample rate)
- Record session replays for errors
- Create releases tied to deployments

**Setup Sentry:**
1. Create a Sentry project at sentry.io
2. Get your DSN from Project Settings → Client Keys
3. Add to environment variables:
   ```bash
   VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

### Discord Notifications

Deployment notifications include:
- Deployment status (success/failure)
- Commit message and author
- Commit SHA
- Deployment URL
- Timestamp

**Setup Discord Webhook:**
1. Go to Discord Server Settings → Integrations → Webhooks
2. Create webhook and copy URL
3. Add to GitHub secrets as `DISCORD_WEBHOOK`

---

## 🛠️ Environment Variables

### Required
- None (app works without environment variables in basic mode)

### Optional
- `VITE_SENTRY_DSN` - Sentry error tracking DSN
- `VITE_APP_VERSION` - Application version for release tracking

---

## 🔒 Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for sensitive data
3. **Rotate API tokens** regularly
4. **Enable Cloudflare WAF** for DDoS protection
5. **Use HTTPS only** (enforced by Cloudflare Pages)

---

## 📈 Performance Optimization

### Current Bundle Sizes
- Main bundle: ~5.1 MB (babylon.js)
- Application code: ~167 KB
- Physics engine: ~2.1 MB (HavokPhysics.wasm)

### Optimization Recommendations
1. **Code splitting**: Use dynamic imports for large modules
2. **Asset optimization**: Compress textures and 3D models
3. **Lazy loading**: Load non-critical features on demand
4. **CDN caching**: Leverage Cloudflare's edge network

---

## 🧪 Testing

### Before Deploying
```bash
# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Build check
npm run build

# Preview locally
npm run preview
```

### After Deploying
1. Check deployment URL from GitHub Actions
2. Verify core features work:
   - Game loads without errors
   - Pitching mechanics work
   - Batting mechanics work
   - Audio plays correctly
   - Visual effects render
3. Check Sentry for any errors
4. Review Lighthouse CI results

---

## 🆘 Troubleshooting

### Deployment Failed
1. Check GitHub Actions logs for error details
2. Verify Cloudflare API token is valid
3. Ensure account ID is correct
4. Check if Cloudflare Pages project exists

### Performance Issues
1. Review Lighthouse CI report
2. Check for large bundle sizes
3. Verify asset compression
4. Test on slower networks

### Sentry Not Working
1. Verify `VITE_SENTRY_DSN` is set
2. Check if in production mode (not development)
3. Review Sentry project settings
4. Check browser console for Sentry initialization

---

## 📞 Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Sentry Docs: https://docs.sentry.io/
- Lighthouse CI Docs: https://github.com/GoogleChrome/lighthouse-ci

---

**Last Updated**: 2025-11-06  
**Phase 6 Complete**: ✅ CI/CD, Monitoring, and Production Deployment
