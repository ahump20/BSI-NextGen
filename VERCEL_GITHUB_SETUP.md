# Vercel for GitHub Setup Guide

This guide walks you through setting up Vercel's GitHub integration for the BSI-NextGen project.

## Prerequisites

✅ **Already Configured:**
- `vercel.json` configuration files (root and `packages/web/`)
- `.vercelignore` file to optimize deployments
- GitHub integration settings in `vercel.json`

**You Need:**
- Collaborator access to the `ahump20/BSI-NextGen` GitHub repository
- A Vercel account (sign up at [vercel.com](https://vercel.com))

## Current Configuration

### Root `vercel.json` Settings

Your project is configured with:
- **GitHub Integration**: Enabled
- **Auto Alias**: Enabled (automatic preview URLs for PRs)
- **Auto Job Cancellation**: Enabled (cancels queued builds when new commits are pushed)
- **Deployment Comments**: Enabled (posts deployment URLs in PRs)
- **Build Command**: `pnpm install --frozen-lockfile && pnpm build`
- **Output Directory**: `packages/web/.next`
- **Region**: `iad1` (Washington, D.C. - optimal for US East)

### Web Package `vercel.json` Settings

Additional configuration for the web package:
- **Framework**: Next.js
- **Silent Mode**: Enabled (reduces PR comment noise)
- **Environment Variables**: References `@sportsdataio_api_key` secret

## Step-by-Step Setup

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. **Important**: Sign up using your GitHub account for seamless integration

### 2. Import Your GitHub Repository

1. From your Vercel dashboard, click **"Add New Project"**
2. Click **"Import Git Repository"**
3. If this is your first time, you'll be prompted to install the Vercel GitHub App:
   - Click **"Install Vercel"**
   - Select **"Only select repositories"**
   - Choose `ahump20/BSI-NextGen`
   - Click **"Install"**

4. Once installed, you'll see your repository in the import list
5. Click **"Import"** next to `ahump20/BSI-NextGen`

### 3. Configure Project Settings

Vercel will auto-detect your configuration from `vercel.json`, but verify these settings:

**Framework Preset:**
- Should auto-detect as "Next.js"

**Root Directory:**
- Leave as `./` (root) - the `vercel.json` file handles the monorepo structure

**Build and Output Settings:**
- These are automatically read from `vercel.json`:
  - Build Command: `pnpm install --frozen-lockfile && pnpm build`
  - Output Directory: `packages/web/.next`
  - Install Command: `pnpm install`

**Environment Variables:**
Add the following environment variables (click "Environment Variables" section):

| Name | Value | Environment |
|------|-------|-------------|
| `SPORTSDATAIO_API_KEY` | `your_api_key_here` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |
| `NEXT_PUBLIC_API_URL` | `https://your-domain.vercel.app` | Production |

**Optional Environment Variables:**
```
MLB_API_KEY=your_key_here
NCAA_API_KEY=your_key_here
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret
```

### 4. Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies with `pnpm install`
   - Build all packages in order (@bsi/shared → @bsi/api → @bsi/web)
   - Deploy to production

3. Wait for the deployment to complete (usually 2-5 minutes for first deployment)

### 5. Configure Custom Domain (Optional)

1. Go to your project settings
2. Click **"Domains"**
3. Add your custom domain (e.g., `blazesportsintel.com`)
4. Follow Vercel's instructions to configure DNS

## What Happens After Setup

### Automatic Deployments

**Production Deployments:**
- Every push to `main` branch triggers a production deployment
- Deployment URL: `https://your-project.vercel.app`
- Custom domain (if configured): `https://blazesportsintel.com`

**Preview Deployments:**
- Every push to any branch creates a unique preview URL
- Each PR gets a preview URL automatically
- Format: `https://bsi-nextgen-git-{branch}-{team}.vercel.app`

**Deployment Comments:**
- Vercel posts deployment status and URLs in your PRs
- Includes both preview URL and inspection URL

### GitHub Integration Features

✅ **Enabled Features:**
- Automatic deployments on every push
- Preview URLs for pull requests
- Deployment status checks in PRs
- Instant rollback on git revert
- Auto-cancellation of queued builds

### Branch Protection

Vercel automatically:
- Protects deployments from unauthorized forks
- Requires manual approval before deploying from forks
- Prevents malicious code execution

## Verifying the Setup

### 1. Check GitHub App Installation

1. Go to GitHub repository settings
2. Click **"Integrations"** → **"GitHub Apps"**
3. Verify **"Vercel"** is installed and active

### 2. Test Deployment

1. Make a small change to your repository
2. Push to a new branch
3. Create a pull request
4. Verify Vercel posts a comment with preview URL
5. Click the preview URL to test deployment

### 3. Monitor Deployments

View all deployments in:
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **GitHub PR Checks**: Each PR shows Vercel deployment status

## Troubleshooting

### Build Fails

**Issue**: Build fails with dependency errors

**Solution**:
```bash
# Ensure pnpm lockfile is committed
git add pnpm-lock.yaml
git commit -m "Add pnpm lockfile"
git push
```

**Issue**: Build fails with "Cannot find module '@bsi/shared'"

**Solution**: Verify `vercel.json` has correct build command that builds all packages:
```json
"buildCommand": "pnpm install --frozen-lockfile && pnpm build"
```

### Environment Variables Not Working

**Issue**: API calls fail with authentication errors

**Solution**:
1. Go to Vercel project settings
2. Click **"Environment Variables"**
3. Verify all required variables are set
4. Make sure to select correct environments (Production, Preview, Development)
5. Redeploy to apply changes

### Preview URLs Not Working

**Issue**: PRs don't get preview URLs

**Solution**:
1. Check that GitHub App is installed correctly
2. Verify `vercel.json` has `"github.enabled": true`
3. Check project Git settings in Vercel dashboard

### Deployment Too Slow

**Issue**: Deployments take >5 minutes

**Solution**:
1. Check `.vercelignore` is present (already configured)
2. Verify no large files are in repository
3. Consider enabling caching in `vercel.json` (already configured)

## Advanced Configuration

### Ignore Deployments for Specific Changes

If you want to skip deployments for certain changes (e.g., documentation updates):

```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- ./packages/"
}
```

This is already configured in your root `vercel.json`.

### Custom Deployment Notifications

To disable deployment comments in PRs:

1. Go to project settings in Vercel
2. Click **"Git"**
3. Toggle **"Comments on Pull Requests"** off

Or update `vercel.json`:
```json
{
  "github": {
    "silent": true
  }
}
```

### Multiple Environments

Create environment-specific configurations:

1. **Production**: Deploys from `main` branch
2. **Staging**: Configure in project settings to deploy from `staging` branch
3. **Preview**: Automatic for all other branches

## GitHub Actions Integration (Optional)

For advanced CI/CD workflows, you can use GitHub Actions alongside Vercel:

1. Create `.github/workflows/ci.yml`
2. Run tests before Vercel deploys
3. Use Vercel CLI in actions: `vercel deploy --prod`

Example workflow:
```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm test
```

## Resources

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Vercel for GitHub Docs**: [vercel.com/docs/git/vercel-for-github](https://vercel.com/docs/git/vercel-for-github)
- **Vercel CLI**: [vercel.com/docs/cli](https://vercel.com/docs/cli)
- **Project Settings**: Available in Vercel dashboard under your project
- **Deployment Logs**: Click any deployment in Vercel dashboard to view build logs

## Next Steps

1. ✅ Complete Vercel account setup
2. ✅ Import GitHub repository to Vercel
3. ✅ Configure environment variables
4. ✅ Deploy and verify
5. ✅ Test with a pull request
6. ⏭️ Configure custom domain (optional)
7. ⏭️ Set up Vercel Analytics (optional)
8. ⏭️ Enable Vercel Speed Insights (optional)

## Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **GitHub Issues**: Report integration issues at [github.com/vercel/vercel/issues](https://github.com/vercel/vercel/issues)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**Project**: BSI-NextGen
**Repository**: ahump20/BSI-NextGen
**Branch**: claude/setup-vercel-github-011CV5GFH8CA6B6WjxV5xt4C
**Framework**: Next.js 14 (App Router)
**Package Manager**: pnpm
**Deployment Region**: iad1 (Washington, D.C.)
