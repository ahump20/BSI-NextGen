# Unified API Quick Start Guide

**Blaze Sports Intel - Multi-League Sports Data**

This guide shows you how to use the new unified API endpoints to fetch data across ALL leagues (MLB, NFL, NBA, NCAA Football, College Baseball) in a single request.

---

## New Unified Endpoints

### 1. All Games Across All Leagues

```bash
GET /api/unified/games?date=2025-01-11
```

**Returns:** Games from MLB, NFL, NBA, NCAA Football, and College Baseball for the specified date.

**Example Response:**
```json
{
  "games": [
    {
      "id": "730005",
      "sport": "MLB",
      "date": "2025-01-11T18:05:00Z",
      "status": "scheduled",
      "homeTeam": {
        "id": "138",
        "name": "St. Louis Cardinals",
        "abbreviation": "STL",
        "city": "St. Louis"
      },
      "awayTeam": {
        "id": "112",
        "name": "Chicago Cubs",
        "abbreviation": "CHC",
        "city": "Chicago"
      },
      "homeScore": 0,
      "awayScore": 0,
      "venue": "Busch Stadium"
    },
    {
      "id": "401547442",
      "sport": "NFL",
      "date": "2025-01-11T20:15:00Z",
      "status": "live",
      "homeTeam": {
        "id": "16",
        "name": "Kansas City Chiefs",
        "abbreviation": "KC"
      },
      "awayTeam": {
        "id": "34",
        "name": "Houston Texans",
        "abbreviation": "HOU"
      },
      "homeScore": 24,
      "awayScore": 17,
      "period": "Q3"
    }
  ],
  "meta": {
    "dataSource": "Multi-League Orchestrator",
    "leagues": ["MLB", "NFL", "NBA", "NCAA Football", "College Baseball"],
    "sources": [
      {
        "provider": "MLB Stats API",
        "timestamp": "2025-01-11T14:30:00-06:00",
        "confidence": 1.0
      },
      {
        "provider": "SportsDataIO",
        "timestamp": "2025-01-11T14:30:05-06:00",
        "confidence": 1.0
      }
    ],
    "aggregatedConfidence": 1.0,
    "lastUpdated": "2025-01-11T14:30:10-06:00",
    "timezone": "America/Chicago",
    "count": 42
  }
}
```

**Query Parameters:**
- `date` (optional): YYYY-MM-DD format. Defaults to today in America/Chicago timezone.

**Cache Strategy:**
- Live games: 30 seconds
- Completed/scheduled: 5 minutes

---

### 2. All Standings Across All Leagues

```bash
GET /api/unified/standings
```

**Returns:** Current standings from MLB, NFL, and NBA.

**Example Response:**
```json
{
  "standings": [
    {
      "team": {
        "id": "138",
        "name": "St. Louis Cardinals",
        "abbreviation": "STL",
        "city": "St. Louis",
        "division": "NL Central",
        "conference": "National League"
      },
      "wins": 85,
      "losses": 77,
      "winPercentage": 0.525,
      "gamesBack": 5.0,
      "streak": "W3"
    }
  ],
  "meta": {
    "dataSource": "Multi-League Orchestrator",
    "leagues": ["MLB", "NFL", "NBA"],
    "aggregatedConfidence": 1.0,
    "lastUpdated": "2025-01-11T14:30:00-06:00",
    "timezone": "America/Chicago",
    "count": 92
  }
}
```

**Cache Strategy:** 5 minutes

---

### 3. Unified Search Across All Leagues

```bash
GET /api/unified/search?q=Cardinals
```

**Returns:** Teams matching "Cardinals" from any league.

