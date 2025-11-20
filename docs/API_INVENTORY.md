# BSI-NextGen API Inventory
**Last Updated:** 2025-11-19 (Phase 14)
**Deployment:** BlazeSportsIntel.com

---

## API Architecture Overview

### Runtimes
- **Edge Runtime**: Cloudflare Workers (NCAA, Fusion APIs) - <50ms global latency
- **Node.js Runtime**: Traditional serverless (Youth Sports, some data endpoints)

### Caching Strategy
- **Browser Cache**: `max-age=300` (5 minutes)
- **CDN Cache**: `s-maxage=600` (10 minutes)
- **Future**: Cloudflare KV for hot cache, D1 for historical data

---

## College Baseball APIs

### ESPN-Enhanced Box Scores
```
GET /api/sports/college-baseball/games
Query: ?date=YYYY-MM-DD
Runtime: Node.js
Cache: 5min browser / 10min CDN
Response: Complete box scores with batting/pitching lines
Data Source: ESPN College Baseball API (enhanced)
```

### Standings
```
GET /api/sports/college-baseball/standings
Query: ?conference=ACC|SEC|Big12|etc
Runtime: Node.js
Cache: 5min browser / 10min CDN
Response: Conference standings with team records
Data Source: ESPN College Baseball API
```

### Teams
```
GET /api/sports/college-baseball/teams
Query: ?conference=ACC (optional)
Runtime: Node.js
Cache: 60min browser / 120min CDN
Response: List of all D1 teams with metadata
Data Source: ESPN College Baseball API
```

---

## MLB APIs

### Live Games
```
GET /api/sports/mlb/games
Query: ?date=YYYY-MM-DD
Runtime: Node.js
Cache: 60s browser / 120s CDN (during games)
Response: Live scores, innings, pitchers, etc.
Data Source: MLB Stats API (statsapi.mlb.com)
```

### Standings
```
GET /api/sports/mlb/standings
Query: ?divisionId=200|201|202|etc
Runtime: Node.js
Cache: 5min browser / 10min CDN
Response: Division standings with W/L/PCT
Data Source: MLB Stats API
```

### Teams
```
GET /api/sports/mlb/teams
Query: none
Runtime: Node.js
Cache: 60min browser / 120min CDN
Response: All 30 MLB teams with metadata
Data Source: MLB Stats API
```

---

## NFL APIs

### Games
```
GET /api/sports/nfl/games
Query: ?week=1&season=2025
Runtime: Node.js
Cache: 60s browser / 120s CDN (during games)
Response: Live scores, quarters, drives, etc.
Data Source: SportsDataIO (requires API key)
```

### Standings
```
GET /api/sports/nfl/standings
Query: ?season=2025
Runtime: Node.js
Cache: 5min browser / 10min CDN
Response: Division standings, playoff picture
Data Source: SportsDataIO
```

### Teams
```
GET /api/sports/nfl/teams
Query: none
Runtime: Node.js
Cache: 60min browser / 120min CDN
Response: All 32 NFL teams with metadata
Data Source: SportsDataIO
```

---

## NBA APIs

### Games
```
GET /api/sports/nba/games
Query: ?date=YYYY-MM-DD
Runtime: Node.js
Cache: 60s browser / 120s CDN (during games)
Response: Live scores, quarters, leaders, etc.
Data Source: SportsDataIO (requires API key)
```

### Standings
```
GET /api/sports/nba/standings
Query: none
Runtime: Node.js
Cache: 5min browser / 10min CDN
Response: Conference standings with W/L/PCT
Data Source: SportsDataIO
```

### Teams
```
GET /api/sports/nba/teams
Query: none
Runtime: Node.js
Cache: 60min browser / 120min CDN
Response: All 30 NBA teams with metadata
Data Source: SportsDataIO
```

---

## NCAA Football APIs (Edge Runtime)

### Team Data & Analytics
```
GET /api/ncaa/football/:teamId
Params: teamId (ESPN team ID, e.g., "251" for Texas)
Runtime: Edge (Cloudflare Workers)
Cache: 5min browser / 10min CDN
Response: Team info, standings, schedule, Pythagorean analytics
Data Source: ESPN College Football API
Features:
  - Real-time ESPN data integration
  - Pythagorean win expectations (exponent: 2.37)
  - Strength of schedule calculations
  - Efficiency metrics (yards/play, turnovers)
```

### Alternative Path
```
GET /api/sports/ncaa/football/:teamId
(Duplicate route - same handler as above)
```

---

## NCAA Basketball APIs (Edge Runtime)

### Team Data & Analytics
```
GET /api/ncaa/basketball/:teamId
Params: teamId (ESPN team ID, e.g., "96" for Kansas)
Runtime: Edge (Cloudflare Workers)
Cache: 5min browser / 10min CDN
Response: Team info, standings, schedule, Pythagorean analytics
Data Source: ESPN College Basketball API
Features:
  - Real-time ESPN data integration
  - Pythagorean win expectations (exponent: 10.25)
  - Offensive/defensive efficiency
  - Momentum tracking (streaks)
```

### Alternative Path
```
GET /api/sports/ncaa/basketball/:teamId
(Duplicate route - same handler as above)
```

---

## Youth Sports APIs (Phase 13 - NEW)

### Texas HS Football - Standings
```
GET /api/sports/youth-sports/texas-hs-football/standings
Query: ?classification=6A|5A|4A|3A|2A|1A
Runtime: Node.js
Cache: 5min browser / 10min CDN
Response: District standings by classification
Data Source: Demo data (MaxPreps integration pending)
Status: ⚠️ Using placeholder data - production integration needed
```

