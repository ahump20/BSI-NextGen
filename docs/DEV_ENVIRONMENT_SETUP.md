# Development Environment Setup - Complete Guide

**Professional-grade development environment for Blaze Sports Intel platform.**

This document provides a comprehensive overview of the development environment configuration that has been set up for rapid feature development across 5 major initiatives:

1. College Baseball Box Score Engine
2. D1Baseball Rankings & Conference Standings
3. User Authentication (OAuth + JWT)
4. Mobile-First Responsive Design
5. MLB Real-Time Integration

---

## What Was Configured

### 1. DevContainer Setup (.devcontainer/)

**Files Created:**
- `devcontainer.json` - VS Code devcontainer configuration
- `docker-compose.yml` - Multi-service development environment
- `Dockerfile` - Custom development image with all tools

**Features:**
- Node.js 20 with TypeScript
- Automatic port forwarding (5173 for Vite, 8788 for Wrangler)
- Pre-installed VS Code extensions (ESLint, Prettier, Wrangler, Jest Runner)
- Redis for local KV emulation
- Automatic dependency installation on container creation

**Usage:**
```bash
# Open in VS Code
code /Users/AustinHumphrey/Sandlot-Sluggers

# Command Palette (Cmd+Shift+P)
> Dev Containers: Reopen in Container
```

---

### 2. Environment Variable Management

**File Created:**
- `.env.example` - Comprehensive template with 170+ lines

**Sections:**
1. **Application Settings** - Node environment, version, app name
2. **Cloudflare** - API tokens, account IDs, D1/KV bindings
3. **Authentication** - Auth0 configuration, JWT secrets
4. **Sports Data APIs** - NCAA, MLB, SportsDataIO, D1Baseball, Perfect Game
5. **Caching** - Redis URL, cache TTLs per resource type
6. **Error Tracking** - Sentry configuration
7. **Feature Flags** - Enable/disable features individually
8. **Testing** - Playwright base URLs, test database settings
9. **Deployment** - Environment-specific settings, CORS origins

**Setup:**
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

---

### 3. TypeScript Path Aliases

**Files Modified:**
- `tsconfig.json` - Added path mappings
- `vite.config.ts` - Added resolve aliases
- `vitest.config.ts` - Added matching aliases

**Available Aliases:**
```typescript
import { Component } from '@/components/Component';        // src/*
import { fetchMLB } from '@api/mlb';                      // lib/api/*
import { NCAAAdapter } from '@adapters/ncaa';             // lib/adapters/*
import { authMiddleware } from '@auth/middleware';        // lib/auth/*
import { migrations } from '@db/migrations';              // lib/db/*
import { formatDate } from '@utils/date';                 // lib/utils/*
```

**Benefits:**
- No more `../../../lib/utils/helper`
- Cleaner imports
- Easier refactoring
- Auto-completion works perfectly

---

### 4. Testing Infrastructure

#### Unit Testing (Vitest)

**Files Created:**
- `vitest.config.ts` - Vitest configuration with coverage
- `tests/setup.ts` - Global test setup with mocks

**Features:**
- Globals enabled (describe, it, expect without imports)
- JSDOM environment for React component testing
- V8 coverage provider
- Custom matchers (e.g., `toBeValidTimestamp()`)
- Mock D1 database and KV namespace
- Automatic cleanup after each test

**Usage:**
```bash
npm run test              # Watch mode
npm run test:unit         # Single run
npm run test:coverage     # With coverage report
```

#### E2E Testing (Playwright)

**Files Created:**
- `playwright.config.ts` - Multi-browser, multi-device configuration
- `tests/e2e/example.spec.ts` - Example E2E tests

**Features:**
- 6 browser configurations (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari, iPad)
- Mobile-first testing emphasis
- Automatic video/screenshot on failure
- HTML, JSON, and JUnit reporters
- Auto-starts dev server before tests

