# API Documentation

**BSI-NextGen REST API** - Sports data endpoints for blazesportsintel.com

**Base URL**: `https://blazesportsintel.com/api` (production) or `http://localhost:3000/api` (development)

**Timezone**: All timestamps are in `America/Chicago` (Central Time)

---

## Table of Contents

- [Authentication](#authentication)
- [Sports Endpoints](#sports-endpoints)
  - [MLB](#mlb)
  - [NFL](#nfl)
  - [NBA](#nba)
  - [College Baseball](#college-baseball)
  - [Unified](#unified)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

Most sports data endpoints are **publicly accessible**. Authentication endpoints use OAuth 2.0 with Auth0.

### Auth Endpoints

#### Login
```http
GET /api/auth/login?returnTo=/profile
```

Initiates OAuth login flow. Redirects to Auth0 login page.

**Query Parameters:**
- `returnTo` (optional): URL to redirect to after login

**Response:** Redirect to Auth0

---

#### Callback
```http
GET /api/auth/callback?code=xxx&state=xxx
```

OAuth callback handler. **Do not call directly** - handled by Auth0.

---

#### Get Current User
```http
GET /api/auth/me
```

Get currently authenticated user information.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "auth0|123456",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://example.com/avatar.jpg"
  }
}
```

---

#### Logout
```http
GET /api/auth/logout?returnTo=/
```

Logs out the current user and clears session.

**Query Parameters:**
- `returnTo` (optional): URL to redirect to after logout

**Response:** Redirect to specified URL or homepage

---

## Sports Endpoints

All sports endpoints return data in a consistent format:

```json
{
  "data": [...],
  "source": {
    "provider": "MLB Stats API",
    "timestamp": "2025-01-11T12:00:00.000Z",
    "confidence": 1.0
  }
}
```

---

## MLB

### Get MLB Games

```http
GET /api/sports/mlb/games?date=2025-01-11
```

Fetch MLB games for a specific date.

**Query Parameters:**
- `date` (optional): Date in `YYYY-MM-DD` format. Defaults to today (Central Time)

**Example Response:**
```json
{
  "data": [
    {
      "id": "747000",
      "homeTeam": {
        "id": "114",
        "name": "Cleveland Guardians",
        "abbreviation": "CLE",
        "logo": "https://..."
      },
      "awayTeam": {
        "id": "133",
        "name": "Oakland Athletics",
        "abbreviation": "OAK",
        "logo": "https://..."
      },
      "gameTime": "2025-01-11T18:10:00.000Z",
      "status": "scheduled",
      "homeScore": 0,
      "awayScore": 0,
      "venue": "Progressive Field"
    }
  ],
  "source": {
    "provider": "MLB Stats API",
    "timestamp": "2025-01-11T12:00:00.000Z",
    "confidence": 1.0
  }
}
```

---

### Get MLB Standings

```http
GET /api/sports/mlb/standings?divisionId=200
```

Fetch MLB division standings.

**Query Parameters:**
- `divisionId` (optional): MLB division ID
  - `200`: American League East
  - `201`: American League Central
  - `202`: American League West
  - `203`: National League East
  - `204`: National League Central
  - `205`: National League West

**Example Response:**
```json
{
  "data": [
    {
      "team": {
        "id": "147",
        "name": "New York Yankees",
        "abbreviation": "NYY"
      },
      "wins": 92,
      "losses": 70,
      "winPercentage": ".568",
      "gamesBack": "0.0",
      "streak": "W3",
      "divisionRank": 1
    }
  ]
}
```

---

### Get MLB Teams

```http
GET /api/sports/mlb/teams
```

Fetch all 30 MLB teams.

**Example Response:**
```json
{
  "data": [
    {
      "id": "147",
      "name": "New York Yankees",
      "abbreviation": "NYY",
      "division": "American League East",
      "venue": "Yankee Stadium",
      "logo": "https://..."
    }
  ]
}
```

---

## NFL

### Get NFL Games

```http
GET /api/sports/nfl/games?week=1&season=2025
```

Fetch NFL games for a specific week and season.

**Query Parameters:**
- `week` (required): Week number (1-18 for regular season)
- `season` (optional): Season year (defaults to current)

**Example Response:**
```json
{
  "data": [
    {
      "id": "12345",
      "homeTeam": {
        "id": "KC",
        "name": "Kansas City Chiefs",
        "abbreviation": "KC"
      },
      "awayTeam": {
        "id": "BUF",
        "name": "Buffalo Bills",
        "abbreviation": "BUF"
      },
      "gameTime": "2025-01-11T20:20:00.000Z",
      "status": "scheduled",
      "homeScore": 0,
      "awayScore": 0
    }
  ]
}
```

---

### Get NFL Standings

```http
GET /api/sports/nfl/standings?season=2025
```

Fetch NFL conference standings.

**Query Parameters:**
- `season` (optional): Season year (defaults to current)

---

### Get NFL Teams

```http
GET /api/sports/nfl/teams
```

Fetch all 32 NFL teams.

---

## NBA

### Get NBA Games

```http
GET /api/sports/nba/games?date=2025-01-11
```

Fetch NBA games for a specific date.

**Query Parameters:**
- `date` (optional): Date in `YYYY-MM-DD` format

---

### Get NBA Standings

```http
GET /api/sports/nba/standings
```

Fetch NBA conference standings.

---

### Get NBA Teams

```http
GET /api/sports/nba/teams
```

Fetch all 30 NBA teams.

---

## College Baseball

**Priority feature** - Full box scores filling the ESPN gap!

### Get College Baseball Games

```http
GET /api/sports/college-baseball/games?date=2025-03-15
```

Fetch college baseball games with **complete box scores**.

**Query Parameters:**
- `date` (optional): Date in `YYYY-MM-DD` format

**Example Response:**
```json
{
  "data": [
    {
      "id": "401234567",
      "homeTeam": {
        "id": "2",
        "name": "LSU Tigers",
        "abbreviation": "LSU",
        "conference": "SEC"
      },
      "awayTeam": {
        "id": "99",
        "name": "Vanderbilt Commodores",
        "abbreviation": "VAN",
        "conference": "SEC"
      },
      "gameTime": "2025-03-15T18:00:00.000Z",
      "status": "final",
      "homeScore": 7,
      "awayScore": 4,
      "inning": 9,
      "venue": "Alex Box Stadium"
    }
  ]
}
```

---

### Get College Baseball Box Score

```http
GET /api/sports/college-baseball/games/401234567
```

Fetch detailed box score for a specific game.

**Path Parameters:**
- `gameId`: ESPN game ID

**Example Response:**
```json
{
  "data": {
    "game": {
      "id": "401234567",
      "homeTeam": { ... },
      "awayTeam": { ... },
      "status": "final"
    },
    "batting": {
      "home": [
        {
          "player": "John Smith",
          "position": "CF",
          "ab": 4,
          "r": 2,
          "h": 3,
          "rbi": 2,
          "bb": 1,
          "so": 0,
          "avg": ".345"
        }
      ],
      "away": [...]
    },
    "pitching": {
      "home": [
        {
          "player": "Mike Johnson",
          "ip": "7.0",
          "h": 6,
          "r": 3,
          "er": 2,
          "bb": 2,
          "so": 9,
          "era": "2.45"
        }
      ],
      "away": [...]
    }
  }
}
```

---

### Get College Baseball Rankings

```http
GET /api/sports/college-baseball/rankings?week=1
```

Fetch D1Baseball rankings.

**Query Parameters:**
- `week` (optional): Poll week number

---

### Get College Baseball Standings

```http
GET /api/sports/college-baseball/standings?conference=SEC
```

Fetch conference standings.

**Query Parameters:**
- `conference` (optional): Conference abbreviation (SEC, ACC, Big 12, etc.)

---

## Unified

Cross-league endpoints for aggregated data.

### Get All Games

```http
GET /api/unified/games?date=2025-01-11
```

Fetch games from **all leagues** (MLB, NFL, NBA, College Baseball).

**Query Parameters:**
- `date` (optional): Date in `YYYY-MM-DD` format

**Example Response:**
```json
{
  "data": {
    "mlb": [...],
    "nfl": [...],
    "nba": [...],
    "ncaaBaseball": [...]
  },
  "source": {
    "provider": "Unified League Orchestrator",
    "timestamp": "2025-01-11T12:00:00.000Z",
    "confidence": 1.0
  }
}
```

---

### Get Live Games

```http
GET /api/unified/live
```

Fetch **only** currently live games from all leagues.

**Example Response:**
```json
{
  "data": {
    "mlb": [
      {
        "id": "747000",
        "status": "live",
        "inning": 5,
        "homeScore": 3,
        "awayScore": 2,
        ...
      }
    ],
    "nfl": [],
    "nba": []
  }
}
```

---

### Get All Standings

```http
GET /api/unified/standings
```

Fetch standings from all leagues.

---

### Search

```http
GET /api/unified/search?q=Yankees
```

Search across all leagues for teams, games, or players.

**Query Parameters:**
- `q` (required): Search query

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Upstream API error

---

## Rate Limiting

**Development**: No rate limiting

**Production**: 
- 100 requests per minute per IP
- 1000 requests per hour per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641945600
```

---

## Data Sources

- **MLB**: Official MLB Stats API (free)
- **NFL**: SportsDataIO (paid API key required)
- **NBA**: SportsDataIO (paid API key required)
- **College Baseball**: ESPN public API + enhanced processing
- **College Football**: ESPN public API

---

## Support

For API issues or questions:
- 📖 Check the [README](../README.md)
- 🐛 Report bugs via [GitHub Issues](https://github.com/ahump20/BSI-NextGen/issues)
- 💬 Ask in [GitHub Discussions](https://github.com/ahump20/BSI-NextGen/discussions)

---

**Last Updated**: November 13, 2025
**API Version**: 1.0.0
