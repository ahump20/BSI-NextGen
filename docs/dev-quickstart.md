# Blaze Sports Intel - Developer Quickstart

**Get from zero to productive in 5 minutes.**

## Prerequisites

- **Node.js 20+** (verify: `node --version`)
- **npm 10+** (verify: `npm --version`)
- **Git** (verify: `git --version`)
- **Cloudflare Account** (for deployment)

Optional but recommended:
- **Docker** (for devcontainer)
- **VS Code** (with recommended extensions)

---

## Quick Start (Local Development)

### 1. Clone and Install

```bash
cd /Users/AustinHumphrey/Sandlot-Sluggers
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your API keys
# Required: AUTH0_DOMAIN, AUTH0_CLIENT_ID, SPORTSDATAIO_API_KEY (optional for now)
open .env.local
```

### 3. Initialize Database

```bash
# Run migrations locally
npm run db:migrate

# Seed with test data
npm run db:seed
```

### 4. Start Development Servers

```bash
# Option A: Full stack (frontend + functions)
npm run dev:full

# Option B: Frontend only
npm run dev

# Option C: Functions only
npm run dev:functions
```

**Access:**
- Frontend: http://localhost:5173
- Functions API: http://localhost:8788

---

## Using Make Commands (Recommended)

We provide a comprehensive Makefile for common tasks:

```bash
# See all available commands
make help

# Complete setup (install + env + db)
make setup

# Start full dev environment
make dev-full

# Run tests
make test

# Lint and format code
make check

# Deploy to production
make deploy
```

---

## Project Structure

```
Sandlot-Sluggers/
├── functions/              # Cloudflare Functions (API routes)
│   └── api/
│       ├── college-baseball/
│       ├── mlb/
│       └── auth/
├── src/                    # Frontend (Vite + React + Babylon.js)
│   ├── components/
│   ├── pages/
│   └── main.ts
├── lib/                    # Shared libraries
│   ├── adapters/          # Data adapters (NCAA, MLB, etc.)
│   ├── api/               # API clients
│   ├── auth/              # Authentication logic
│   ├── db/                # Database schemas & migrations
│   └── utils/             # Utilities
├── tests/
│   ├── e2e/               # Playwright E2E tests
│   └── *.test.ts          # Vitest unit tests
├── scripts/               # Build & utility scripts
├── .devcontainer/         # VS Code devcontainer config
└── docs/                  # Documentation
```

---

## Path Aliases (TypeScript)

Use clean imports with path aliases:

```typescript
// Instead of:
import { fetchMLB } from '../../../lib/api/mlb';

// Use:
import { fetchMLB } from '@api/mlb';
```

Available aliases:
- `@/*` → `src/*`
- `@lib/*` → `lib/*`
- `@api/*` → `lib/api/*`
- `@adapters/*` → `lib/adapters/*`
- `@utils/*` → `lib/utils/*`
- `@auth/*` → `lib/auth/*`
- `@db/*` → `lib/db/*`

---

## Common Development Workflows

### Adding a New API Endpoint

1. Create function file:
```bash
touch functions/api/college-baseball/teams.ts
```

2. Implement handler:
```typescript
// functions/api/college-baseball/teams.ts
import { Env } from '@cloudflare/workers-types';

export async function onRequest(context: { env: Env; params: Record<string, string> }) {
  const { env } = context;

  const teams = await env.DB.prepare('SELECT * FROM teams').all();

  return new Response(JSON.stringify(teams), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

3. Test locally:
```bash
curl http://localhost:8788/api/college-baseball/teams
```

### Adding a Database Migration

1. Create migration file:
```bash
touch lib/db/migrations/002_add_player_stats.sql
```

2. Write SQL:
```sql
-- lib/db/migrations/002_add_player_stats.sql
CREATE TABLE player_season_stats (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id),
  season INTEGER NOT NULL,
  avg REAL,
  era REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

3. Apply migration:
```bash
npm run db:migrate
```

### Running Tests

```bash
# Unit tests (watch mode)
npm run test

# Unit tests (single run)
npm run test:unit

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# Coverage report
npm run test:coverage
```

