# Claude Code Web Configuration

This directory contains configuration files and scripts for **Claude Code on the web** support for the BSI-NextGen repository.

---

## Overview

BSI-NextGen is configured to work seamlessly with Claude Code on the web through:

1. **Automatic Setup Hooks** - SessionStart hooks that install dependencies and build packages
2. **Network Configuration** - Documented API endpoints and required domains
3. **Environment Templates** - Clear environment variable requirements
4. **Validation Scripts** - Tools to verify setup and network access

---

## Directory Structure

```
.claude/
├── README.md                    # This file - Claude Code setup documentation
├── settings.json                # SessionStart hooks configuration
├── scripts/
│   ├── setup.sh                 # Automatic setup script (runs on session start)
│   └── network-check.sh         # Network API validation script
└── tests/
```

---

## Configuration Files

### `settings.json`

Configures Claude Code behavior for this repository:

**SessionStart Hooks:**
- Runs `setup.sh` automatically when a new session starts
- Ensures dependencies are installed and packages are built
- Validates environment and displays next steps

**Environment Documentation:**
- Lists required network domains for sports data APIs
- Provides notes about monorepo structure and requirements
- Documents API key requirements

**Key Configuration:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/scripts/setup.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Scripts

### `setup.sh`

**Purpose:** Automatic project setup for Claude Code web sessions.

**What it does:**
1. ✅ Verifies Node.js version (requires 18+)
2. ✅ Installs pnpm globally if not available
3. ✅ Installs all dependencies using `pnpm install`
4. ✅ Builds packages in dependency order:
   - `@bsi/shared` (types and utilities)
   - `@bsi/api` (sports data adapters)
   - `@bsi/web` (Next.js application)
5. ✅ Checks for `.env` file and warns if missing
6. ✅ Displays available commands and next steps

**Execution:**
- Runs automatically on session start (configured in `settings.json`)
- Can be run manually: `bash .claude/scripts/setup.sh`

**Exit codes:**
- `0` - Setup completed successfully
- Non-zero - Setup failed (check error messages)

**Expected output:**
```
🚀 BSI-NextGen Claude Code Setup
=================================

📋 Checking Node.js version...
   Node.js: v18.x.x
   pnpm: v8.x.x

📦 Installing dependencies...
✅ Dependencies installed

🔨 Building packages...
   Building @bsi/shared...
   Building @bsi/api...
   Building @bsi/web...

✅ All packages built successfully

✅ .env file found

=================================
✨ Setup complete!
```

### `network-check.sh`

**Purpose:** Validate network access to required sports data APIs.

**What it tests:**
- ✅ MLB Stats API (`statsapi.mlb.com`)
- ✅ ESPN College Baseball API (`site.api.espn.com`)
- ✅ ESPN NCAA Football API (`site.api.espn.com`)
- ⚠️ SportsDataIO (`sportsdata.io` - optional, requires API key)
- ⚠️ Auth0 (`*.auth0.com` - optional, if configured)

**Usage:**
```bash
# Run network validation
.claude/scripts/network-check.sh

# Expected output if all required APIs are accessible:
🌐 BSI-NextGen Network API Check
=================================

Core Sports APIs:
-----------------
Checking MLB Stats API... ✓ Available
Checking ESPN CFB API... ✓ Available
Checking ESPN NCAA Football API... ✓ Available

Third-Party APIs (require API keys):
-------------------------------------
Checking SportsDataIO... ⚠ Failed (optional)
   Note: SportsDataIO requires SPORTSDATAIO_API_KEY in .env

Authentication Services:
------------------------
Auth0: Not configured (set AUTH0_DOMAIN in .env)

=================================
✅ All required APIs are accessible
```

**Exit codes:**
- `0` - All required APIs accessible
- `1` - One or more required APIs not accessible (network restrictions)

**If APIs are blocked:**
The script will display which domains need to be added to the network allowlist:
```
❌ Some required APIs are not accessible

Required domains for network allowlist:
  - statsapi.mlb.com (MLB data)
  - site.api.espn.com (NCAA/College sports)
  - api.sportsdata.io (NFL/NBA data)
  - sportsdata.io (SportsDataIO)
```

---

## Network Requirements

### Required Domains (Core Functionality)

**MLB Stats API:**
- Domain: `statsapi.mlb.com`
- Purpose: Official MLB game data, standings, teams
- Authentication: None required
- Free tier: Unlimited

**ESPN Public APIs:**
- Domain: `site.api.espn.com`
- Purpose: NCAA Football, College Baseball data
- Authentication: None required
- Free tier: Unlimited

### Required Domains (Premium Features)

**SportsDataIO:**
- Domains: `api.sportsdata.io`, `sportsdata.io`
- Purpose: NFL and NBA game data, standings, teams
- Authentication: API key required (`SPORTSDATAIO_API_KEY`)
- Free tier: Limited requests per month

