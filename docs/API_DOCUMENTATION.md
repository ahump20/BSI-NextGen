# Sandlot Sluggers API Documentation

**Version:** 1.0.0
**Base URL:** `https://eaec3ea6.sandlot-sluggers.pages.dev/api`
**Timezone:** America/Chicago (CST/CDT)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limits](#rate-limits)
4. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Global Stats](#global-stats)
   - [Leaderboards](#leaderboards)
   - [Character Stats](#character-stats)
   - [Stadium Stats](#stadium-stats)
   - [Player Progress](#player-progress)
   - [Game Result Submission](#game-result-submission)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)
8. [Changelog](#changelog)

---

## Overview

The Sandlot Sluggers API provides access to game statistics, player progression, leaderboards, and analytics. All endpoints return JSON responses with consistent structure and error handling.

### Key Features

- ✅ Real-time game statistics
- ✅ Global leaderboards
- ✅ Character performance metrics
- ✅ Stadium usage analytics
- ✅ Player progression tracking
- ✅ KV-based caching (sub-200ms response times)
- ✅ D1 database persistence

---

## Authentication

**Current Status:** No authentication required (all endpoints are public)

**Future:** OAuth 2.0 with Google/GitHub (see [Security Roadmap](#security-roadmap))

---

## Rate Limits

| Limit Type | Value |
|------------|-------|
| Per IP | 100 requests/minute |
| Per Player | 1,000 requests/hour |
| Burst | 10 requests/second |

**Headers Returned:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**429 Response:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "timestamp": "2025-11-07T00:45:00.000Z"
}
```

---

## Endpoints

### Health Check

**GET** `/api/health`

Returns system health status including D1 database and KV cache connectivity.

#### Response

**200 OK:**
```json
{
  "timestamp": 1762475501451,
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 98
    },
    "kv": {
      "status": "healthy",
      "latency": 150
    },
    "frontend": {
      "status": "healthy",
      "latency": 0
    }
  }
}
```

**503 Service Unavailable:**
```json
{
  "timestamp": 1762475501451,
  "status": "degraded",
  "checks": {
    "database": {
      "status": "unhealthy",
      "latency": 5000,
      "error": "Connection timeout"
    },
    "kv": {
      "status": "healthy",
      "latency": 150
    },
    "frontend": {
      "status": "healthy",
      "latency": 0
    }
  }
}
```

#### Headers

- `Cache-Control`: `no-cache`

#### Example

```bash
curl https://eaec3ea6.sandlot-sluggers.pages.dev/api/health
```

---

### Global Stats

**GET** `/api/stats/global`

Returns aggregated statistics across all players and games.

#### Response

**200 OK:**
```json
{
  "activePlayers": 0,
  "gamesToday": 0,
  "gamesTotal": 2,
  "totalHomeRuns": 5,
  "totalHits": 20,
  "totalRuns": 15,
  "topPlayer": {
    "id": "test-player-001",
    "name": "Anonymous",
    "homeRuns": 5
  },
  "mostPopularStadium": {
    "id": "dusty_acres",
    "name": "Dusty Acres",
    "usagePercent": 20
  },
  "mostPopularCharacter": {
    "id": "rocket_rivera",
    "name": "Rocket Rivera",
    "usagePercent": 15
  },
  "avgGameLength": 510,
  "lastUpdated": "2025-11-07T00:31:50.472Z",
  "timezone": "America/Chicago"
}
```

#### Headers

- `Cache-Control`: `public, max-age=300` (5 minutes)

#### Example

```bash
curl https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/global
```

```javascript
// JavaScript fetch
const stats = await fetch('https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/global')
  .then(res => res.json());
console.log(`Total games: ${stats.gamesTotal}`);
```

---

### Leaderboards

**GET** `/api/stats/leaderboard/{statType}`

Returns top players for a specific statistic.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `statType` | string (path) | Yes | Stat to rank by |
| `limit` | integer (query) | No | Max entries (default: 10, max: 100) |

#### Valid Stat Types

- `home_runs` - Total home runs
- `wins` - Total wins
- `batting_avg` - Batting average
- `total_hits` - Total hits
- `total_runs` - Total runs scored
- `games_played` - Games played
- `experience` - XP points

#### Response

**200 OK:**
```json
{
  "statType": "home_runs",
  "entries": [
    {
      "rank": 1,
      "playerId": "player-123",
      "playerName": "Rocket Rivera",
      "statValue": 42,
      "gamesPlayed": 15
    },
    {
      "rank": 2,
      "playerId": "player-456",
      "playerName": "Sally Slugger",
      "statValue": 38,
      "gamesPlayed": 18
    }
  ],
  "totalEntries": 150,
  "lastUpdated": "2025-11-07T00:31:50.472Z",
  "timezone": "America/Chicago"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid stat type. Must be one of: home_runs, wins, batting_avg, total_hits, total_runs, games_played, experience",
  "timestamp": "2025-11-07T00:31:57.345Z"
}
```

#### Headers

- `Cache-Control`: `public, max-age=60` (1 minute)

#### Examples

```bash
# Top 10 home run leaders
curl https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/leaderboard/home_runs

# Top 50 by wins
curl "https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/leaderboard/wins?limit=50"
```

```javascript
// JavaScript fetch with limit
const leaderboard = await fetch(
  'https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/leaderboard/home_runs?limit=25'
).then(res => res.json());

leaderboard.entries.forEach((entry, index) => {
  console.log(`${entry.rank}. ${entry.playerName}: ${entry.statValue} HRs`);
});
```

---

### Character Stats

**GET** `/api/stats/characters`

Returns performance metrics for all characters or a specific character.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `characterId` | string (query) | No | Filter by character ID |

#### Response

**200 OK:**
```json
{
  "characters": [
    {
      "id": "rocket_rivera",
      "name": "Rocket Rivera",
      "gamesPlayed": 45,
      "winRate": 0.67,
      "avgHomeRuns": 3.2,
      "avgHits": 8.5,
      "popularityRank": 1
    },
    {
      "id": "sally_slugger",
      "name": "Sally Slugger",
      "gamesPlayed": 38,
      "winRate": 0.71,
      "avgHomeRuns": 2.8,
      "avgHits": 9.1,
      "popularityRank": 2
    }
  ],
  "mostPopular": {
    "id": "rocket_rivera",
    "name": "Rocket Rivera",
    "usagePercent": 22.5
  },
  "totalGames": 200,
  "metadata": {
    "lastUpdated": "2025-11-07T00:31:58.593Z",
    "timezone": "America/Chicago"
  }
}
```

**404 Not Found:**
```json
{
  "error": "Character not found",
  "code": "CHARACTER_NOT_FOUND",
  "timestamp": "2025-11-07T00:35:00.000Z"
}
```

#### Headers

- `Cache-Control`: `public, max-age=600` (10 minutes)

#### Examples

```bash
# All characters
curl https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/characters

# Single character
curl "https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/characters?characterId=rocket_rivera"
```

```javascript
// Filter by character
const rocketStats = await fetch(
  'https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/characters?characterId=rocket_rivera'
).then(res => res.json());

console.log(`Rocket Rivera win rate: ${(rocketStats.characters[0].winRate * 100).toFixed(1)}%`);
```

---

### Stadium Stats

**GET** `/api/stats/stadiums`

Returns usage metrics and scoring averages for all stadiums or a specific stadium.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stadiumId` | string (query) | No | Filter by stadium ID |

#### Response

**200 OK:**
```json
{
  "stadiums": [
    {
      "id": "dusty_acres",
      "name": "Dusty Acres",
      "gamesPlayed": 55,
      "avgHomeRuns": 4.2,
      "avgRuns": 12.8,
      "popularityRank": 1
    },
    {
      "id": "steel_mill_park",
      "name": "Steel Mill Park",
      "gamesPlayed": 42,
      "avgHomeRuns": 3.8,
      "avgRuns": 11.5,
      "popularityRank": 2
    }
  ],
  "mostPopular": {
    "id": "dusty_acres",
    "name": "Dusty Acres",
    "usagePercent": 27.5
  },
  "totalGames": 200,
  "metadata": {
    "lastUpdated": "2025-11-07T00:32:01.123Z",
    "timezone": "America/Chicago"
  }
}
```

**404 Not Found:**
```json
{
  "error": "Stadium not found",
  "code": "STADIUM_NOT_FOUND",
  "timestamp": "2025-11-07T00:35:00.000Z"
}
```

#### Headers

- `Cache-Control`: `public, max-age=600` (10 minutes)

#### Examples

```bash
# All stadiums
curl https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/stadiums

# Single stadium
curl "https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/stadiums?stadiumId=dusty_acres"
```

---

### Player Progress

**GET** `/api/progress/{playerId}`

Returns detailed progression information for a specific player.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `playerId` | string (path) | Yes | Unique player identifier |

#### Response

**200 OK:**
```json
{
  "playerId": "player-123",
  "gamesPlayed": 25,
  "wins": 18,
  "losses": 7,
  "totalRuns": 156,
  "totalHits": 234,
  "totalHomeRuns": 42,
  "unlockedCharacters": [
    "rocket_rivera",
    "sally_slugger",
    "tommy_twobagger"
  ],
  "unlockedStadiums": [
    "dusty_acres",
    "steel_mill_park"
  ],
  "currentLevel": 8,
  "experience": 1250,
  "nextLevelXP": 1500,
  "createdAt": "2025-10-15T14:22:00.000Z",
  "updatedAt": "2025-11-07T00:30:00.000Z"
}
```

**404 Not Found:**
```json
{
  "error": "Player not found",
  "code": "PLAYER_NOT_FOUND",
  "timestamp": "2025-11-07T00:35:00.000Z"
}
```

#### Headers

- `Cache-Control`: `public, max-age=60` (1 minute)

#### Example

```bash
curl https://eaec3ea6.sandlot-sluggers.pages.dev/api/progress/player-123
```

```javascript
// Check player progress
const progress = await fetch(
  'https://eaec3ea6.sandlot-sluggers.pages.dev/api/progress/player-123'
).then(res => res.json());

const xpToNextLevel = progress.nextLevelXP - progress.experience;
console.log(`${xpToNextLevel} XP needed for level ${progress.currentLevel + 1}`);
```

---

### Game Result Submission

**POST** `/api/game-result`

Records the result of a completed game (optional, for future analytics).

#### Request Body

```json
{
  "playerId": "player-123",
  "characterId": "rocket_rivera",
  "stadiumId": "dusty_acres",
  "runs": 8,
  "hits": 12,
  "homeRuns": 3,
  "innings": 9,
  "won": true,
  "gameLength": 520
}
```

#### Response

**201 Created:**
```json
{
  "success": true,
  "gameId": "game-789",
  "xpGained": 150,
  "newLevel": 9,
  "unlockedRewards": [
    {
      "character": "dizzy_dean",
      "type": "character"
    }
  ],
  "timestamp": "2025-11-07T00:35:00.000Z"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid request body",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "runs",
    "message": "Must be a non-negative integer"
  },
  "timestamp": "2025-11-07T00:35:00.000Z"
}
```

#### Headers

- `Content-Type`: `application/json`

#### Example

```bash
curl -X POST https://eaec3ea6.sandlot-sluggers.pages.dev/api/game-result \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player-123",
    "characterId": "rocket_rivera",
    "stadiumId": "dusty_acres",
    "runs": 8,
    "hits": 12,
    "homeRuns": 3,
    "innings": 9,
    "won": true,
    "gameLength": 520
  }'
```

```javascript
// Submit game result
const result = await fetch(
  'https://eaec3ea6.sandlot-sluggers.pages.dev/api/game-result',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: 'player-123',
      characterId: 'rocket_rivera',
      stadiumId: 'dusty_acres',
      runs: 8,
      hits: 12,
      homeRuns: 3,
      innings: 9,
      won: true,
      gameLength: 520
    })
  }
).then(res => res.json());

if (result.newLevel) {
  console.log(`Level up! Now level ${result.newLevel}`);
}
```

---

## Response Formats

### Success Response

All successful responses follow this structure:

```json
{
  "data": { /* endpoint-specific data */ },
  "metadata": {
    "lastUpdated": "2025-11-07T00:31:50.472Z",
    "timezone": "America/Chicago"
  }
}
```

### Error Response

All error responses follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "timestamp": "2025-11-07T00:35:00.000Z",
  "details": {
    /* optional additional context */
  }
}
```

#### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request body/params failed validation |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `SERVICE_UNAVAILABLE` | Temporary outage |

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Retry Strategy

For `500` and `503` errors, implement exponential backoff:

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) return response;

      // Don't retry 4xx errors
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Exponential backoff for 5xx
      if (i < maxRetries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}

// Usage
const stats = await fetchWithRetry(
  'https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/global'
).then(res => res.json());
```

---

## Code Examples

### React Hook

```typescript
import { useEffect, useState } from 'react';

interface GlobalStats {
  activePlayers: number;
  gamesTotal: number;
  totalHomeRuns: number;
  // ... other fields
}

export function useGlobalStats() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/global')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setStats)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
```

### Python

```python
import requests

def get_leaderboard(stat_type='home_runs', limit=10):
    """Fetch leaderboard from Sandlot Sluggers API"""
    url = f'https://eaec3ea6.sandlot-sluggers.pages.dev/api/stats/leaderboard/{stat_type}'
    params = {'limit': limit}

    response = requests.get(url, params=params)
    response.raise_for_status()

    return response.json()

# Usage
leaders = get_leaderboard('home_runs', limit=25)
for entry in leaders['entries']:
    print(f"{entry['rank']}. {entry['playerName']}: {entry['statValue']} HRs")
```

### Node.js

```javascript
const axios = require('axios');

async function submitGameResult(gameData) {
  try {
    const response = await axios.post(
      'https://eaec3ea6.sandlot-sluggers.pages.dev/api/game-result',
      gameData,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log(`Game recorded: ${response.data.gameId}`);
    console.log(`XP gained: ${response.data.xpGained}`);

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`API error: ${error.response.data.error}`);
    } else {
      console.error(`Request error: ${error.message}`);
    }
    throw error;
  }
}
```

---

## Security Roadmap

### Planned Features

**Phase 1: Core Security** (Blocked - see [Production Gatekeeper Report](#))
- [ ] CORS standardization
- [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] Request timeouts
- [ ] Retry logic with exponential backoff

**Phase 2: Authentication** (Blocked until Phase 1 complete)
- [ ] OAuth 2.0 with Google/GitHub
- [ ] JWT-based session management
- [ ] CSRF protection
- [ ] Rate limiting per user

**Phase 3: Advanced Features**
- [ ] API versioning (`/api/v1/...`)
- [ ] WebSocket support for real-time updates
- [ ] Webhook notifications
- [ ] GraphQL endpoint

---

## Changelog

### Version 1.0.0 (2025-11-07)

**Added:**
- Initial API release
- Health check endpoint
- Global stats aggregation
- Leaderboards (7 stat types)
- Character performance metrics
- Stadium usage analytics
- Player progression tracking
- Game result submission

**Infrastructure:**
- Cloudflare Pages Functions (API Gateway)
- D1 database (56 tables, 80.6 MB)
- KV cache (150ms avg latency)
- Global CDN deployment

---

## Support

**Issues & Bug Reports:**
GitHub: https://github.com/ahump20/Sandlot-Sluggers/issues

**Contact:**
Email: ahump20@outlook.com

**OpenAPI Spec:**
`/openapi.yaml` (view with Swagger UI or Redoc)

---

*Last Updated: November 7, 2025*
*Timezone: America/Chicago*
