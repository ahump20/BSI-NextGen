# Cloudflare Pages Deployment Guide

## ✅ Status

- **Build:** ✓ Compiled successfully
- **Type Check:** ✓ Passed
- **Validation:** ✓ 72 features verified
- **GitHub Actions Workflow:** ✓ Created

## 🚀 Deployment Options

### Option 1: GitHub Actions (Recommended - Safest)

**Benefits:**
- ✅ Automatic deployments on git push
- ✅ Preview deployments for every PR
- ✅ Built-in rollback support
- ✅ No manual intervention needed
- ✅ Preserves existing content (zero downtime)

**Setup Steps:**

#### 1. Add GitHub Secrets

Go to: https://github.com/ahump20/BSI-NextGen/settings/secrets/actions

Click "New repository secret" and add:

**Secret 1: CLOUDFLARE_API_TOKEN**
```
Value: r-2jlIcjxuS-INveZJAaJS-IzwtJeh6HvH9qi9Fi
```

**Secret 2: CLOUDFLARE_ACCOUNT_ID**
```
Value: a12cb329d84130460eed99b816e4d0d3
```

**Secret 3: SPORTSDATAIO_API_KEY** (optional, for runtime)
```
Value: 6ca2adb39404482da5406f0a6cd7aa37
```

#### 2. Commit and Push Workflow

```bash
cd /Users/AustinHumphrey/BSI-NextGen

# Add the workflow file
git add .github/workflows/deploy-cloudflare.yml

# Commit
git commit -m "ci: Add Cloudflare Pages deployment workflow"

# Push to main (triggers deployment)
git push origin main
```

#### 3. Monitor Deployment

Watch the deployment at:
https://github.com/ahump20/BSI-NextGen/actions

The workflow will:
1. ✓ Install dependencies
2. ✓ Build the project
3. ✓ Deploy to Cloudflare Pages
4. ✓ Verify health check
5. ✓ Post deployment URL

#### 4. Access Your Site

After successful deployment (2-3 minutes):
- **Production:** https://blazesportsintel.pages.dev
- **Custom Domain:** https://blazesportsintel.com (configure in Cloudflare Dashboard)

---

### Option 2: Manual Cloudflare Dashboard

If you prefer manual control:

#### 1. Go to Cloudflare Dashboard

https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages

#### 2. Create Application

- Click "Create application"
- Select "Connect to Git"
- Choose "GitHub" → "ahump20/BSI-NextGen"

#### 3. Configure Build

**Build Settings:**
```
Build command:       pnpm build
Build directory:     packages/web/.next
Root directory:      /
Branch:              main
```

**Environment Variables:**
```
SPORTSDATAIO_API_KEY: 6ca2adb39404482da5406f0a6cd7aa37
NODE_ENV:             production
```

#### 4. Save and Deploy

Click "Save and Deploy" - deployment will start automatically.

---

### Option 3: Direct Wrangler Upload (Advanced)

For immediate one-time deployment:

```bash
# Authenticate (if not already)
npx wrangler login

# Deploy to preview first
npx wrangler pages deploy packages/web/.next \
  --project-name=blazesportsintel \
  --branch=preview \
  --commit-dirty=true

# After verifying preview, deploy to production
npx wrangler pages deploy packages/web/.next \
  --project-name=blazesportsintel \
  --branch=main \
  --commit-dirty=true
```

**Note:** This requires proper Wrangler authentication with OAuth.

---

## 🔒 Safety Features

### Zero Downtime Deployment

Cloudflare Pages provides:
- ✅ **Atomic deployments** - new version replaces old instantly
- ✅ **Immutable deployments** - each deployment is a snapshot
- ✅ **Instant rollback** - revert to any previous deployment in seconds
- ✅ **Preview URLs** - test before promoting to production
- ✅ **Gradual rollout** - route traffic percentage to new version (optional)

### Rollback Procedure

If something goes wrong:

#### Via Dashboard:
1. Go to: https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/projects/blazesportsintel
2. Click "Deployments"
3. Find the last working deployment
4. Click "⋮" → "Rollback to this deployment"
5. Confirm - instant rollback (< 5 seconds)

