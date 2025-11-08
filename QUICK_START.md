# 🚀 BSI-NextGen Quick Start Guide

## ✅ Repository Successfully Set Up!

Your BSI-NextGen platform now includes:

### 📦 **Two Complete Applications**

1. **Next.js Web App** (`packages/web/`) - NEW ✨
   - Mobile-first sports intelligence dashboard
   - Real-time live scores (30-second refresh)
   - Full College Baseball box scores (filling ESPN gap)
   - API routes for all sports data

2. **Vite Sports Dashboard** (`packages/sports-dashboard/`) - EXISTING
   - Fast development with Vite
   - Sports data visualization
   - Odds comparison features

### 🏗️ **Shared Infrastructure**

- `packages/shared/` - TypeScript types and utilities
- `packages/api/` - Sports data adapters (MLB, NFL, NBA, NCAA, College Baseball)

### 📚 **Comprehensive Documentation**

- `docs/INFRASTRUCTURE.md` - 72 Cloudflare Workers mapping
- `docs/OPERATIONAL_RUNBOOKS.md` - Standard operating procedures
- `docs/IMPLEMENTATION_SUMMARY.md` - Full implementation guide

## 🎯 Next Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and add:
# SPORTSDATAIO_API_KEY=your_key_here
```

### 3. Build All Packages

```bash
pnpm build
```

### 4. Run Development Server

**Option A: Next.js Web App (Recommended)**
```bash
pnpm dev
# Visit http://localhost:3000
```

**Option B: Vite Sports Dashboard**
```bash
pnpm --filter @bsi/sports-dashboard dev
```

## 🔑 Required API Keys

- **SPORTSDATAIO_API_KEY** - Get from https://sportsdata.io
  - Required for NFL and NBA data
  - Free trial available
  - MLB uses free MLB Stats API (no key needed)

## 🚢 Deployment Options

### GitHub Actions (Automated)
- Automatically deploys on push to `main`
- Runs tests and linting
- Deploys to both Netlify and Vercel

### Manual Deployment

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 📊 Available Scripts

```bash
pnpm build              # Build all packages
pnpm dev                # Start Next.js dev server
pnpm dev:api            # Start API dev server
pnpm lint               # Run ESLint
pnpm format             # Format code with Prettier
pnpm type-check         # Run TypeScript checks
pnpm clean              # Clean all build artifacts
```

## 🏀 Sports Coverage

1. **College Baseball** 🔥 - PRIORITY
   - Full box scores (batting + pitching lines)
   - Game recaps and previews
   - Conference standings
   - **Fills the ESPN gap**

2. **MLB** - Real-time scores from official API
3. **NFL** - Live games via SportsDataIO
4. **NBA** - Live scores via SportsDataIO
5. **NCAA Football** - ESPN public API

## 🌐 API Endpoints

All endpoints available at `/api/sports/{sport}/{endpoint}`:

```
GET /api/sports/mlb/games
GET /api/sports/mlb/standings
GET /api/sports/nfl/games?week=1
GET /api/sports/nba/games?date=2025-01-10
GET /api/sports/college_baseball/games  # 🔥 Full box scores!
```

## 📱 Mobile-First Design

The platform is optimized for mobile:
- Responsive Tailwind CSS
- Touch-friendly UI
- Fast loading on 4G
- Auto-refresh for live games

## 🆘 Troubleshooting

**Build fails?**
- Check Node.js version (>=18.0.0)
- Run `pnpm clean && pnpm install`

**API returns errors?**
- Verify `SPORTSDATAIO_API_KEY` is set
- Check API key is active at sportsdata.io

**Deployment fails?**
- Review [DEPLOYMENT.md](./DEPLOYMENT.md)
- Check environment variables in platform dashboard

## 🎉 You're Ready!

Your platform is production-ready with:
- ✅ Real sports data (no placeholders)
- ✅ Mobile-first design
- ✅ CI/CD pipeline
- ✅ Comprehensive documentation
- ✅ Dual deployment options

**Start building:** `pnpm dev`

---

**Built with real data. No placeholders. Mobile-first.**

Blaze Sports Intel © 2025
