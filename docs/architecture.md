# Blaze Sports Intel - Technical Architecture

## System Overview

**Blaze Sports Intel** is a mobile-first sports analytics platform built on Cloudflare's edge computing infrastructure, delivering real-time college baseball, MLB, and multi-sport data with advanced 3D visualizations.

### Technology Stack

- **Frontend**: Vite + React 19 + TypeScript + Babylon.js (3D)
- **Backend**: Cloudflare Functions (Pages Functions)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Cache**: Cloudflare KV namespace
- **CDN**: Cloudflare CDN with edge caching
- **Auth**: Auth0 (OAuth2 + JWT)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Cloudflare Pages

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Mobile Browser (iOS/Android) │ Desktop Browser (Chrome)    │
│  - React UI Components         │ - 3D Babylon.js Visuals     │
│  - Responsive Layout           │ - Real-time Score Updates   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ HTTPS (Cloudflare CDN)
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Cloudflare CDN │  │  KV Cache    │  │  D1 Database   │ │
│  │  (Static Assets)│  │  (30-300s)   │  │  (SQLite Edge) │ │
│  └─────────────────┘  └──────────────┘  └────────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Cloudflare Functions (API Layer)              │   │
│  │  /api/college-baseball/*  /api/mlb/*  /api/auth/*   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ External API Calls
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL DATA SOURCES                      │
├─────────────────────────────────────────────────────────────┤
│  NCAA Stats API  │  MLB Stats API  │  SportsDataIO  │ Auth0 │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Real-Time Game Data Request

```
User Request (Mobile Browser)
  ↓
Cloudflare CDN (Check cache)
  ↓ Cache MISS
Cloudflare Function (/api/college-baseball/scores)
  ↓
Check KV Cache (TTL: 30s for live games)
  ↓ Cache MISS
NCAA Stats API Adapter
  ↓
Fetch live game data
  ↓
Store in KV Cache (30s TTL)
  ↓
Return JSON to client
  ↓
Client renders scores (updates every 30s)
```

### 2. Historical Data Query (Standings, Stats)

```
User Request
  ↓
Cloudflare Function
  ↓
Check KV Cache (TTL: 5 min)
  ↓ Cache MISS
Query D1 Database (SQLite)
  ↓ If not in DB
Fetch from External API
  ↓
Store in D1 (persistent)
Store in KV (5 min TTL)
  ↓
Return to client
```

### 3. Authentication Flow (Auth0)

```
User clicks "Sign In"
  ↓
Redirect to Auth0 (OAuth2)
  ↓
User authenticates (Google/GitHub/Email)
  ↓
Auth0 callback → /api/auth/callback
  ↓
Verify token + Create session
  ↓
Store session in D1
Generate JWT (7-day expiry)
  ↓
Set HTTP-only cookie
  ↓
Redirect to dashboard
```

---

## Database Schema

### Core Tables

**users**
- `id` (TEXT, PK)
- `email` (TEXT, UNIQUE)
- `auth_provider` (TEXT)
- `role` (TEXT: 'user', 'premium', 'admin')
- `created_at` (INTEGER)

**teams**
- `id` (TEXT, PK)
- `name` (TEXT)
- `conference` (TEXT)
- `division` (TEXT)
- `logo_url` (TEXT)

**games**
- `id` (TEXT, PK)
- `home_team_id` (TEXT, FK → teams)
- `away_team_id` (TEXT, FK → teams)
- `game_date` (INTEGER, Unix timestamp)
- `status` (TEXT: 'scheduled', 'in_progress', 'final')
- `home_score`, `away_score` (INTEGER)

**batting_stats** / **pitching_stats**
- Links players to games with box score data
- Enables historical aggregation and player profiles

**rankings**
- `team_id` (FK → teams)
- `poll_date` (INTEGER)
- `rank` (INTEGER)
- `source` (TEXT: 'D1Baseball', 'NCAA', etc.)

See `/lib/db/migrations/001_initial_schema.sql` for full schema.

---

## API Design

### RESTful Endpoints

All API routes are under `/api/*` and implemented as Cloudflare Functions.

#### College Baseball

```
GET /api/college-baseball/teams
  → List all teams with conference standings

GET /api/college-baseball/teams/:teamId
  → Team details, roster, schedule

GET /api/college-baseball/scores?date=YYYY-MM-DD
  → Live/final scores for given date

GET /api/college-baseball/rankings?date=YYYY-MM-DD
  → D1Baseball Top 25 rankings

GET /api/college-baseball/games/:gameId
  → Full box score with play-by-play
```

#### MLB Integration

```
GET /api/mlb/teams
  → All MLB teams (cached from MLB Stats API)

GET /api/mlb/games?date=YYYY-MM-DD
  → Live MLB scores (30s cache)

GET /api/mlb/standings
  → Division standings (5 min cache)
```

#### Authentication

```
GET /api/auth/login
  → Redirect to Auth0

GET /api/auth/callback?code=...
  → OAuth callback, create session

POST /api/auth/logout
  → Destroy session

GET /api/auth/me
  → Current user profile (requires JWT)
```

---

## Caching Strategy

### Multi-Tier Caching

1. **Cloudflare CDN** (Edge Cache)
   - Static assets (HTML, CSS, JS): 1 year
   - API responses with `Cache-Control` headers

2. **KV Namespace** (Distributed Key-Value)
   - Live scores: 30 seconds
   - Standings: 5 minutes
   - Team stats: 10 minutes
   - Historical data: 24 hours

3. **D1 Database** (Persistent Storage)
   - Games, players, teams (permanent)
   - Used as cache fallback for external APIs

### Cache Keys

Format: `{sport}:{resource}:{identifier}:{timestamp}`

Examples:
```
college-baseball:scores:2025-03-15
mlb:standings:2025:AL-East
rankings:d1baseball:2025-03-10
```

---

## Authentication & Authorization

### JWT-Based Sessions

1. **Auth0 OAuth2 Flow**
   - Supports Google, GitHub, Email/Password
   - PKCE flow for mobile security

2. **JWT Token Structure**
   ```json
   {
     "sub": "auth0|user_id",
     "email": "user@example.com",
     "role": "premium",
     "exp": 1746835200
   }
   ```

3. **Authorization Middleware**
   - Verifies JWT on protected routes
   - Checks user role for premium features
   - Rate limiting per user tier

### Role-Based Access Control (RBAC)

- **Guest**: Read-only access to public data
- **User**: Save favorites, view basic stats
- **Premium**: Advanced analytics, historical data
- **Admin**: Manage content, view metrics

---

## Mobile-First Design Principles

### Performance Optimizations

1. **Code Splitting**
   - Babylon.js in separate chunk (loaded on-demand)
   - React vendor bundle (cached separately)
   - Route-based lazy loading

2. **Image Optimization**
   - WebP with JPEG fallback
   - Responsive images (`srcset`)
   - Lazy loading below fold

3. **Network Efficiency**
   - API responses gzipped (Cloudflare automatic)
   - GraphQL-like field selection (future)
   - WebSocket for live scores (alternative to polling)

### Responsive Breakpoints

```css
/* Mobile-first approach */
@media (min-width: 640px)  { /* sm: Tablet portrait */ }
@media (min-width: 768px)  { /* md: Tablet landscape */ }
@media (min-width: 1024px) { /* lg: Desktop */ }
@media (min-width: 1280px) { /* xl: Large desktop */ }
```

---

## Deployment Pipeline

### CI/CD Workflow (GitHub Actions)

```
Push to develop branch
  ↓
