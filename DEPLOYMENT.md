# Deployment Troubleshooting Guide

This guide covers common issues that cause preview builds to fail on Netlify and Vercel.

## Common Build Failures and Solutions

### 1. Environment Variable Mismatches

**Problem:** Netlify/Vercel only inject variables that **exactly** match the names defined in the dashboard.

**Symptoms:**
- Build fails with "undefined is not a function" or similar errors
- Missing API key errors
- Variables show as `undefined` in the application

**Solutions:**
- ✅ Ensure variable names in your code **exactly** match what's set in the platform dashboard
- ✅ Use the `.env.example` file as a reference for required variables
- ✅ For Vite/React apps, prefix public variables with `VITE_`
- ✅ For Next.js, use `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Check for typos - `OPENAI_API_KEY` ≠ `VITE_APP_OPENAI`

### 2. Missing or Invalid Configuration Files

**Problem:** Invalid `vercel.json` or missing `netlify.toml` prevents builds from starting.

**Symptoms:**
- Build fails immediately without logs
- "Invalid configuration" errors
- Vercel doesn't show build logs

**Solutions:**
- ✅ Ensure `vercel.json` is valid JSON (use a JSON validator)
- ✅ Ensure `netlify.toml` is valid TOML syntax
- ✅ Both files are present in the repository root
- ✅ Verify the build command and output directory are correct

**Current Configuration:**
- `vercel.json`: Uses `pnpm install && pnpm build` with output to `dist/`
- `netlify.toml`: Uses `CI='' pnpm install && pnpm build` with output to `dist/`

### 3. Missing Build Script

**Problem:** Platform expects a `build` script in `package.json`.

**Symptoms:**
- "Missing Build script" error
- Build command not found

**Solutions:**
- ✅ Add a `build` script to root `package.json`
- ✅ Ensure it matches what's referenced in `vercel.json` or `netlify.toml`
- ✅ For monorepos, the build script should build all necessary packages

### 4. Peer Dependency Conflicts

**Problem:** NPM 8.6-8.12 produces "Could not resolve dependency" warnings that Netlify treats as errors.

**Symptoms:**
- "Could not resolve dependency" errors
- "ERESOLVE unable to resolve dependency tree"
- Build works locally but fails in CI

**Solutions:**
- ✅ Set `NPM_FLAGS="--legacy-peer-deps"` in Netlify environment variables (already configured in `netlify.toml`)
- ✅ Or use `NPM_FLAGS="--force"` as an alternative
- ✅ Ensure you're using compatible package versions

### 5. CI Environment Warnings as Errors

**Problem:** Netlify sets `CI=true` during builds; some libraries treat warnings as fatal when `CI` is set.

**Symptoms:**
- Build succeeds locally but fails in CI
- ESLint or TypeScript warnings cause build failure
- "Treating warnings as errors" messages

**Solutions:**
- ✅ Build commands already include `CI=''` prefix (configured in `netlify.toml`)
- ✅ This prevents warnings from being treated as errors
- ✅ Alternatively, fix the warnings if they indicate real issues

### 6. Missing Dependencies

**Problem:** Build script relies on tools not declared in `package.json`.

**Symptoms:**
- "command not found" errors
- Missing package errors
- Tool not available errors

**Solutions:**
- ✅ Add all build tools to `devDependencies` in `package.json`
- ✅ Don't rely on globally installed packages
- ✅ Test build locally with a fresh `node_modules`: `rm -rf node_modules && pnpm install && pnpm build`

### 7. Pnpm Configuration Issues

**Problem:** Vercel may show "Pnpm engine unsupported" or similar errors.

**Symptoms:**
- Pnpm version mismatch
- Package manager errors
- Lock file issues

**Solutions:**
- ✅ Ensure `pnpm-workspace.yaml` exists in repository root (already present)
- ✅ Specify pnpm version in `package.json` engines (already set to >=8.0.0)
- ✅ Commit `pnpm-lock.yaml` to repository
- ✅ Vercel automatically detects pnpm if `pnpm-lock.yaml` exists

### 8. Large Files and Build Limits

**Problem:** Files >10 MB or too many HTML files can cause deployment issues.

**Symptoms:**
- Deploy hangs or times out
- Long processing times
- CDN warnings

**Solutions:**
- ✅ Keep individual files under 10 MB
- ✅ Use `.gitignore` to exclude large files from repository
- ✅ Optimize images and assets before committing
- ✅ For Vercel Hobby: Stay under 8 GB RAM and 23 GB disk space
- ✅ Ensure builds complete within 45 minutes

### 9. Cache Issues

**Problem:** Corrupted build cache causes unexpected failures.

**Symptoms:**
- Builds fail inconsistently
- Same code fails sometimes, succeeds other times
- Stale dependency errors

**Solutions:**
- ✅ **Netlify:** Clear cache via UI or push commit message containing "Clear cache and deploy"
- ✅ **Vercel:** Redeploy will use fresh cache
- ✅ Cache plugin configured in `netlify.toml` to manage `node_modules` and `.pnpm-store`

### 10. Repository Permissions and Plan Limits

**Problem:** Private repos on organization accounts may require upgraded plans.

**Symptoms:**
- Netlify build fails with permissions error
- "Plan limit exceeded" errors

**Solutions:**
- ✅ **Netlify Core Starter:** Only works with public repos or personal private repos
- ✅ For organization private repos, upgrade to Pro plan
- ✅ Or make the repository public
- ✅ **Vercel Hobby:** Check RAM (8 GB limit) and disk space (23 GB limit)

### 11. Case-Sensitive File Paths

**Problem:** Netlify's build environment is case-sensitive (unlike Windows/macOS).

**Symptoms:**
- "Module not found" errors in CI
- Imports work locally but fail in deployment
- File path errors

**Solutions:**
- ✅ Ensure file paths in imports match the actual file names exactly
- ✅ `import Component from './Component'` not `import Component from './component'`
- ✅ Use consistent casing for all files and imports

### 12. Recursive Command Invocation

**Problem:** Build script calls itself recursively.

**Symptoms:**
- "Recursive invocation of commands" error
- Build hangs
- Infinite loop in build process

**Solutions:**
- ✅ Don't name your build script the same as a dependency command
- ✅ Avoid naming build command "build" if it conflicts
- ✅ Use specific commands like `next build` or `vite build`

## Verifying Your Build Locally

Before pushing changes, test your build locally:

```bash
# Clean install
rm -rf node_modules .pnpm-store dist
pnpm install

