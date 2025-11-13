# Cloudflare Pages Deployment Guide
**Date:** January 13, 2025
**Project:** BSI-NextGen → blazesportsintel.com
**Account ID:** a12cb329d84130460eed99b816e4d0d3

---

## 🚀 Quick Start - Manual Deployment

### Step 1: Access Cloudflare Dashboard
Navigate to your Cloudflare Pages dashboard:
```
https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages
```

### Step 2: Create/Connect Project

#### Option A: Connect GitHub Repository (Recommended)
1. Click **"Create application"** → **"Pages"** → **"Connect to Git"**
2. Select **GitHub** as your Git provider
3. Authorize Cloudflare Pages to access your repositories
4. Select repository: **`ahump20/BSI-NextGen`**
5. Click **"Begin setup"**

#### Option B: Direct Upload (Quick Test)
1. Click **"Upload assets"**
2. Name your project: **`blazesportsintel`**
3. Upload the build directory: `/Users/AustinHumphrey/BSI-NextGen/packages/web/.next`
4. Click **"Deploy"**

---

## ⚙️ Build Configuration

### Framework Preset
- **Framework:** Next.js
- **Build command:** `pnpm build`
- **Build output directory:** `packages/web/.next`
- **Root directory:** `/` (repository root)

### Build Settings (for GitHub Connection)
```yaml
Build command: pnpm build
Build output directory: packages/web/.next
Root directory: (leave blank for repository root)
Node version: 20.x
Package manager: pnpm
```

### Advanced Build Settings
```bash
# Install command (if needed)
pnpm install --frozen-lockfile

# Environment variables
NODE_ENV=production
```

---

## 🔑 Environment Variables Configuration

### Required Variables
Navigate to: **Pages Project Settings** → **Environment Variables**

Add the following variables for **Production** environment:

```bash
# SportsDataIO API Key (Required for live data)
SPORTSDATAIO_API_KEY=6ca2adb39404482da5406f0a6cd7aa37

# Application URL
NEXT_PUBLIC_APP_URL=https://blazesportsintel.pages.dev

# Node Environment
NODE_ENV=production
```

### Optional Variables (for future features)
```bash
# Auth0 Authentication
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret

# API Base URLs
REAL_API_BASE_URL=https://api.blazesportsintel.com
NCAA_API_BASE_URL=https://ncaa-api.henrygd.me
```

---

## 🤖 Automatic Deployments (GitHub Actions)

### Setup GitHub Secret
1. Go to your GitHub repository: https://github.com/ahump20/BSI-NextGen
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the following secret:
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Value:** `r-2jlIcjxuS-INveZJAaJS-IzwtJeh6HvH9qi9Fi`
5. Click **"Add secret"**

### GitHub Actions Workflow
The workflow file has been created at `.github/workflows/cloudflare-pages.yml`

**Triggers:**
- ✅ Push to `main` branch → Automatic production deployment
- ✅ Pull requests → Preview deployments

**What it does:**
1. Checks out your code
2. Sets up Node.js 20 and pnpm
3. Installs dependencies with caching
4. Builds all packages (`@bsi/shared` → `@bsi/api` → `@bsi/web`)
5. Deploys to Cloudflare Pages

### Enable Automatic Deployments
After setting up the GitHub secret:
```bash
# Commit the workflow file
git add .github/workflows/cloudflare-pages.yml
git commit -m "Add Cloudflare Pages deployment workflow"
git push origin main
```

The deployment will start automatically on push!

---

## 🌐 Custom Domain Setup

### Step 1: Add Custom Domain
1. Go to your Cloudflare Pages project
2. Click **"Custom domains"** tab
3. Click **"Set up a custom domain"**
4. Enter: `blazesportsintel.com` or `www.blazesportsintel.com`

### Step 2: Configure DNS
If `blazesportsintel.com` is already in your Cloudflare account:
1. Navigate to **DNS** → **Records**
2. Ensure you have a CNAME record:
   ```
   Type: CNAME
   Name: @ (or www)
   Target: blazesportsintel.pages.dev
   Proxy status: Proxied (orange cloud)
   ```

### Step 3: SSL/TLS Configuration
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **Full (strict)**
3. Enable **Always Use HTTPS** under **Edge Certificates**

---

## 📊 Deployment Verification

### Check Deployment Status
Once deployed, verify these endpoints:

#### 1. Homepage
```bash
curl https://blazesportsintel.pages.dev/
# Expected: HTML with BSI-NextGen homepage
```

#### 2. API Health Check
```bash
curl https://blazesportsintel.pages.dev/api/test-env
# Expected: {"message": "Environment test", "env": "production"}
```

#### 3. MLB Teams Data
```bash
curl https://blazesportsintel.pages.dev/api/sports/mlb/teams
# Expected: Array of 30 MLB teams with logos
```

#### 4. SportsDataIO Integration Test
```bash
curl https://blazesportsintel.pages.dev/api/sports/nfl/standings?season=2025
# Expected: NFL standings data from SportsDataIO
```

---

## 🔍 Monitoring & Logs

### View Deployment Logs
1. Go to your Cloudflare Pages project
2. Click **"View build"** on the latest deployment
3. Expand build steps to see detailed logs