Run CI pipeline:
  - Lint (ESLint)
  - Type check (TypeScript)
  - Unit tests (Vitest)
  - E2E tests (Playwright - Chromium only)
  ↓
Build production bundle
  ↓
Deploy to Staging (Cloudflare Pages)
  - Branch: staging
  - URL: staging.blazesportsintel.com
  ↓
Manual QA / Approval
  ↓
Merge to main branch
  ↓
Deploy to Production
  - Run DB migrations (D1)
  - Deploy to Cloudflare Pages
  - Notify Sentry of release
```

### Environment Strategy

- **Local**: `.env.local` + wrangler dev
- **Staging**: `.env.staging` + Cloudflare secret
- **Production**: Cloudflare environment variables (encrypted)

---

## Monitoring & Observability

### Error Tracking

- **Sentry**: Client-side and server-side errors
  - Source maps for production debugging
  - Performance monitoring (Web Vitals)

### Metrics

- **Cloudflare Analytics**: Built-in traffic metrics
- **Custom Metrics** (stored in D1):
  - API response times
  - Cache hit rates
  - User engagement (favorites, searches)

### Logging

- **Cloudflare Logs**: API request/response logs
  - Filterable by endpoint, status code, user
  - Retention: 7 days (free tier)

---

## Security Considerations

### Data Protection

1. **Environment Variables**
   - All secrets in Cloudflare environment (encrypted)
   - Never commit `.env.local` to Git

2. **CORS Policy**
   - Strict origin whitelist
   - Credentials allowed only for same-origin

3. **Rate Limiting**
   - Per-IP: 100 requests/minute (global)
   - Per-User: 300 requests/minute (authenticated)

4. **Input Validation**
   - All API inputs sanitized
   - SQL injection prevention (prepared statements)
   - XSS prevention (React auto-escapes)

5. **HTTPS Everywhere**
   - Cloudflare Full (Strict) SSL
   - HSTS headers enforced

---

## Scalability

### Current Limits

- **D1 Database**: 10 GB storage, 100k writes/day (free tier)
- **KV Namespace**: 100k reads/day, 1k writes/day (free tier)
- **Functions**: 100k requests/day (free tier)

### Growth Strategy

1. **Vertical Scaling** (Cloudflare Paid Plans)
   - Increase D1 writes to millions/day
   - KV unlimited reads/writes
   - Functions unlimited requests

2. **Horizontal Scaling** (Architecture Changes)
   - Add read replicas for D1 (future Cloudflare feature)
   - Use Workers Durable Objects for real-time features
   - Implement GraphQL API for efficient data fetching

---

## Future Enhancements

### Planned Features

1. **College Baseball Box Scores**
   - Play-by-play data ingestion
   - Interactive pitch tracker (3D Babylon.js)

2. **WebSocket Live Updates**
   - Replace polling with push notifications
   - Sub-second score updates

3. **Offline Support**
   - Service Worker caching
   - IndexedDB for offline data

4. **Machine Learning**
   - Win probability models
   - Player performance predictions
   - Cloudflare Workers AI integration

---

## Developer Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled
- **React**: Functional components + hooks
- **Babylon.js**: Modular scene management
- **Testing**: Minimum 70% code coverage

### Performance Budgets

- **Lighthouse Score**: > 90 (mobile)
- **Time to Interactive**: < 3 seconds (4G)
- **Bundle Size**: < 500 KB (gzipped, excluding Babylon.js)

### Contribution Workflow

1. Create feature branch from `develop`
2. Write tests first (TDD)
3. Implement feature
4. Run `make check` (lint + typecheck + test)
5. Submit PR with description
6. Pass CI/CD pipeline
7. Code review + merge

---

## References

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Babylon.js Docs](https://doc.babylonjs.com/)
- [Auth0 Docs](https://auth0.com/docs)
- [Vite Docs](https://vitejs.dev/)