**Auth0 (if authentication enabled):**
- Domain: `*.auth0.com` (e.g., `your-tenant.us.auth0.com`)
- Purpose: User authentication and authorization
- Authentication: OAuth credentials required
- Configuration: Set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`

### Network Access Level

**Recommended:** Full Internet Access

**Alternative:** Domain allowlist with the following domains:
- `statsapi.mlb.com`
- `site.api.espn.com`
- `api.sportsdata.io`
- `sportsdata.io`
- `*.auth0.com` (if using authentication)
- `registry.npmjs.org` (for dependency installation)
- `nodejs.org` (for Node.js updates)

---

## Environment Variables

### Required Variables

Create a `.env` file in the repository root with the following:

```bash
# Copy from template
cp .env.example .env
```

**SportsDataIO API (for NFL/NBA data):**
```bash
SPORTSDATAIO_API_KEY=your_api_key_here
```
Get from: https://sportsdata.io/ (free tier available)

**Auth0 Authentication (if enabled):**
```bash
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret_here
```
Get from: https://manage.auth0.com/ (create a Regular Web Application)

**Application Configuration:**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Optional Variables

```bash
# D1Baseball API (future enhancement)
D1BASEBALL_API_URL=https://d1baseball.com/api

# Database (when implemented)
DATABASE_URL=postgresql://user:password@localhost:5432/bsi_nextgen
REDIS_URL=redis://localhost:6379
```

### Security Notes

- ✅ `.env` is in `.gitignore` - never commit it
- ✅ Use different keys for development vs production
- ✅ Generate strong JWT_SECRET: `openssl rand -base64 32`
- ✅ In Claude Code web, environment variables should be configured in the project settings, not committed to the repository

---

## Development Workflow

### 1. Session Initialization

When you start a Claude Code web session:

1. **Automatic setup runs** (via SessionStart hook)
   - Dependencies installed
   - Packages built
   - Environment checked

2. **Verify setup completed:**
   ```bash
   # Check that packages were built
   ls -la packages/*/dist

   # Expected output:
   # packages/shared/dist/
   # packages/api/dist/
   # packages/web/.next/
   ```

3. **Validate network access:**
   ```bash
   .claude/scripts/network-check.sh
   ```

### 2. Environment Configuration

**If `.env` doesn't exist:**
```bash
# Copy template
cp .env.example .env

# Edit with your API keys (use editor or Claude Code)
# At minimum, add:
# - SPORTSDATAIO_API_KEY (for NFL/NBA)
# - AUTH0_* variables (if using authentication)
```

**Verify environment variables:**
```bash
# Check .env file exists and has required keys
grep -E "SPORTSDATAIO_API_KEY|AUTH0_" .env
```

### 3. Start Development Server

```bash
# Start Next.js dev server
pnpm dev

# Server runs at http://localhost:3000
```

**Available pages:**
- `/` - Homepage
- `/sports/mlb` - MLB games and standings
- `/sports/nfl` - NFL games and standings
- `/sports/nba` - NBA games and standings
- `/sports/ncaa-football` - NCAA Football games
- `/sports/college-baseball` - College Baseball (priority feature)

### 4. Make Changes

**Example: Add a new sports adapter**

1. Create adapter in `packages/api/src/adapters/`
2. Export from `packages/api/src/index.ts`
3. Build API package: `pnpm --filter @bsi/api build`
4. Create API route in `packages/web/app/api/sports/`
5. Create frontend page in `packages/web/app/sports/`
6. Test changes

**Example: Update shared types**

1. Edit types in `packages/shared/src/types.ts`
2. Build shared package: `pnpm --filter @bsi/shared build`
3. Rebuild dependent packages: `pnpm build`
4. Test changes

### 5. Run Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npx playwright test

# Run mobile regression tests
.claude/tests/mobile-regression.sh --all
```

### 6. Commit & Push

```bash
# Stage changes
git add .

# Commit
git commit -m "feat: Add new feature"

# Push to branch (must start with 'claude/' and match session ID)
git push -u origin claude/your-branch-name
```

---

## Troubleshooting

### Setup Script Fails

**Symptom:** Setup script exits with errors during session start

**Diagnosis:**
```bash
# Run setup manually with verbose output
bash -x .claude/scripts/setup.sh
```

**Common causes:**
- **pnpm not installed:** Script will install it automatically, but may need retry
- **Node.js version too old:** Requires Node.js 18+
- **Network timeout:** Dependency installation timed out

**Solutions:**
```bash
# Manually install pnpm
npm install -g pnpm

# Clear cache and retry
pnpm store prune
pnpm install

# If lockfile issues
pnpm install --no-frozen-lockfile
```

### Network Access Blocked

**Symptom:** Network check fails for required APIs

**Diagnosis:**
```bash
# Run network check
.claude/scripts/network-check.sh

# Expected error:
# ❌ Some required APIs are not accessible
```

**Solutions:**
1. **Request Full Internet Access** in Claude Code web settings
2. **Add domains to allowlist** (see Network Requirements section)
3. **Verify firewall settings** aren't blocking API domains

**Test specific endpoint:**
```bash
# Test MLB API
curl -I https://statsapi.mlb.com/api/v1/sports

# Test ESPN API
curl -I https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard
```

### Build Failures

**Symptom:** Package builds fail during setup or development

**Diagnosis:**
```bash
# Check for TypeScript errors
pnpm type-check

# Check for linting errors
pnpm lint
```

**Common causes:**
- **Type mismatches:** Shared types changed but dependents not rebuilt
- **Missing dependencies:** pnpm install incomplete
- **Cache issues:** Stale build artifacts

**Solutions:**
```bash
# Full clean and rebuild
pnpm clean
pnpm install
pnpm build

# Rebuild specific package
pnpm --filter @bsi/shared build
pnpm --filter @bsi/api build
pnpm --filter @bsi/web build
```

### Environment Variable Issues

**Symptom:** API calls fail with authentication errors

**Diagnosis:**
```bash
# Check .env file exists
ls -la .env

# Check for required keys
grep SPORTSDATAIO_API_KEY .env
grep AUTH0_ .env
```

**Solutions:**
```bash
# Create .env from template
cp .env.example .env

# Edit with your API keys
# Then restart dev server
pnpm dev
```

**Verify API key works:**
```bash
# Test SportsDataIO API key
curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY_HERE" \
  "https://api.sportsdata.io/v3/nfl/scores/json/Teams"
```

### Playwright Test Failures

**Symptom:** E2E tests fail or browsers not found

**Diagnosis:**
```bash
# Check Playwright installation
npx playwright --version

# Check browsers installed
npx playwright list-files
```

**Solutions:**
```bash
# Install Playwright browsers
npx playwright install

# Run specific test file
npx playwright test tests/mobile-visual-regression.spec.ts

# Run in debug mode
npx playwright test --debug
```

---

## Performance Optimization

### Build Time Optimization

**Use filtered builds for faster iteration:**
```bash
# Only rebuild changed package
pnpm --filter @bsi/shared build

# Rebuild package and dependents
pnpm --filter @bsi/api... build
```

### Development Server Optimization

**Use Turbo mode for faster rebuilds:**
```bash
# Enable Next.js turbo mode (experimental)
pnpm --filter @bsi/web dev --turbo
```

### Dependency Installation Optimization

**Use pnpm's frozen-lockfile for faster installs:**
```bash
# Specified in setup.sh
pnpm install --frozen-lockfile
```

---

## Additional Resources

### Documentation

- **Main Guide:** `../CLAUDE.md` - Complete development documentation
- **Quick Start:** `../QUICK_START.md` - Detailed setup instructions
- **Environment:** `../.env.example` - Environment variable template
- **Deployment:** `../DEPLOYMENT.md` - Production deployment guide

### External Links

- **Claude Code Documentation:** https://docs.anthropic.com/claude/docs/claude-code
- **pnpm Workspaces:** https://pnpm.io/workspaces
- **Next.js 14:** https://nextjs.org/docs
- **Playwright:** https://playwright.dev/

### Support

For issues specific to this repository:
1. Check `CLAUDE.md` troubleshooting section
2. Run `.claude/scripts/network-check.sh` to diagnose network issues
3. Check `../docs/` for infrastructure and operational documentation

For Claude Code web-specific issues:
1. Verify network access settings
2. Check SessionStart hook logs for setup errors
3. Ensure environment variables are configured
4. Refer to Claude Code documentation for platform limitations

---

## Maintenance

### Updating Setup Script

If you need to modify the setup process:

1. Edit `.claude/scripts/setup.sh`
2. Test manually: `bash .claude/scripts/setup.sh`
3. Verify it works in a fresh session
4. Document changes in this README

### Updating Network Requirements

If you add new external APIs:

1. Add domain to `.claude/settings.json` → `requiredDomains`
2. Add check to `.claude/scripts/network-check.sh`
3. Document in this README under "Network Requirements"
4. Update `CLAUDE.md` "Claude Code Web Support" section

### Updating Environment Variables

If you add new required environment variables:

1. Add to `.env.example` with documentation
2. Update this README under "Environment Variables"
3. Update `CLAUDE.md` environment variables section
4. Update setup script to check for the new variable

---

**Last Updated:** 2025-11-09
**Claude Code Version:** Web (Latest)
**Repository Version:** 1.0.0
