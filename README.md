# BSI-NextGen - Blaze Sports Intel Platform

A professional sports intelligence platform with **real-time data** from official APIs. Mobile-first. No placeholders.

## 🔥 Key Features

- **Real Sports Data**: MLB Stats API, SportsDataIO for NFL/NBA, ESPN for NCAA
- **College Baseball Priority**: Full box scores, batting/pitching lines - **filling the ESPN gap**
- **User Authentication**: OAuth 2.0 with Auth0, JWT sessions, role-based access control
- **Mobile-First Design**: Optimized for phones and tablets
- **Real-Time Updates**: Live scores refresh every 30 seconds
- **Professional Architecture**: TypeScript monorepo with pnpm workspaces

## 🏗️ Architecture

```
bsi-nextgen/
├── packages/
│   ├── shared/          # Shared types and utilities
│   ├── api/             # Sports data adapters (MLB, NFL, NBA, NCAA, College Baseball)
│   └── web/             # Next.js web application
├── .github/workflows/   # CI/CD with GitHub Actions
├── netlify.toml         # Netlify deployment config
└── vercel.json          # Vercel deployment config
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- SportsDataIO API key (required for NFL/NBA data)

### Installation

```bash
# Clone the repository
git clone https://github.com/ahump20/BSI-NextGen.git
cd BSI-NextGen

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys (see Authentication Setup below)

# Build all packages
pnpm build

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the app.

### Authentication Setup

1. **Create Auth0 Account** (free tier available)
   - Go to https://auth0.com/ and sign up
   - Create a new tenant

2. **Create Auth0 Application**
   - In Auth0 Dashboard, go to Applications → Applications
   - Click "Create Application"
   - Choose "Regular Web Application"
   - Name it "BSI-NextGen"

3. **Configure Application Settings**
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
   - Save changes

4. **Copy Credentials to .env**
   ```bash
   AUTH0_DOMAIN=your-tenant.us.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   AUTH0_AUDIENCE=https://your-api-audience
   JWT_SECRET=your-random-secret  # Generate with: openssl rand -base64 32
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Add SportsDataIO API Key** (for NFL/NBA data)
   - Get from https://sportsdata.io/
   ```bash
   SPORTSDATAIO_API_KEY=your_sportsdataio_api_key
   ```

6. **Restart Development Server**
   ```bash
   pnpm dev
   ```

## 📦 Packages

### `@bsi/shared`
Shared TypeScript types and utilities used across all packages.

- Common types (Team, Game, Standing, AuthUser, etc.)
- Utility functions (date formatting, win percentage calculations)
- America/Chicago timezone support
- Authentication types and interfaces

### `@bsi/api`
Sports data adapters and authentication utilities.

- **MLBAdapter**: MLB Stats API (free, official)
- **NFLAdapter**: SportsDataIO (requires API key)
- **NBAAdapter**: SportsDataIO (requires API key)
- **NCAAAdapter**: ESPN API + enhanced box scores
- **D1BaseballAdapter**: D1Baseball rankings and standings
- **Auth0Client**: OAuth 2.0 authentication flow
- **JWT utilities**: Session token creation and verification

### `@bsi/web`
Next.js web application with mobile-first UI.

- Homepage with sports dashboard
- College baseball box scores and standings
- User authentication (login, profile, protected routes)
- Real-time game updates
- Responsive design with Tailwind CSS
- API routes for sports data and authentication

## 🎯 Sports Coverage Priority

1. **College Baseball** 🔥 - Complete box scores (ESPN gap filler)
2. **MLB** - Real-time scores and standings
3. **NFL** - Live games and team stats
4. **NCAA Football** - Conference standings and scores
5. **NBA** - Live scores and standings

## 🔧 Development

```bash
# Start web dev server
pnpm dev

# Start API dev server (TypeScript watch mode)
pnpm dev:api

# Run linting
pnpm lint

# Format code
pnpm format

