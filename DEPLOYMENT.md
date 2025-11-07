# Deployment Guide

This guide covers deployment configuration for Netlify and Vercel, and troubleshooting common build failures.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration Files](#configuration-files)
- [Environment Variables](#environment-variables)
- [Common Build Failures](#common-build-failures)
- [Platform-Specific Setup](#platform-specific-setup)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Netlify

1. Connect your repository to Netlify
2. Set environment variables in **Site settings > Environment variables**
3. The build will use settings from `netlify.toml`
4. Deploy!

### Vercel

1. Connect your repository to Vercel
2. Set environment variables in **Project Settings > Environment Variables**
3. The build will use settings from `vercel.json`
4. Deploy!

## Configuration Files

This repository includes the following deployment configuration files:

- **`vercel.json`** - Vercel deployment configuration
- **`netlify.toml`** - Netlify deployment configuration
- **`.env.example`** - Environment variable template

### vercel.json

Configures:
- Build and install commands using pnpm
- NPM flags for peer dependency handling
- CI environment to prevent warnings from failing builds
- Output directory

### netlify.toml

Configures:
- Build commands with CI override
- Node and pnpm versions
- Environment variables
- Caching strategies
- Security headers
- Context-specific builds (production, preview, branch)

## Environment Variables

### Setting Up Environment Variables

1. **Copy the template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your values** in `.env` (never commit this file!)

3. **Set the same variables in your deployment platform:**

   **Netlify:**
   - Go to Site settings > Environment variables
   - Add each variable with the exact same name

   **Vercel:**
   - Go to Project Settings > Environment Variables
   - Add each variable with the exact same name
   - Choose appropriate environments (Production, Preview, Development)

### Important Rules

⚠️ **Variable names must match EXACTLY** (case-sensitive):
- ✅ `OPENAI_API_KEY` = `OPENAI_API_KEY`
- ❌ `OPENAI_API_KEY` ≠ `VITE_APP_OPENAI`
- ❌ `OPENAI_API_KEY` ≠ `openai_api_key`

🔒 **Never expose secrets in public variables:**
- Variables prefixed with `NEXT_PUBLIC_` or `VITE_` are exposed to the browser
- Only use these prefixes for non-sensitive data (API URLs, feature flags, etc.)

📋 **Set variables for all contexts:**
- Production
- Preview (for PR deployments)
- Development (optional)

## Common Build Failures

### 1. Environment Variable Mismatches

**Problem:** Build fails with "undefined is not defined" or similar errors.

**Cause:** Environment variable names don't match between your code and deployment platform.

**Fix:**
- Check variable names in your code
- Verify they match exactly in Netlify/Vercel dashboard
- Check for typos and case sensitivity

### 2. Missing or Invalid Configuration Files

**Problem:** Build doesn't start or fails immediately with no useful logs.

**Cause:** Missing or malformed `vercel.json` or `netlify.toml`.

**Fix:**
- Ensure configuration files are in the repository root
- Validate JSON/TOML syntax
- Check that file names are exactly correct

### 3. Packages/Commands Not Installed

**Problem:** "command not found" errors during build.

**Cause:** Build tools not declared in `package.json`.

**Fix:**
- Add missing packages to `package.json` dependencies or devDependencies
- Run `pnpm install` locally to test
- Ensure pnpm version matches (`engines` field in package.json)

### 4. Peer Dependency Conflicts

**Problem:** Build fails with "Could not resolve dependency" warnings.

**Cause:** NPM 8.6-8.12 peer dependency issues, especially with React 17+.

**Fix:**
- For pnpm, add the `--legacy-peer-deps` flag directly to your install/build command (e.g., `pnpm install --legacy-peer-deps`)
- Alternatively, configure this in your `.npmrc` or `pnpm-workspace.yaml` for persistent behavior
- If still failing, you can add the `--force` flag

### 5. Warnings Treated as Errors in CI

**Problem:** Build succeeds locally but fails in CI with warnings.

**Cause:** Netlify/Vercel set `CI=true`, which makes some tools treat warnings as errors.

**Fix:**
- Already configured via `CI=''` in build commands
- This is set in both `netlify.toml` and `vercel.json`

### 6. Large Files/Monolithic Sites

**Problem:** Deploy hangs or fails with large files.

**Cause:** Files over ~10 MB or tens of thousands of files.

**Fix:**
- Use `.gitignore` to exclude large media files
- Consider using a CDN for large assets
- Optimize images and assets
- Split monolithic sites into smaller parts

### 7. Cache Issues

**Problem:** Random, unexplainable failures that persist across builds.

**Cause:** Corrupted build cache.

**Fix:**

**Netlify:**
- Go to Site settings > Build & deploy > Build settings
- Click "Clear cache and deploy"
- Or trigger a deploy with the "Clear cache" option

**Vercel:**
- Redeploy with the "Redeploy" button
- Check cache size (limited to 1 GB per build key)

### 8. Repository Permissions and Plan Limits

**Problem:** Build fails immediately on Netlify.

**Cause:** 
- Private repo on organization account with Core Starter plan
- Exceeding Vercel Hobby limits (8 GB RAM, 23 GB disk)

**Fix:**
- Upgrade Netlify plan or move repo to personal account or make public
- Upgrade Vercel plan or optimize build to use fewer resources
- Check build timeout (45 minutes max on most plans)

### 9. Specific Build Errors

**Problem:** "Missing Build script" error on Vercel.

**Fix:** Ensure `package.json` has a `build` script:
```json
{
  "scripts": {
    "build": "pnpm -r build"
  }
}
```

**Problem:** "Recursive invocation of commands" error.

**Fix:** Check for circular references in npm scripts.

**Problem:** "Module not found" errors.

**Fix:**
- Check import paths match file names exactly (case-sensitive)
- Verify all dependencies are in `package.json`
- Clear cache and redeploy

## Platform-Specific Setup

### Netlify Setup

1. **Install Netlify CLI (optional, for local testing):**
   ```bash
   npm install -g netlify-cli
   ```

2. **Test build locally:**
   ```bash
   netlify build
   ```

3. **Deploy manually (optional):**
   ```bash
   netlify deploy --prod
   ```

### Vercel Setup

1. **Install Vercel CLI (optional, for local testing):**
   ```bash
   npm install -g vercel
   ```

2. **Test build locally:**
   ```bash
   vercel build
   ```

3. **Deploy manually (optional):**
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Debug Checklist

When a build fails, check these in order:

- [ ] Environment variables are set and named correctly
- [ ] Configuration files (`vercel.json`, `netlify.toml`) exist and are valid
- [ ] `package.json` has a `build` script
- [ ] All dependencies are in `package.json`
- [ ] Build works locally with the same Node version
- [ ] No large files (>10 MB) are being deployed
- [ ] Repository permissions and plan limits are adequate
- [ ] Cache has been cleared if failures are random

### Getting Build Logs

**Netlify:**
- Go to Deploys tab
- Click on the failed deploy
- View full deploy log

**Vercel:**
- Go to Deployments tab
- Click on the failed deployment
- View build logs in the "Building" section

### Testing Locally

Before pushing, test your build locally:

```bash
# Install dependencies
pnpm install

# Run build
pnpm run build

# Run linter
pnpm run lint

# Test format
pnpm run format --check
```

### Still Having Issues?

1. Check the [Netlify Support Forums](https://answers.netlify.com/)
2. Check the [Vercel Discussions](https://github.com/vercel/vercel/discussions)
3. Review deployment logs carefully for specific error messages
4. Try deploying from a clean branch
5. Compare with a working deployment configuration

## Best Practices

✅ **Do:**
- Keep configuration files in repository root
- Document all required environment variables
- Test builds locally before pushing
- Use exact variable names across all platforms
- Keep dependencies up to date
- Monitor build times and optimize as needed

❌ **Don't:**
- Commit `.env` files with secrets
- Use different variable names in different environments
- Ignore warnings during local development
- Deploy large files without optimization
- Leave build failures unresolved
- Use overly complex build processes

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
