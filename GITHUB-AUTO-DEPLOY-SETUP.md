# GitHub Auto-Deploy Setup Guide

**Date:** January 13, 2025
**Project:** blazesportsintelligence
**Purpose:** Enable automatic deployments from GitHub to Netlify

---

## 🎯 What You're Setting Up

GitHub Auto-Deploy will automatically deploy your NCAA Fusion Dashboard (and all future changes) whenever you push to the `main` branch. This is the recommended production workflow.

---

## ✅ Step-by-Step Instructions

### Step 1: Access Netlify Settings

I've already opened the Netlify admin dashboard for you:
**URL:** https://app.netlify.com/projects/blazesportsintelligence

You should see:
- Site overview
- Recent deployments list
- Settings navigation in the left sidebar

### Step 2: Navigate to Build & Deploy Settings

1. Click **"Site settings"** in the left navigation (or top navigation)
2. Click **"Build & Deploy"** in the settings menu
3. Look for the **"Continuous Deployment"** section

### Step 3: Verify GitHub Connection

In the **Continuous Deployment** section, check:

**✅ If you see "GitHub" with a green checkmark:**
- Your GitHub App is already connected!
- Skip to Step 4 (Build Settings)

**⚠️ If you see "Connect to Git" or a disconnected status:**
1. Click **"Link site to Git"** or **"Connect to GitHub"**
2. Authorize Netlify to access your GitHub account
3. Select the repository: **ahump20/BSI-NextGen**
4. Choose the branch: **main**
5. Click **"Save"**

### Step 4: Verify Build Settings

Still in **Build & Deploy** → **Continuous Deployment**, verify:

**Build command:**
```bash
cd ../.. && CI='' pnpm install --frozen-lockfile && pnpm build
```

**Publish directory:**
```
packages/web/.next
```

**Base directory:**
```
packages/web
```

**Production branch:**
```
main
```

These settings should already be configured from `netlify.toml`, but verify they match.

### Step 5: Check Environment Variables

1. While still in **Site Settings**, click **"Environment variables"** in the left menu
2. Verify these variables are set:

**Required:**
- `REAL_API_BASE_URL` = `https://api.blazesportsintel.com`
- `NCAA_API_BASE_URL` = `https://ncaa-api.henrygd.me`
- `SPORTSDATAIO_API_KEY` = (your API key - should be set)

**Application:**
- `NEXT_PUBLIC_APP_URL` = `https://blazesportsintelligence.netlify.app`
- `WEB_APP_ORIGIN` = `https://blazesportsintelligence.netlify.app`

If any are missing, click **"Add a variable"** and add them.

### Step 6: Enable Build Hooks (Optional but Recommended)

1. In **Build & Deploy**, scroll to **"Build hooks"**
2. Click **"Add build hook"**
3. Name it: `GitHub Auto Deploy`
4. Save the hook

This creates a webhook URL that GitHub can use to trigger builds.

### Step 7: Verify GitHub Webhook

1. Go to your GitHub repository: https://github.com/ahump20/BSI-NextGen
2. Click **"Settings"** (repository settings, not your profile)
3. Click **"Webhooks"** in the left sidebar
4. Look for a webhook pointing to `https://api.netlify.com/hooks/github`

**✅ If webhook exists with a green checkmark:**
- Auto-deploy is configured correctly!

**⚠️ If webhook is missing or has a red X:**
1. Go back to Netlify **Build & Deploy** settings
2. Click **"Configure build settings"**
3. Disconnect and reconnect GitHub (this recreates the webhook)

### Step 8: Test Auto-Deploy

**Option A: Trigger Manual Deploy First**
1. In Netlify, click **"Deploys"** in the top navigation
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 3-5 minutes for build to complete
4. Verify NCAA Fusion Dashboard is live

**Option B: Push a Test Commit**
```bash
# Add this file to git and push
git add GITHUB-AUTO-DEPLOY-SETUP.md
git commit -m "docs: add GitHub auto-deploy setup guide"
git push origin main

# Watch for deployment in Netlify dashboard
```

Within 30-60 seconds of pushing, you should see:
- A new deployment appear in the Netlify dashboard
- Status: "Building" → "Published"
- NCAA Fusion Dashboard live at: https://blazesportsintelligence.netlify.app/college/fusion