### Texas HS Football - Scores
```
GET /api/sports/youth-sports/texas-hs-football/scores
Query: ?classification=6A|5A|4A|3A|2A|1A&week=1
Runtime: Node.js
Cache: 60s browser / 120s CDN (during Friday nights)
Response: Weekly game scores, live updates
Data Source: Demo data (MaxPreps integration pending)
Status: ⚠️ Using placeholder data - production integration needed
```

### Perfect Game - Tournaments
```
GET /api/sports/youth-sports/perfect-game/tournaments
Query: ?ageGroup=14U|15U|16U|17U|18U&state=TX
Runtime: Node.js
Cache: 60min browser / 120min CDN
Response: Tournament schedules, top prospects, team rosters
Data Source: Demo data (Perfect Game API integration pending)
Status: ⚠️ Using placeholder data - production integration needed
```

---

## Unified APIs

### NCAA Fusion (Multi-Sport)
```
GET /api/edge/ncaa/fusion
Query: ?sports=football,basketball&teamIds=251,96
Runtime: Edge (Cloudflare Workers)
Cache: 5min browser / 10min CDN
Response: Combined NCAA data across multiple sports
Data Source: ESPN College Sports APIs
Status: ✅ Production-ready
```

---

## API Response Structure (Standard)

All APIs follow this consistent response structure:

```typescript
{
  // Sport-specific data
  data: {
    games?: Game[];
    standings?: Standing[];
    teams?: Team[];
    team?: TeamInfo;
    // ... other sport-specific fields
  },

  // Metadata (REQUIRED for all responses)
  meta: {
    dataSource: string;           // "ESPN API", "MLB Stats API", etc.
    lastUpdated: string;          // ISO 8601 timestamp
    timezone: "America/Chicago";  // Always CST/CDT
    season?: string;              // "2025", "2024-2025", etc.
    sport?: string;               // "football", "basketball", etc.
  },

  // Analytics (when applicable)
  analytics?: {
    pythagorean?: {
      expectedWins: number;
      winPercentage: string;
      inputs: {
        pointsFor: number;
        pointsAgainst: number;
        exponent: number;         // Sport-specific: football=2.37, basketball=10.25
      };
    };
    efficiency?: {
      averageFor: number;
      averageAgainst: number;
      differential: number;
    };
    momentum?: {
      streak: string;             // "W3", "L2", etc.
      streakValue: number;
    };
  }
}
```

---

## Cache Key Pattern

Recommended cache key structure for Phase 14 KV implementation:

```
Format: bsi:{sport}:{endpoint}:{params}:{timestamp}

Examples:
- bsi:mlb:games:2025-01-11:20250111200000
- bsi:nfl:standings:2025:20250111200000
- bsi:ncaa:football:251:20250111200000
- bsi:youth:txhsfb:standings:6A:20250111200000
```

---

## Performance Benchmarks (Phase 13 Testing)

### Youth Sports APIs
- Texas HS Football Standings: 70-85ms
- Texas HS Football Scores: 95-120ms
- Perfect Game Tournaments: 150-185ms

### NCAA APIs (Edge Runtime)
- NCAA Football: 8-35ms (edge hit), 400-608ms (cold start)
- NCAA Basketball: 12-45ms (edge hit), 350-550ms (cold start)

### Target Performance (Phase 14)
- KV Cache Hit: <10ms
- Edge Runtime: <50ms
- Node.js Runtime: <200ms
- Cold Start (acceptable): <1000ms

---

## Phase 14 Priorities

1. **Create shared caching utility** (`packages/api/src/cache/`)
   - KV integration with TTL support
   - Automatic cache key generation
   - Cache invalidation helpers

2. **Unified Command Center API** (`/api/sports/command-center`)
   - Multi-sport scoreboard (all live games)
   - Cross-sport standings aggregator
   - Real-time update stream

3. **Migrate existing routes to caching layer**
   - NCAA APIs (already on edge, add KV cache)
   - Youth Sports APIs (add KV cache + edge migration)
   - MLB/NFL/NBA APIs (add KV cache)

4. **Monitoring & Observability**
   - Cache hit rate metrics
   - API latency tracking
   - Error rate monitoring

---

## API Keys Required

### Production
- `SPORTSDATAIO_API_KEY` - NFL/NBA data
- `CLOUDFLARE_API_TOKEN` - KV/D1/R2 access
- (Optional) `COLLEGEFOOTBALLDATA_API_KEY` - Enhanced NCAA data

### Development
- Same as production (use separate API key quotas if available)

---

## Security & Rate Limits

### External API Rate Limits
- **MLB Stats API**: Unlimited (official, public)
- **ESPN API**: Soft limit ~100 req/min (monitor 429 responses)
- **SportsDataIO**: 1000 req/day (trial), 10,000 req/day (paid tier)

### Internal Rate Limits (Future Phase 18)
- **Per-IP**: 1000 req/hour
- **Per-User** (authenticated): 10,000 req/hour
- **Burst**: 100 req/minute

---

## Deployment Status

### ✅ Production (BlazeSportsIntel.com)
- College Baseball APIs
- MLB/NFL/NBA APIs
- NCAA Football/Basketball APIs (Edge Runtime)
- Youth Sports APIs (Demo data)
- NCAA Fusion API

### ⏳ Staging (In Development)
- Multi-sport Command Center
- Shared caching layer
- Real-time WebSocket updates

### 📋 Planned (Phase 15+)
- D1 historical data layer
- News aggregation APIs
- Player profile APIs
- Predictive analytics APIs

---

**Document Maintained By:** Claude Code (Blaze Sports Intel Platform)
**Next Review:** Phase 14 completion
