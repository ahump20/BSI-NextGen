# Vercel + GitHub Quick Start

**5-Minute Setup Guide for BSI-NextGen**

## Prerequisites
- ✅ GitHub account with access to `ahump20/BSI-NextGen`
- ✅ Vercel configuration already set up in this repo

## Setup Steps

### 1. Create Vercel Account (1 min)
1. Go to [vercel.com/signup](https://vercel.com/signup)
2. Click **"Continue with GitHub"**
3. Authorize Vercel

### 2. Import Repository (2 min)
1. Click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Install Vercel GitHub App:
   - Select **"Only select repositories"**
   - Choose `ahump20/BSI-NextGen`
   - Click **"Install"**
4. Click **"Import"** next to the repository

### 3. Configure Environment Variables (2 min)

**Required:**
```
SPORTSDATAIO_API_KEY = your_api_key_here
NODE_ENV = production
NEXT_PUBLIC_APP_URL = https://bsi-nextgen.vercel.app
```

**Optional (for full features):**
```
AUTH0_DOMAIN = your-tenant.us.auth0.com
AUTH0_CLIENT_ID = your_client_id
AUTH0_CLIENT_SECRET = your_client_secret
JWT_SECRET = (generate with: openssl rand -base64 32)
NEXT_PUBLIC_WORKER_URL = https://blaze-trends.YOUR_SUBDOMAIN.workers.dev
```

Add these in: **Environment Variables** section → Add for all environments

### 4. Deploy
1. Click **"Deploy"**
2. Wait 3-5 minutes for build
3. Visit your deployment URL

## What You Get

### Automatic Deployments
- **Production**: Every push to `main` → `https://your-project.vercel.app`
- **Preview**: Every PR → Unique preview URL
- **Comments**: Deployment URLs posted automatically in PRs

### GitHub Integration
- ✅ Deployment status checks in PRs
- ✅ Instant rollback on git revert
- ✅ Auto-cancel queued builds on new commits

## Testing the Setup

1. Create a new branch
2. Make a small change
3. Push and create PR
4. Verify Vercel comment with preview URL appears

## Configuration Files (Already Set Up)

- `vercel.json` - Main configuration
- `packages/web/vercel.json` - Web package settings
- `.vercelignore` - Deployment optimization

## Common Issues

**Build fails?**
- Check environment variables are set
- Verify `pnpm-lock.yaml` is committed

**Preview URLs not showing?**
- Verify GitHub App is installed
- Check project Git settings in Vercel

**API calls failing?**
- Add `SPORTSDATAIO_API_KEY` to environment variables
- Redeploy after adding variables

## Resources

- 📚 Full Setup Guide: `VERCEL_GITHUB_SETUP.md`
- 🎯 Vercel Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- 📖 Documentation: [vercel.com/docs](https://vercel.com/docs)

## Next Steps

1. ✅ Complete setup above
2. Configure custom domain (optional)
3. Enable Vercel Analytics
4. Set up team access (if needed)

---

**Project**: BSI-NextGen | **Framework**: Next.js 14 | **Package Manager**: pnpm