**Example Response:**
```json
{
  "results": [
    {
      "sport": "MLB",
      "type": "team",
      "id": "138",
      "name": "St. Louis Cardinals",
      "relevanceScore": 1.0,
      "metadata": {
        "abbreviation": "STL",
        "city": "St. Louis",
        "division": "NL Central",
        "logo": "https://www.mlbstatic.com/team-logos/138.svg"
      }
    },
    {
      "sport": "NFL",
      "type": "team",
      "id": "22",
      "name": "Arizona Cardinals",
      "relevanceScore": 1.0,
      "metadata": {
        "abbreviation": "ARI",
        "city": "Arizona",
        "conference": "NFC",
        "division": "NFC West",
        "logo": "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png"
      }
    }
  ],
  "meta": {
    "dataSource": "Multi-League Orchestrator",
    "leagues": ["MLB", "NFL", "NBA", "NCAA Football", "College Baseball"],
    "query": "Cardinals",
    "lastUpdated": "2025-01-11T14:30:00-06:00",
    "timezone": "America/Chicago",
    "count": 2
  }
}
```

**Query Parameters:**
- `q` (required): Search query (team name, city, or abbreviation)

**Relevance Scoring:**
- 1.0: Exact match (name or abbreviation)
- 0.8: Starts with query
- 0.6: Contains query
- 0.4: Abbreviation partial match

**Cache Strategy:** 1 hour

---

### 4. Live Games Only

```bash
GET /api/unified/live
```

**Returns:** ONLY games with `status='live'` from all leagues.

**Example Response:**
```json
{
  "liveGames": [
    {
      "id": "401547442",
      "sport": "NFL",
      "date": "2025-01-11T20:15:00Z",
      "status": "live",
      "homeTeam": {
        "id": "16",
        "name": "Kansas City Chiefs",
        "abbreviation": "KC"
      },
      "awayTeam": {
        "id": "34",
        "name": "Houston Texans",
        "abbreviation": "HOU"
      },
      "homeScore": 24,
      "awayScore": 17,
      "period": "Q3"
    },
    {
      "id": "401585077",
      "sport": "NBA",
      "date": "2025-01-11T19:00:00Z",
      "status": "live",
      "homeTeam": {
        "id": "16",
        "name": "Memphis Grizzlies",
        "abbreviation": "MEM"
      },
      "awayTeam": {
        "id": "8",
        "name": "Dallas Mavericks",
        "abbreviation": "DAL"
      },
      "homeScore": 98,
      "awayScore": 94,
      "period": "Q4"
    }
  ],
  "meta": {
    "dataSource": "Multi-League Orchestrator",
    "aggregatedConfidence": 1.0,
    "lastUpdated": "2025-01-11T14:30:00-06:00",
    "timezone": "America/Chicago",
    "count": 8
  }
}
```

**Cache Strategy:** 15 seconds (very short for real-time updates)

**Response Headers:**
```
X-Live-Update: true
```

This header hints to clients to refresh frequently.

---

## Error Handling

All unified endpoints return errors in this format:

```json
{
  "error": "Failed to fetch games",
  "games": [],
  "meta": {
    "errors": [
      {
        "sport": "NFL",
        "message": "API rate limit exceeded"
      }
    ]
  }
}
```

**Error Types:**
- `400`: Bad request (missing query parameter)
- `500`: Internal server error (API failure)

**Partial Success:**
If one league fails, the response will still include data from successful leagues with an `errors` array in the metadata.

---

## Usage Examples

### Frontend (React/Next.js)

```typescript
// Fetch all games for today
async function fetchTodaysGames() {
  const response = await fetch('/api/unified/games');
  const { games, meta } = await response.json();

  console.log(`Fetched ${meta.count} games from ${meta.leagues.length} leagues`);
  console.log(`Aggregated confidence: ${meta.aggregatedConfidence}`);

  return games;
}

// Search for a team
async function searchTeam(query: string) {
  const response = await fetch(`/api/unified/search?q=${encodeURIComponent(query)}`);
  const { results } = await response.json();

  return results;
}

// Get live games only
async function fetchLiveGames() {
  const response = await fetch('/api/unified/live');
  const { liveGames } = await response.json();

  return liveGames;
}
```

### Live Updates (Polling)