### Check Runtime Logs
Cloudflare Pages automatically logs:
- Build output
- Deployment status
- Function invocations
- Error traces

Access logs via:
```
https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/blazesportsintel
```

---

## 🐛 Troubleshooting

### Build Fails with "Module not found"
**Solution:** Ensure pnpm installs all workspace dependencies
```yaml
# In build settings
Build command: pnpm install --frozen-lockfile && pnpm build
```

### Environment Variables Not Working
**Solution:**
1. Check they're set for **Production** environment (not just Preview)
2. Redeploy after adding variables
3. Variables don't require quotes in Cloudflare dashboard

### Next.js Dynamic Routes 404
**Solution:** Cloudflare Pages automatically handles Next.js routing. Ensure:
- `packages/web/.next` is the build output directory
- Next.js build completed successfully
- No custom server code (Pages doesn't support custom servers)

### API Routes Not Working
**Solution:**
- API routes in `app/api/` are automatically converted to Cloudflare Functions
- Check function logs in deployment dashboard
- Ensure no Node.js-specific APIs (use Web APIs instead)

---

## 📈 Performance Optimization

### Edge Caching
Cloudflare automatically caches static assets. For API routes, add cache headers:

```typescript
// In your API routes
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, max-age=300, s-maxage=600',
  },
});
```

### Image Optimization
Cloudflare automatically optimizes images with:
- WebP conversion
- Automatic resizing
- CDN caching

Enable in Cloudflare dashboard: **Speed** → **Optimization**

### Analytics
View real-time analytics:
```
https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/blazesportsintel/analytics
```

Metrics include:
- Page views
- Unique visitors
- Bandwidth usage
- Geographic distribution

---

## 🔄 Update Workflow

### For Code Changes
```bash
# Make your changes
git add .
git commit -m "Your commit message"
git push origin main

# GitHub Actions automatically builds and deploys to Cloudflare Pages
# Check deployment status at:
# https://github.com/ahump20/BSI-NextGen/actions
```

### For Environment Variable Changes
1. Update in Cloudflare Pages dashboard
2. Trigger a new deployment (Settings → "Retry deployment" or push a new commit)

### For Rollback
1. Go to Cloudflare Pages project → **Deployments**
2. Find the working deployment
3. Click **"⋯"** → **"Rollback to this deployment"**

---

## 🎯 Post-Deployment Checklist

After deploying, verify:

### Functionality
- [ ] Homepage loads (`/`)
- [ ] MLB scores display (`/sports/mlb`)
- [ ] NFL standings render (`/sports/nfl`)
- [ ] NBA games show (`/sports/nba`)
- [ ] College baseball data works (`/sports/college-baseball`)
- [ ] Unified live scores (`/unified`)
- [ ] NCAA Fusion dashboard (`/college/fusion`)

### API Endpoints
- [ ] `/api/sports/mlb/teams` returns 30 teams
- [ ] `/api/sports/nfl/standings` returns current standings
- [ ] `/api/sports/nba/games` returns game data
- [ ] `/api/unified/live` aggregates live scores
- [ ] `/api/edge/ncaa/fusion` returns NCAA analytics

### Performance
- [ ] Homepage loads in < 2 seconds
- [ ] Lighthouse Performance score > 90
- [ ] Images load properly
- [ ] No console errors in browser
- [ ] Mobile responsive design works

### Data Accuracy
- [ ] Live scores update (30-second cache)
- [ ] Team logos display correctly
- [ ] Standings show current records
- [ ] Data sources cited properly
- [ ] America/Chicago timezone used

---

## 📞 Support & Resources

### Cloudflare Documentation
- **Pages Docs:** https://developers.cloudflare.com/pages
- **Next.js Guide:** https://developers.cloudflare.com/pages/framework-guides/nextjs
- **Environment Variables:** https://developers.cloudflare.com/pages/platform/build-configuration

### Project Resources
- **Repository:** https://github.com/ahump20/BSI-NextGen
- **Deployment Log:** `/Users/AustinHumphrey/BSI-NextGen/deployment-log.txt`
- **Integration Guide:** `SPORTSDATAIO-INTEGRATION-COMPLETE.md`
- **Build Status:** `DEPLOYMENT-READY-STATUS.md`

### Cloudflare Support
- **Dashboard:** https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3
- **Community:** https://community.cloudflare.com
- **Status:** https://www.cloudflarestatus.com

---

## ✅ Ready to Deploy!

Your application is **production-ready** with:
- ✅ All packages built successfully
- ✅ SportsDataIO integration complete
- ✅ Environment variables documented
- ✅ GitHub Actions workflow configured
- ✅ Build archive available

**Next Action:** Follow the Quick Start steps above to deploy to Cloudflare Pages!

---

**Deployment URLs:**
- **Production:** https://blazesportsintel.pages.dev → https://blazesportsintel.com
- **Preview:** https://[branch].[project].pages.dev (for PRs)

**Expected Deployment Time:** 3-5 minutes
**Expected Build Time:** ~60 seconds
**Total Time to Live:** ~5 minutes from commit to production