**Usage:**
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Open Playwright UI
npm run test:e2e -- --project="Mobile Chrome"  # Mobile-specific
```

---

### 5. Code Quality Tools

#### ESLint

**File Created:**
- `.eslintrc.json` - TypeScript-strict linting rules

**Rules:**
- TypeScript recommended + type-aware rules
- No floating promises (catches async/await bugs)
- Warn on `console.log` (allow `console.warn/error`)
- Unused variables with `_` prefix allowed

**Usage:**
```bash
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
```

#### Prettier

**Files Created:**
- `.prettierrc` - Code formatting rules
- `.prettierignore` - Exclude patterns

**Configuration:**
- Single quotes
- Semicolons
- 100-character line width
- 2-space indentation
- Unix line endings (LF)

**Usage:**
```bash
npm run format            # Format all files
npm run format:check      # Verify formatting
```

#### Pre-commit Hooks (Husky)

**Files Created:**
- `.husky/pre-commit` - Git pre-commit hook
- `.lintstagedrc.json` - Lint-staged configuration

**Workflow:**
1. Stage files: `git add .`
2. Commit: `git commit -m "message"`
3. **Automatic pre-commit:**
   - Runs ESLint + auto-fix on staged `.ts/.tsx` files
   - Runs Prettier on staged files
   - Runs TypeScript type check
   - **Blocks commit if any step fails**

**Setup:**
```bash
npm run prepare           # Install Husky hooks (runs after npm install)
```

---

### 6. Makefile Commands

**File Created:**
- `Makefile` - 30+ development commands

**Categories:**

#### Setup & Installation
```bash
make help                 # Show all commands
make setup                # Complete setup (install + env + db)
make install              # Install dependencies only
```

#### Development
```bash
make dev                  # Start Vite dev server (frontend only)
make dev-functions        # Start Wrangler dev server (functions only)
make dev-full             # Start both frontend + functions
make dev-mobile           # Start with ngrok tunnel (mobile testing)
```

#### Testing
```bash
make test                 # Run all tests (unit + integration)
make test-unit            # Unit tests only
make test-e2e             # E2E tests with Playwright
make test-e2e-ui          # E2E tests with Playwright UI
make test-coverage        # Tests with coverage report
```

#### Code Quality
```bash
make lint                 # Run ESLint
make lint-fix             # Auto-fix linting issues
make format               # Format code with Prettier
make format-check         # Check code formatting
make typecheck            # Run TypeScript type checking
make check                # Run all checks (lint + typecheck + test)
```

#### Database
```bash
make db-migrate           # Run D1 migrations locally
make db-migrate-production # Run migrations on production (with confirmation)
make db-seed              # Seed local database with test data
make db-reset             # Reset database (drop all + re-migrate + seed)
```

#### Build & Deploy
```bash
make build                # Build for production
make preview              # Preview production build locally
make deploy               # Deploy to Cloudflare Pages (production)
make deploy-staging       # Deploy to staging environment
```

#### Utilities
```bash
make clean                # Clean build artifacts and caches
make clean-all            # Deep clean (includes node_modules)
make logs                 # Tail Cloudflare Pages logs
make logs-production      # Tail production logs
make update-deps          # Update dependencies to latest
make security-audit       # Run npm security audit
```

---

### 7. Database Schema & Migrations

**Files Created:**
- `lib/db/migrations/001_initial_schema.sql` - Complete database schema
- `scripts/seed.ts` - Database seeding script

**Schema Highlights:**

#### Users & Authentication
- `users` - User profiles with OAuth provider info
- `sessions` - JWT session management

#### College Baseball
- `teams` - Team data (conference, division, venue)
- `players` - Player profiles (position, stats, bio)
- `games` - Game data (home/away, status, scores)
- `batting_stats` - Box score batting lines
- `pitching_stats` - Box score pitching lines

#### Rankings & Standings
- `rankings` - D1Baseball Top 25 rankings
- `standings` - Conference standings with records

#### MLB Integration
- `mlb_teams` - MLB team reference data
- `mlb_games_cache` - Cached MLB game data

#### User Features
- `user_favorites` - User's favorite teams/players
- `api_metrics` - API performance tracking

**Usage:**
```bash
# Local development
npm run db:migrate
npm run db:seed