---

## 🔍 Verification Checklist

After setup, verify the following:

### 1. Deployment Triggered Automatically
- [ ] Push a commit to main branch
- [ ] Within 60 seconds, new deployment appears in Netlify
- [ ] Build completes successfully
- [ ] Site is updated with new changes

### 2. NCAA Fusion Dashboard Live
- [ ] Visit: https://blazesportsintelligence.netlify.app/college/fusion?sport=basketball&teamId=251
- [ ] Page loads successfully (no 404)
- [ ] Texas Longhorns data displays
- [ ] Pythagorean metrics show
- [ ] Standings table renders

### 3. Homepage Integration
- [ ] Visit: https://blazesportsintelligence.netlify.app
- [ ] NCAA Fusion card visible on homepage
- [ ] Quick access links work (Texas BBall, Alabama FB, Arkansas BB)

### 4. API Endpoint
```bash
curl "https://blazesportsintelligence.netlify.app/api/edge/ncaa/fusion?sport=basketball&teamId=251"
# Should return JSON with Texas Longhorns analytics
```

---

## 🚨 Troubleshooting

### Issue: Webhook Not Triggering

**Solution:**
1. Check GitHub webhook delivery in repository settings
2. If webhook shows errors, delete and recreate in Netlify:
   - Disconnect Git in Netlify
   - Reconnect Git
   - Verify webhook recreated in GitHub

### Issue: Build Failing with pnpm-lock.yaml Error

**Solution:**
1. Update `netlify.toml` build command to remove `--frozen-lockfile`:
```toml
[build]
  command = "cd ../.. && CI='' pnpm install && pnpm build"
```

2. Or regenerate lockfile:
```bash
rm pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: regenerate pnpm-lock.yaml"
git push origin main
```

### Issue: Environment Variables Not Found

**Solution:**
1. Go to Netlify **Site Settings** → **Environment Variables**
2. Add missing variables (see Step 5 above)
3. Click **"Trigger deploy"** to rebuild with new variables

### Issue: Build Succeeds but NCAA Fusion 404

**Solution:**
1. Check build logs in Netlify dashboard
2. Verify `/college/fusion` route was generated
3. Check Next.js build output for route list
4. Ensure `packages/web/app/college/fusion/page.tsx` exists

---

## 📈 Expected Build Time

- **Total Build Time:** 3-5 minutes
- **Install Dependencies:** ~1 minute
- **Build Packages:** ~2 minutes
- **Deploy to Edge:** ~30 seconds

---

## ✅ Success Indicators

You'll know auto-deploy is working when:

1. **Immediate Feedback:**
   - Within 60 seconds of pushing to main, new deployment appears in Netlify

2. **Build Progress:**
   - Build status shows: "Building..." → "Published"
   - Build logs show successful compilation
   - No critical errors in logs

3. **Live Site:**
   - NCAA Fusion Dashboard accessible at production URL
   - Homepage shows NCAA Fusion card
   - API endpoints return live data

---

## 🎉 Next Steps After Setup

Once auto-deploy is working:

1. **Make Changes Confidently:**
   - Edit code locally
   - Commit and push to main
   - Changes automatically deploy in 3-5 minutes

2. **Monitor Deployments:**
   - Watch Netlify dashboard for build status
   - Check build logs if issues arise
   - Review deploy previews for PRs

3. **Add More Features:**
   - NCAA Fusion supports multiple sports (football, baseball)
   - Add team pages for other conferences
   - Expand analytics with more metrics

---

## 📞 Support Resources

- **Netlify Dashboard:** https://app.netlify.com/projects/blazesportsintelligence
- **GitHub Repository:** https://github.com/ahump20/BSI-NextGen
- **Documentation:**
  - `NCAA_FUSION_DEPLOYMENT_COMPLETE.md` - Deployment summary
  - `NCAA_FUSION_DATA_SOURCE_VERIFICATION.md` - Data integrity
  - `NCAA_FUSION_SETUP.md` - Complete setup guide

---

**Generated:** January 13, 2025
**Last Updated:** January 13, 2025
**Status:** ✅ Ready to Configure