# Test build with CI environment variable
CI='' pnpm build

# Test build with CI=true to simulate Netlify default
CI=true pnpm build
```

## Environment Variable Checklist

Before deploying, verify:

- [ ] All required environment variables are set in platform dashboard
- [ ] Variable names match **exactly** (case-sensitive)
- [ ] Variables are set for the correct environment (Preview, Production, etc.)
- [ ] No typos in variable names
- [ ] Public variables have correct prefix (VITE_, NEXT_PUBLIC_, etc.)
- [ ] Secret variables are not committed to repository
- [ ] `.env.example` is updated with new variables (without values)

## Quick Debugging Steps

1. **Check build logs** in Netlify/Vercel dashboard
2. **Verify configuration files** are valid (JSON/TOML syntax)
3. **Check environment variables** match exactly
4. **Clear cache** if builds are inconsistent
5. **Test locally** with `CI='' pnpm install && pnpm build`
6. **Check plan limits** if you get resource errors
7. **Verify file paths** are case-sensitive correct

## Getting Help

If builds continue to fail:

1. Check the detailed build logs in the platform dashboard
2. Compare working commits with failing commits
3. Test the exact build command locally
4. Check platform status pages for outages
5. Review platform-specific documentation:
   - [Netlify Build Troubleshooting](https://docs.netlify.com/configure-builds/troubleshooting-tips/)
   - [Vercel Build Troubleshooting](https://vercel.com/docs/deployments/troubleshoot-a-build)