```typescript
// Poll live games every 15 seconds
function useLiveGames() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const fetchLive = async () => {
      const response = await fetch('/api/unified/live');
      const { liveGames } = await response.json();
      setGames(liveGames);
    };

    // Initial fetch
    fetchLive();

    // Poll every 15 seconds
    const interval = setInterval(fetchLive, 15000);

    return () => clearInterval(interval);
  }, []);

  return games;
}
```

---

## Benefits Over Sport-Specific Endpoints

### Before (Sport-Specific):
```typescript
// Fetch games from each league separately
const mlbGames = await fetch('/api/sports/mlb/games?date=2025-01-11');
const nflGames = await fetch('/api/sports/nfl/games?week=18');
const nbaGames = await fetch('/api/sports/nba/games?date=2025-01-11');
const ncaaGames = await fetch('/api/sports/ncaa_football/games?week=15');
const cbbGames = await fetch('/api/sports/college_baseball/games?date=2025-01-11');

// Combine manually
const allGames = [
  ...mlbGames.data,
  ...nflGames.data,
  ...nbaGames.data,
  ...ncaaGames.data,
  ...cbbGames.data,
];
```

### After (Unified):
```typescript
// Single request for all leagues
const { games } = await fetch('/api/unified/games?date=2025-01-11');
```

**Advantages:**
1. **Fewer requests:** 1 instead of 5
2. **Simpler code:** No manual aggregation
3. **Consistent format:** All games follow same structure
4. **Aggregated confidence:** Know overall data quality
5. **Error resilience:** Partial success if one league fails

---

## Filtering Results

You can filter unified results by sport in your frontend:

```typescript
const { games } = await fetch('/api/unified/games');

// Filter by sport
const mlbGames = games.filter(g => g.sport === 'MLB');
const nflGames = games.filter(g => g.sport === 'NFL');

// Filter by status
const liveGames = games.filter(g => g.status === 'live');
const upcomingGames = games.filter(g => g.status === 'scheduled');
```

---

## Performance Considerations

**Network:**
- Unified endpoints make parallel API calls to all leagues
- Response time: ~500ms-1s (based on slowest provider)
- Uses `Promise.allSettled` to avoid blocking on failures

**Caching:**
- Unified endpoints use the same caching strategy as sport-specific endpoints
- Edge caching via Cloudflare Pages reduces load on origin
- Cache keys include date/query to ensure freshness

**Rate Limits:**
- MLB Stats API: No documented limits (free)
- SportsDataIO: 100 requests/day (trial), higher on paid tiers
- ESPN API: Undocumented, monitor for throttling

---

## Migration Guide

### Step 1: Update Imports

```typescript
// Before
import { MLBAdapter, NFLAdapter, NBAAdapter } from '@bsi/api';

// After
import { orchestrator } from '@bsi/api';
```

### Step 2: Replace Adapter Calls

```typescript
// Before
const mlbAdapter = new MLBAdapter();
const mlbGames = await mlbAdapter.getGames('2025-01-11');

// After
const allGames = await orchestrator.getAllGames('2025-01-11');
const mlbGames = allGames.data.filter(g => g.sport === 'MLB');
```

### Step 3: Update Frontend API Calls

```typescript
// Before
const response = await fetch('/api/sports/mlb/games?date=2025-01-11');

// After
const response = await fetch('/api/unified/games?date=2025-01-11');
```

---

## Next Steps

1. **Try the endpoints:** Test with Postman or curl
2. **Build a multi-league dashboard:** Display games from all leagues in one view
3. **Implement live updates:** Use polling or WebSockets for real-time scores
4. **Add search functionality:** Build a search bar that queries all leagues
5. **Optimize caching:** Implement client-side caching with SWR or React Query

---

## Support

**Questions?** Contact Austin Humphrey (ahump20@outlook.com)

**Found a bug?** Open an issue on GitHub: github.com/ahump20/BSI-NextGen

**Want to contribute?** See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Last Updated:** January 11, 2025, 2:30 PM CST
**Timezone:** America/Chicago