### Code Quality Checks

```bash
# Lint
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck

# Run all checks
make check
```

---

## Mobile Development & Testing

### Local Mobile Testing (via ngrok)

```bash
# Install ngrok (if not already)
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start dev server with public URL
make dev-mobile
# or
npx ngrok http 5173
```

Access from your phone using the ngrok URL.

### Playwright Mobile Tests

```bash
# Run mobile-specific tests
npm run test:e2e -- --project="Mobile Chrome"

# Run iPad tests
npm run test:e2e -- --project="iPad"
```

---

## Database Management

### Local Database (D1)

```bash
# Apply migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Reset database (drop all tables + re-migrate + seed)
make db-reset

# Query database (interactive)
wrangler d1 execute blaze-db --local --command="SELECT * FROM teams"
```

### Production Database

```bash
# Apply migrations to production (USE WITH CAUTION)
make db-migrate-production

# Query production database
wrangler d1 execute blaze-db --command="SELECT COUNT(*) FROM users"
```

---

## Deployment

### Staging Deployment

```bash
# Deploy to staging branch
make deploy-staging
# or
npm run deploy:staging
```

### Production Deployment

```bash
# Build and deploy
make deploy
# or
npm run build && npm run deploy
```

### Manual Deployment Steps

```bash
# 1. Build
npm run build

# 2. Preview locally
npm run preview

# 3. Deploy to Cloudflare Pages
wrangler pages deploy dist
```

---

## Environment Variables

### Required for Development

```bash
# Auth0 (for authentication)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret
```

### Optional (for full features)

```bash
# Sports Data APIs
SPORTSDATAIO_API_KEY=your_key          # Paid, comprehensive
NCAA_STATS_API_KEY=your_key            # NCAA data
D1BASEBALL_API_KEY=your_key            # D1 rankings

# MLB Stats API (free, no key needed)
MLB_STATS_BASE_URL=https://statsapi.mlb.com/api/v1

# Error tracking
VITE_SENTRY_DSN=your_sentry_dsn
```

See `.env.example` for complete list.

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Kill process on port 8788
lsof -ti:8788 | xargs kill -9
```

### Wrangler Authentication Issues

```bash
# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

### Database Migration Failures

```bash
# Check migration status
wrangler d1 migrations list blaze-db --local

# Reset local database
rm -rf .wrangler/state/v3/d1
npm run db:migrate
```

### TypeScript Errors After Pull

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Tests Failing

```bash
# Clear test cache
rm -rf coverage .vitest

# Re-run tests
npm run test:unit
```

---

## VS Code Tips

### Recommended Extensions

Install all recommended extensions:
1. Open Command Palette (`Cmd+Shift+P`)
2. Run: `Extensions: Show Recommended Extensions`
3. Click "Install All Workspace Recommendations"

### Keyboard Shortcuts

- **Run Tests**: `Cmd+Shift+T` (with Jest Runner extension)
- **Format Document**: `Shift+Alt+F`
- **Organize Imports**: `Shift+Alt+O`
- **Open Terminal**: `Ctrl+` `

---

## Git Workflow

### Pre-commit Hooks

Husky runs automatically before each commit:
- Lints staged files
- Formats code
- Type checks

To bypass (not recommended):
```bash
git commit --no-verify
```

### Commit Message Format

Follow conventional commits:
```bash
git commit -m "feat: add college baseball box scores"
git commit -m "fix: resolve mobile layout issue"
git commit -m "docs: update API documentation"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## Getting Help

- **Documentation**: `/docs` directory
- **API Docs**: http://localhost:8788/api/docs (when running)
- **GitHub Issues**: Report bugs and request features
- **Slack**: #blaze-sports-intel (internal)

---

## Next Steps

1. **Explore Codebase**: Start with `/functions/api/health.ts` (simplest endpoint)
2. **Run Tests**: `make test` to understand test patterns
3. **Add Feature**: Pick a task from GitHub Issues
4. **Deploy**: `make deploy-staging` to see your changes live

**Happy coding!** 🚀