# Clean all build artifacts
pnpm clean
```

## 📚 Documentation

### Quick Start
- [IMPLEMENTATION_SUMMARY.md](./docs/IMPLEMENTATION_SUMMARY.md) - **START HERE** - Overview of all implementation guides and roadmap

### Infrastructure & Architecture
- [INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) - Complete infrastructure mapping of BlazeSportsIntel.com
  - 72 Cloudflare Workers across 10 functional layers
  - 18 D1 databases (81.5MB primary)
  - 20+ KV stores for caching
  - Architecture diagrams and data flows

### Implementation Guides
- [R2_STORAGE_SETUP.md](./docs/R2_STORAGE_SETUP.md) - **HIGH PRIORITY** - Enable R2 storage for media/file assets
- [HYPERDRIVE_SETUP.md](./docs/HYPERDRIVE_SETUP.md) - **MEDIUM PRIORITY** - Configure database connection pooling
- [DATABASE_MONITORING.md](./docs/DATABASE_MONITORING.md) - Implement database growth monitoring and alerting

### Operations
- [OPERATIONAL_RUNBOOKS.md](./docs/OPERATIONAL_RUNBOOKS.md) - Standard operating procedures
  - Worker deployment procedures
  - Database operations and migrations
  - Incident response playbooks
  - Performance troubleshooting
  - Backup and recovery procedures
  - Security protocols

### Deployment Guides
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Netlify/Vercel deployment procedures and troubleshooting

## 🚢 Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard:
   - `SPORTSDATAIO_API_KEY`
3. Deploy automatically on push to `main` branch

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `SPORTSDATAIO_API_KEY`
3. Deploy automatically on push to `main` branch

### GitHub Actions

CI/CD pipeline automatically:
- Runs tests and linting on all PRs
- Deploys to Netlify and Vercel on merge to `main`

## 📊 API Endpoints

### Sports Data

```
# College Baseball (PRIORITY - Complete box scores)
GET /api/sports/college-baseball/games?date=2025-01-10
GET /api/sports/college-baseball/games/[gameId]
GET /api/sports/college-baseball/rankings?week=1
GET /api/sports/college-baseball/standings?conference=ACC

# MLB
GET /api/sports/mlb/games?date=2025-01-10
GET /api/sports/mlb/standings?divisionId=200
GET /api/sports/mlb/teams

# NFL
GET /api/sports/nfl/games?week=1&season=2025
GET /api/sports/nfl/standings?season=2025
GET /api/sports/nfl/teams

# NBA
GET /api/sports/nba/games?date=2025-01-10
GET /api/sports/nba/standings
GET /api/sports/nba/teams

# NCAA Football
GET /api/sports/ncaa_football/games?week=1
GET /api/sports/ncaa_football/standings?conference=12
```

### Authentication

```
# Initiate OAuth login flow
GET /api/auth/login?returnTo=/profile

# OAuth callback (handled by Auth0)
GET /api/auth/callback?code=xxx&state=xxx

# Get current authenticated user
GET /api/auth/me

# Logout and clear session
GET /api/auth/logout?returnTo=/
```

## 🔐 Environment Variables

Copy `.env.example` to `.env`:

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Authentication (Auth0)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://your-api-audience
JWT_SECRET=your-random-secret

# Sports Data
SPORTSDATAIO_API_KEY=your_sportsdataio_key
D1BASEBALL_API_URL=https://d1baseball.com/api  # Optional
```

See `.env.example` for detailed configuration options and deployment notes.

## 🎨 Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Deployment**: Netlify, Vercel
- **CI/CD**: GitHub Actions

## 📝 Data Sources

- **MLB**: Official MLB Stats API (free)
- **NFL**: SportsDataIO (paid API)
- **NBA**: SportsDataIO (paid API)
- **NCAA Football**: ESPN public API
- **College Baseball**: ESPN public API + enhanced box scores

All timestamps in **America/Chicago** timezone.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🧪 Testing

### Mobile Regression Tests

Prevent mobile performance degradation with automated testing:

```bash
# Create performance baseline
.claude/tests/mobile-regression.sh --create-baseline

# Run performance regression tests
.claude/tests/mobile-regression.sh --performance

# Run visual regression tests with Playwright
npx playwright test tests/mobile-visual-regression.spec.ts

# Run all regression tests
.claude/tests/mobile-regression.sh --all
```

### Playwright Tests

```bash
# Install Playwright browsers
npx playwright install

# Run all tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# Show test report
npx playwright show-report
```

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- MLB Stats API for free, official baseball data
- SportsDataIO for comprehensive NFL/NBA coverage
- ESPN for college sports data
- All the developers building real sports data tools

---

**Built with real data. No placeholders. Mobile-first.**

Blaze Sports Intel © 2025