#### Via CLI:
```bash
# List recent deployments
npx wrangler pages deployment list --project-name=blazesportsintel

# Rollback to specific deployment
npx wrangler pages deployment tail --project-name=blazesportsintel --deployment-id=<ID>
```

---

## 🔧 Post-Deployment Configuration

### 1. Custom Domain Setup

If you want to use `blazesportsintel.com`:

#### Add Custom Domain:
1. Go to: https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/projects/blazesportsintel/domains
2. Click "Set up a custom domain"
3. Enter: `blazesportsintel.com`
4. Cloudflare will automatically configure DNS

**DNS Records (Auto-created):**
```
Type    Name    Content
CNAME   @       blazesportsintel.pages.dev
CNAME   www     blazesportsintel.pages.dev
```

### 2. Environment Variables

Add runtime environment variables:

**Dashboard:**
https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/projects/blazesportsintel/settings/environment-variables

**Variables to Add:**
```
SPORTSDATAIO_API_KEY: 6ca2adb39404482da5406f0a6cd7aa37
NEXT_PUBLIC_APP_URL:  https://blazesportsintel.com
NODE_ENV:             production
```

**Apply to:**
- ✓ Production
- ✓ Preview (optional)

---

## 🎯 Next Steps

### After First Deployment

1. **Verify Health Check**
   ```bash
   curl https://blazesportsintel.pages.dev/api/health
   ```
   Expected: `{"status":"healthy",...}`

2. **Test Key Pages**
   - Homepage: https://blazesportsintel.pages.dev/
   - MLB: https://blazesportsintel.pages.dev/sports/mlb
   - College Baseball: https://blazesportsintel.pages.dev/sports/college-baseball
   - MMI Dashboard: https://blazesportsintel.pages.dev/mmi

3. **Enable Web Analytics**
   - Go to: https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/projects/blazesportsintel/analytics
   - Enable "Web Analytics" (free)
   - Get real-time traffic insights

4. **Set Up Alerts**
   - Go to: https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/notifications
   - Create alerts for:
     - Deployment failures
     - High error rates
     - SSL certificate expiry

---

## 📊 Deployment Status Check

```bash
# Check if secrets are set
gh secret list

# View workflow runs
gh run list --workflow=deploy-cloudflare.yml

# Watch live deployment
gh run watch

# View deployment logs
gh run view --log
```

---

## 🚨 Troubleshooting

### Deployment Fails

**Check workflow logs:**
```bash
gh run view --log
```

**Common issues:**

1. **Build fails** - Check `pnpm build` output for TypeScript errors
2. **Missing secrets** - Verify CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in GitHub
3. **API rate limit** - Wait 1 minute and retry

### Site Not Accessible

**Check DNS propagation:**
```bash
dig blazesportsintel.com
```

**Check Cloudflare status:**
```bash
curl -I https://blazesportsintel.pages.dev
```

**Clear Cloudflare cache:**
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \
  -H "Authorization: Bearer r-2jlIcjxuS-INveZJAaJS-IzwtJeh6HvH9qi9Fi" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

## 📞 Support

**Cloudflare Support:**
- Dashboard: https://dash.cloudflare.com
- Docs: https://developers.cloudflare.com/pages
- Community: https://community.cloudflare.com

**GitHub Actions:**
- Workflow: `.github/workflows/deploy-cloudflare.yml`
- Actions: https://github.com/ahump20/BSI-NextGen/actions
- Docs: https://docs.github.com/en/actions

---

## ✅ Recommended: Option 1 (GitHub Actions)

**Why GitHub Actions is safest:**
1. ✅ Automated - no manual steps after initial setup
2. ✅ Preview deployments for every PR - test before merging
3. ✅ Instant rollback - revert any deployment in seconds
4. ✅ Audit trail - full deployment history in GitHub
5. ✅ Zero downtime - atomic deployments
6. ✅ No content loss - immutable snapshots

**Setup time:** 5 minutes
**First deployment:** 2-3 minutes
**Subsequent deployments:** Automatic on git push

---

**Ready to deploy?** Follow Option 1 above! 🚀