# Production (use with caution)
npm run db:migrate:production
```

---

### 8. CI/CD Pipeline

**File Created:**
- `.github/workflows/ci.yml` - Automated CI/CD pipeline

**Jobs:**

1. **lint-and-typecheck**
   - ESLint
   - TypeScript type check
   - Prettier format check

2. **test-unit**
   - Vitest unit tests
   - Coverage report
   - Upload to Codecov

3. **test-e2e**
   - Playwright E2E tests (Chromium only for CI)
   - Upload test results as artifacts

4. **build**
   - Production build
   - Verify dist/ directory
   - Upload build artifacts

5. **deploy-staging** (on push to `develop`)
   - Deploy to staging branch
   - Cloudflare Pages deployment

6. **deploy-production** (on push to `main`)
   - Run database migrations
   - Deploy to Cloudflare Pages
   - Notify Sentry of release

**Triggers:**
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

---

### 9. Vite Configuration Enhancements

**File Modified:**
- `vite.config.ts` - Enhanced with aliases and proxy

**Features:**
- Path alias resolution (matches TypeScript paths)
- API proxy: `/api/*` → `http://localhost:8788` (Wrangler dev server)
- External host access enabled (for mobile testing)
- Code splitting: Babylon.js and React in separate chunks
- Source maps enabled for production debugging
- Version constant: `__APP_VERSION__`

---

### 10. Package.json Scripts

**File Modified:**
- `package.json` - 25+ npm scripts added

**New Scripts:**
```json
{
  "dev": "vite --port 5173",
  "dev:functions": "wrangler pages dev dist --port 8788 --live-reload",
  "dev:full": "concurrently \"npm run dev\" \"npm run dev:functions\"",
  "build": "tsc --noEmit && vite build",
  "test": "vitest",
  "test:unit": "vitest run",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:coverage": "vitest run --coverage",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "lint:fix": "eslint . --ext ts,tsx --fix",
  "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\"",
  "typecheck": "tsc --noEmit",
  "db:migrate": "wrangler d1 migrations apply blaze-db --local",
  "db:migrate:production": "wrangler d1 migrations apply blaze-db",
  "db:seed": "tsx scripts/seed.ts",
  "deploy": "wrangler pages deploy dist",
  "deploy:staging": "wrangler pages deploy dist --branch=staging",
  "prepare": "husky install"
}
```

**New Dependencies:**
```json
{
  "devDependencies": {
    "@playwright/test": "^1.48.2",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "@vitest/coverage-v8": "^4.0.8",
    "@vitest/ui": "^4.0.8",
    "concurrently": "^9.1.2",
    "eslint": "^9.17.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.2.11",
    "prettier": "^3.4.2",
    "tsx": "^4.19.2"
  }
}
```

---

### 11. Documentation

**Files Created:**

1. **docs/dev-quickstart.md** (4,500+ words)
   - Prerequisites and installation
   - Development commands (Make + npm)
   - Project structure overview
   - Path aliases guide
   - Common workflows (add API endpoint, database migration, run tests)
   - Mobile development & testing
   - Database management
   - Deployment instructions
   - Environment variables reference
   - Troubleshooting guide
   - VS Code tips
   - Git workflow

2. **docs/architecture.md** (5,000+ words)
   - System overview
   - Architecture diagram
   - Data flow diagrams
   - Database schema reference
   - API design (RESTful endpoints)
   - Caching strategy (3-tier: CDN, KV, D1)
   - Authentication & authorization (JWT + Auth0)
   - Mobile-first design principles
   - Deployment pipeline
   - Monitoring & observability
   - Security considerations
   - Scalability strategy
   - Future enhancements
   - Developer guidelines

3. **docs/DEV_ENVIRONMENT_SETUP.md** (this document)
   - Complete overview of all setup files
   - Usage instructions for each tool
   - Quick reference guide

---

## Quick Start Workflow

### First-Time Setup

```bash
# 1. Navigate to project
cd /Users/AustinHumphrey/Sandlot-Sluggers

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys (Auth0, etc.)

# 4. Initialize database
npm run db:migrate
npm run db:seed

# 5. Start development environment
npm run dev:full
# OR
make dev-full
```

Access:
- Frontend: http://localhost:5173
- API Functions: http://localhost:8788

### Daily Development Workflow

```bash
# Start servers (in separate terminal tabs or use dev-full)
make dev              # Terminal 1: Vite dev server
make dev-functions    # Terminal 2: Wrangler dev server

# Run tests while developing
make test             # Terminal 3: Vitest watch mode

# Before committing
make check            # Lint + typecheck + test
git add .
git commit -m "feat: add feature"  # Pre-commit hooks run automatically
```

### Mobile Testing Workflow

```bash
# Start dev server with ngrok tunnel
make dev-mobile

# Access from your phone using the ngrok URL
# Example: https://abc123.ngrok.io

# Run mobile-specific E2E tests
npm run test:e2e -- --project="Mobile Chrome"
npm run test:e2e -- --project="Mobile Safari"
```

---

## File Structure Summary

```
/Users/AustinHumphrey/Sandlot-Sluggers/
├── .devcontainer/
│   ├── devcontainer.json          # VS Code devcontainer config
│   ├── docker-compose.yml         # Multi-service dev environment
│   └── Dockerfile                 # Custom dev image
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline (lint, test, deploy)
├── .husky/
│   └── pre-commit                 # Git pre-commit hook
├── docs/
│   ├── dev-quickstart.md          # Developer onboarding guide
│   ├── architecture.md            # Technical architecture deep dive
│   └── DEV_ENVIRONMENT_SETUP.md   # This document
├── lib/
│   └── db/
│       └── migrations/
│           └── 001_initial_schema.sql  # Database schema
├── scripts/
│   └── seed.ts                    # Database seeding script
├── tests/
│   ├── e2e/
│   │   └── example.spec.ts        # Example E2E tests
│   └── setup.ts                   # Vitest global setup
├── .env.example                   # Environment variable template (170 lines)
├── .eslintrc.json                 # ESLint configuration
├── .gitignore                     # Updated with test artifacts, etc.
├── .lintstagedrc.json             # Lint-staged config (pre-commit)
├── .prettierrc                    # Prettier config
├── .prettierignore                # Prettier ignore patterns
├── Makefile                       # 30+ development commands
├── package.json                   # Updated with 25+ scripts, new deps
├── playwright.config.ts           # Playwright E2E testing config
├── tsconfig.json                  # TypeScript config with path aliases
├── vite.config.ts                 # Vite config with aliases + proxy
└── vitest.config.ts               # Vitest config with coverage
```

---

## Next Steps

### Immediate Actions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local:
   # - AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET (required)
   # - JWT_SECRET (generate with: openssl rand -base64 32)
   # - Sports API keys (optional for basic features)
   ```

3. **Initialize Database**
   ```bash
   make db-migrate
   make db-seed
   ```

4. **Start Development**
   ```bash
   make dev-full
   ```

5. **Run Tests**
   ```bash
   make test
   ```

### Feature Development

Now that the dev environment is set up, you can proceed with implementing the 5 major features:

1. **College Baseball Box Score Engine**
   - Create `/functions/api/college-baseball/games/[gameId].ts`
   - Implement NCAA Stats API adapter in `/lib/adapters/ncaa-adapter.ts`
   - Add box score React component in `/src/components/CollegeBaseball/BoxScore.tsx`

2. **D1Baseball Rankings**
   - Create `/functions/api/college-baseball/rankings.ts`
   - Implement D1Baseball scraper/API client
   - Add rankings table component

3. **User Authentication**
   - Create `/functions/api/auth/login.ts`, `callback.ts`, `logout.ts`, `me.ts`
   - Implement Auth0 integration in `/lib/auth/auth0.ts`
   - Add JWT middleware in `/lib/auth/middleware.ts`
   - Create login UI components

4. **Mobile-First Design**
   - Set up Tailwind CSS (not yet configured)
   - Create responsive layout components
   - Test on mobile devices (use `make dev-mobile`)
   - Run mobile E2E tests

5. **MLB Real-Time Integration**
   - Create `/functions/api/mlb/games.ts`, `teams.ts`, `standings.ts`
   - Implement MLB Stats API adapter in `/lib/adapters/mlb-adapter.ts`
   - Add live score polling (30s interval)
   - Create MLB dashboard components

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -ti:5173 | xargs kill -9
lsof -ti:8788 | xargs kill -9
```

**Wrangler authentication:**
```bash
wrangler login
wrangler whoami
```

**Database migration failures:**
```bash
# Reset local database
rm -rf .wrangler/state/v3/d1
npm run db:migrate
```

**TypeScript errors after pull:**
```bash
make clean
npm install
npm run build
```

**Pre-commit hooks not running:**
```bash
npm run prepare
git config --get core.hooksPath  # Should show .husky
```

---

## Summary

You now have a **production-grade development environment** with:

- **DevContainer** for consistent environments across team
- **Comprehensive .env.example** with 170+ lines covering all APIs
- **TypeScript path aliases** for cleaner imports
- **Vitest + Playwright** for unit and E2E testing
- **ESLint + Prettier + Husky** for code quality enforcement
- **30+ Makefile commands** for common tasks
- **Database migrations** with D1 schema for all features
- **CI/CD pipeline** with automated testing and deployment
- **Complete documentation** (dev-quickstart.md + architecture.md)

**Everything is ready for rapid feature development across all 5 initiatives.**

Start with:
```bash
make setup
make dev-full
make test
```

Happy coding! 🚀
