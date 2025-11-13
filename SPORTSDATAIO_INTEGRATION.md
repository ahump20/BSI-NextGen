# SportsDataIO Integration Guide

This guide provides complete instructions for integrating live sports data from SportsDataIO into the BSI-NextGen platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Getting Your API Key](#getting-your-api-key)
4. [Configuration](#configuration)
5. [Testing the Integration](#testing-the-integration)
6. [Available Adapters](#available-adapters)
7. [API Endpoints](#api-endpoints)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Rate Limits and Pricing](#rate-limits-and-pricing)

---

## Overview

**SportsDataIO** provides real-time sports data APIs for NFL and NBA. The BSI-NextGen platform uses SportsDataIO to deliver live game scores, standings, and team information.

### Features

- **Real-time game data** - Live scores, status updates, and play-by-play
- **Team information** - Complete team rosters, logos, and statistics
- **Standings** - Current season standings with win/loss records
- **Historical data** - Access to past seasons and games
- **High reliability** - 99.9% uptime SLA

### Supported Sports

- 🏈 **NFL** - National Football League
- 🏀 **NBA** - National Basketball Association

---

## Quick Start

### 1. Install Dependencies

All dependencies are already included in the monorepo. Run:

```bash
pnpm install
pnpm build
```

### 2. Get Your API Key

Visit [https://sportsdata.io/](https://sportsdata.io/) and sign up for a free account. See [Getting Your API Key](#getting-your-api-key) for detailed instructions.

### 3. Configure Environment

Add your API key to `.env`:

```bash
SPORTSDATAIO_API_KEY=your_actual_api_key_here
```

### 4. Test the Integration

Run the test script to verify everything is working:

```bash
pnpm tsx scripts/test-sportsdataio.ts
```

You should see output confirming successful connections to NFL and NBA APIs.

---

## Getting Your API Key

### Step-by-Step Instructions

1. **Visit SportsDataIO**
   - Go to [https://sportsdata.io/](https://sportsdata.io/)

2. **Create an Account**
   - Click "Sign Up" in the top right
   - Fill in your email, name, and password
   - Verify your email address

3. **Access Your Dashboard**
   - Log in to your account
   - Navigate to the Dashboard

4. **Find Your API Key**
   - Look for "API Keys" in the left sidebar or top navigation
   - Copy your API key (it will look like: `a1b2c3d4e5f6g7h8i9j0...`)

5. **Choose Your Plan**
   - **Free Trial**: 1,000 requests per month (good for development)
   - **Developer**: $19/month, 10,000 requests
   - **Starter**: $49/month, 25,000 requests
   - See [Rate Limits and Pricing](#rate-limits-and-pricing) for more details

### Free Tier Details

The free tier includes:
- ✅ 1,000 API requests per month
- ✅ Access to NFL and NBA data
- ✅ Real-time game scores
- ✅ Historical data
- ⚠️ Rate limit: 1 request per second
- ⚠️ No commercial use

---

## Configuration

### Environment Variables

The platform uses environment variables to securely store your API key.

#### Development (.env file)

Create or edit `.env` in the project root:

```bash
# Required for NFL and NBA live data
SPORTSDATAIO_API_KEY=your_actual_api_key_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node environment
NODE_ENV=development
```

**Important:**
- Never commit `.env` to version control (it's already in `.gitignore`)
- Replace `your_actual_api_key_here` with your real API key
- Keep your API key secret

#### Production (Deployment)

For production deployments (Netlify, Vercel, Cloudflare):

1. Go to your deployment platform's dashboard
2. Navigate to Environment Variables or Settings
3. Add a new variable:
   - **Name**: `SPORTSDATAIO_API_KEY`
   - **Value**: Your actual API key
   - **Scope**: Production (and Preview if needed)

See [Deployment](#deployment) section for platform-specific instructions.

---

## Testing the Integration

### Automated Test Script

We provide a comprehensive test script to verify your integration:

```bash
pnpm tsx scripts/test-sportsdataio.ts
```

#### Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║      SportsDataIO Integration Test Suite                  ║
╚═══════════════════════════════════════════════════════════╝

📊 Testing NFL Adapter...
  → Fetching NFL teams...
  ✓ Fetched 32 teams
    Sample: Arizona Cardinals (ARI)
  → Fetching NFL standings (2025 season)...
  ✓ Fetched 32 team standings
    Sample: Kansas City Chiefs - 14W 3L
  → Fetching NFL games (2025, Week 1)...
  ✓ Fetched 16 games
    Sample: BUF @ KC - final
✅ NFL Adapter: All tests passed!

🏀 Testing NBA Adapter...
  → Fetching NBA teams...
  ✓ Fetched 30 teams
    Sample: Atlanta Hawks (ATL)
  → Fetching NBA standings (2025 season)...
  ✓ Fetched 30 team standings
    Sample: Boston Celtics - 45W 12L
  → Fetching NBA games (today)...
  ✓ Fetched 8 games for 2025-01-13
    Sample: LAL @ BOS - live
✅ NBA Adapter: All tests passed!

════════════════════════════════════════════════════════════
Test Summary:
  NFL Adapter: ✅ PASSED
  NBA Adapter: ✅ PASSED

🎉 All tests passed! SportsDataIO integration is working correctly.
   You can now use live sports data in your application.
```

### Manual API Testing

You can also test the API endpoints directly:

#### Test NFL Games API

```bash
curl "http://localhost:3000/api/sports/nfl/games?season=2025&week=1"
```

#### Test NBA Games API

```bash
curl "http://localhost:3000/api/sports/nba/games?date=2025-01-13"
```

#### Test NFL Teams API

```bash
curl "http://localhost:3000/api/sports/nfl/teams"
```

#### Test NBA Standings API

```bash
curl "http://localhost:3000/api/sports/nba/standings?season=2025"
```

---

## Available Adapters

### NFLAdapter

The `NFLAdapter` provides access to NFL data via SportsDataIO.

#### Location
`packages/api/src/adapters/nfl.ts`

#### Usage

```typescript
import { NFLAdapter } from '@bsi/api';

const adapter = new NFLAdapter(process.env.SPORTSDATAIO_API_KEY);

// Get all NFL teams
const teams = await adapter.getTeams();

// Get current season standings
const standings = await adapter.getStandings(2025);

// Get games for specific week
const games = await adapter.getGames({ season: 2025, week: 1 });
```

#### Methods

**`getTeams(): Promise<ApiResponse<Team[]>>`**
- Returns all 32 NFL teams
- Includes team name, abbreviation, logo, division, conference

**`getStandings(season?: number): Promise<ApiResponse<Standing[]>>`**
- Returns current standings for the season
- Default season: 2025
- Includes wins, losses, win percentage, streak

**`getGames(params?: { season?: number; week?: number }): Promise<ApiResponse<Game[]>>`**
- Returns games for specified week
- Default: 2025 season, week 1
- Includes scores, status, teams, venue

#### Response Format

```typescript
{
  data: [...],  // Array of teams/games/standings
  source: {
    provider: 'SportsDataIO',
    timestamp: '2025-01-13T15:30:00.000Z',
    confidence: 1.0
  }
}
```

### NBAAdapter

The `NBAAdapter` provides access to NBA data via SportsDataIO.

#### Location
`packages/api/src/adapters/nba.ts`

#### Usage

```typescript
import { NBAAdapter } from '@bsi/api';

const adapter = new NBAAdapter(process.env.SPORTSDATAIO_API_KEY);

// Get all NBA teams
const teams = await adapter.getTeams();

// Get current season standings
const standings = await adapter.getStandings('2025');

// Get games for specific date
const games = await adapter.getGames('2025-01-13');
```

#### Methods

**`getTeams(): Promise<ApiResponse<Team[]>>`**
- Returns all 30 NBA teams
- Includes team name, abbreviation, logo, conference, division

**`getStandings(season?: string): Promise<ApiResponse<Standing[]>>`**
- Returns current standings for the season
- Default season: '2025'
- Includes wins, losses, win percentage, games back, streak

**`getGames(date?: string): Promise<ApiResponse<Game[]>>`**
- Returns games for specified date
- Default: today's date
- Format: YYYY-MM-DD
- Includes scores, status, teams, venue

#### Response Format

Same as NFLAdapter - see above.

---

## API Endpoints

### NFL Endpoints

All NFL endpoints are prefixed with `/api/sports/nfl/`

#### GET /api/sports/nfl/games

Get NFL games for a specific week.

**Query Parameters:**
- `season` (optional): Year (default: 2025)
- `week` (optional): Week number 1-18 (default: 1)

**Example:**
```bash
GET /api/sports/nfl/games?season=2025&week=1
```

**Response:**
```json
{
  "data": [
    {
      "id": "2025010900",
      "sport": "NFL",
      "date": "2025-01-09T20:15:00Z",
      "status": "final",
      "homeTeam": {
        "id": "12",
        "name": "Kansas City Chiefs",
        "abbreviation": "KC"
      },
      "awayTeam": {
        "id": "2",
        "name": "Buffalo Bills",
        "abbreviation": "BUF"
      },
      "homeScore": 27,
      "awayScore": 24,
      "period": "Q4",
      "venue": "Arrowhead Stadium"
    }
  ],
  "source": {
    "provider": "SportsDataIO",
    "timestamp": "2025-01-13T15:30:00.000Z",
    "confidence": 1.0
  }
}
```

#### GET /api/sports/nfl/standings

Get NFL standings for current season.

**Query Parameters:**
- `season` (optional): Year (default: 2025)

**Example:**
```bash
GET /api/sports/nfl/standings?season=2025
```

#### GET /api/sports/nfl/teams

Get all NFL teams.

**Example:**
```bash
GET /api/sports/nfl/teams
```

### NBA Endpoints

All NBA endpoints are prefixed with `/api/sports/nba/`

#### GET /api/sports/nba/games

Get NBA games for a specific date.

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format (default: today)

**Example:**
```bash
GET /api/sports/nba/games?date=2025-01-13
```

**Response:**
```json
{
  "data": [
    {
      "id": "20250113010",
      "sport": "NBA",
      "date": "2025-01-13T19:00:00Z",
      "status": "live",
      "homeTeam": {
        "id": "2",
        "name": "Boston Celtics",
        "abbreviation": "BOS"
      },
      "awayTeam": {
        "id": "13",
        "name": "Los Angeles Lakers",
        "abbreviation": "LAL"
      },
      "homeScore": 98,
      "awayScore": 95,
      "period": "Q3",
      "venue": "TD Garden"
    }
  ],
  "source": {
    "provider": "SportsDataIO",
    "timestamp": "2025-01-13T20:15:00.000Z",
    "confidence": 1.0
  }
}
```

#### GET /api/sports/nba/standings

Get NBA standings for current season.

**Query Parameters:**
- `season` (optional): Year (default: '2025')

**Example:**
```bash
GET /api/sports/nba/standings?season=2025
```

#### GET /api/sports/nba/teams

Get all NBA teams.

**Example:**
```bash
GET /api/sports/nba/teams
```

### Caching Strategy

All API endpoints implement intelligent caching:

- **Live games**: 30 seconds cache (fast updates during games)
- **Scheduled/final games**: 5 minutes cache (less frequent updates needed)
- **Teams/standings**: 10 minutes cache (static data)

Caching headers:
```
Cache-Control: public, max-age=300, s-maxage=600
```

---

## Deployment

### Netlify

1. **Environment Variables**
   - Go to Site Settings → Environment variables
   - Add `SPORTSDATAIO_API_KEY` with your API key
   - Scope: Production, Deploy Previews (optional)

2. **Build Settings**
   - Build command: `pnpm build`
   - Publish directory: `packages/web/.next`
   - Node version: 18 or higher

3. **Deploy**
   - Push to `main` branch for automatic deployment
   - Or use Netlify CLI: `netlify deploy --prod`

### Vercel

1. **Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add `SPORTSDATAIO_API_KEY` with your API key
   - Environment: Production, Preview (optional)

2. **Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `packages/web`
   - Build Command: `cd ../.. && pnpm build`
   - Install Command: `pnpm install`

3. **Deploy**
   - Push to `main` branch for automatic deployment
   - Or use Vercel CLI: `vercel --prod`

### Cloudflare Pages

1. **Environment Variables**
   - Go to Workers & Pages → Your Project → Settings
   - Add `SPORTSDATAIO_API_KEY` under Environment Variables
   - Environment: Production

2. **Build Settings**
   - Build command: `pnpm build`
   - Build output directory: `packages/web/.next`
   - Root directory: `/`

3. **Deploy**
   - Connect your GitHub repository
   - Cloudflare will auto-deploy on push

---

## Troubleshooting

### Common Issues

#### "API key not configured" Error

**Problem:** The adapter cannot find your API key.

**Solution:**
1. Verify `.env` file exists in project root
2. Check that `SPORTSDATAIO_API_KEY` is set correctly
3. Make sure you're not using the placeholder value
4. Restart your development server

```bash
# Check if .env exists
cat .env | grep SPORTSDATAIO_API_KEY

# Should output something like:
# SPORTSDATAIO_API_KEY=abc123...

# If not, edit .env and add your key
```

#### "401 Unauthorized" Error

**Problem:** Your API key is invalid or expired.

**Solution:**
1. Log in to [sportsdata.io](https://sportsdata.io/)
2. Verify your API key in the dashboard
3. Check if your subscription is active
4. Try copying the API key again

#### "429 Too Many Requests" Error

**Problem:** You've exceeded your rate limit.

**Solution:**
1. Check your current usage at [sportsdata.io dashboard](https://sportsdata.io/cart/my-account)
2. Free tier: max 1,000 requests/month
3. Wait for rate limit to reset (resets monthly)
4. Upgrade your plan if needed

#### "Network Error" or Timeout

**Problem:** Cannot connect to SportsDataIO servers.

**Solution:**
1. Check your internet connection
2. Verify SportsDataIO status: [status.sportsdata.io](https://status.sportsdata.io)
3. Check if firewall/proxy is blocking requests
4. Try again in a few minutes

#### No Games Returned

**Problem:** API call succeeds but returns empty array.

**Solution:**
This is expected! It means:
- **NFL**: No games scheduled for that week (off-season)
- **NBA**: No games scheduled for that date (off-day)
- Try a different date/week with known games

#### Test Script Fails

**Problem:** `pnpm tsx scripts/test-sportsdataio.ts` shows errors.

**Solution:**
1. Make sure all packages are built: `pnpm build`
2. Check API key is configured
3. Verify network connection
4. Run with verbose logging:
   ```bash
   DEBUG=* pnpm tsx scripts/test-sportsdataio.ts
   ```

### Getting Help

If you continue to experience issues:

1. **Check SportsDataIO Documentation**: [docs.sportsdata.io](https://docs.sportsdata.io)
2. **Contact SportsDataIO Support**: support@sportsdata.io
3. **File an Issue**: [GitHub Issues](https://github.com/ahump20/BSI-NextGen/issues)
4. **Community Discord**: [Join our Discord](#) (if available)

---

## Rate Limits and Pricing

### Free Trial

- **Cost**: $0/month
- **Requests**: 1,000/month
- **Rate Limit**: 1 request/second
- **Best For**: Development, testing, personal projects

### Developer Plan

- **Cost**: $19/month
- **Requests**: 10,000/month
- **Rate Limit**: 2 requests/second
- **Best For**: Small apps, MVPs, side projects

### Starter Plan

- **Cost**: $49/month
- **Requests**: 25,000/month
- **Rate Limit**: 5 requests/second
- **Best For**: Production apps with moderate traffic

### Pro Plan

- **Cost**: $149/month
- **Requests**: 100,000/month
- **Rate Limit**: 10 requests/second
- **Best For**: High-traffic production apps

### Enterprise

- **Cost**: Custom pricing
- **Requests**: Unlimited
- **Rate Limit**: Custom
- **Best For**: Large-scale applications, white-label solutions
- **Contact**: sales@sportsdata.io

### Calculating Your Needs

Estimate monthly requests based on your traffic:

```
Monthly Requests = (Pageviews/Month) × (API Calls/Page) × (Cache Miss Rate)

Example:
- 10,000 pageviews/month
- 3 API calls per page (games, standings, teams)
- 30% cache miss rate (70% served from cache)

10,000 × 3 × 0.3 = 9,000 requests/month
→ Developer Plan ($19/month) would be sufficient
```

### Monitoring Usage

Check your current usage:
1. Log in to [sportsdata.io](https://sportsdata.io/)
2. Go to Dashboard → Usage
3. View daily/monthly request counts
4. Set up email alerts for usage thresholds

---

## Additional Resources

- **SportsDataIO Website**: [https://sportsdata.io/](https://sportsdata.io/)
- **API Documentation**: [https://docs.sportsdata.io/](https://docs.sportsdata.io/)
- **Status Page**: [https://status.sportsdata.io/](https://status.sportsdata.io/)
- **Support**: support@sportsdata.io

### Project Documentation

- [CLAUDE.md](./CLAUDE.md) - Full project documentation
- [README.md](./README.md) - Project overview
- [QUICK_START.md](./QUICK_START.md) - Getting started guide

### Related Files

- `.env.example` - Environment variable template
- `packages/api/src/adapters/nfl.ts` - NFL adapter implementation
- `packages/api/src/adapters/nba.ts` - NBA adapter implementation
- `scripts/test-sportsdataio.ts` - Integration test script

---

## Summary

You now have complete integration with SportsDataIO! 🎉

**Key Takeaways:**
- Add your API key to `.env`
- Run `pnpm tsx scripts/test-sportsdataio.ts` to verify
- Use the adapters in your code: `NFLAdapter` and `NBAAdapter`
- API endpoints are available at `/api/sports/nfl/*` and `/api/sports/nba/*`
- Monitor your usage to stay within rate limits
- Deploy with confidence using environment variables

**Next Steps:**
1. Get your API key from [sportsdata.io](https://sportsdata.io/)
2. Add it to your `.env` file
3. Run the test script to verify
4. Start building amazing sports features!

Happy coding! 🏈🏀
