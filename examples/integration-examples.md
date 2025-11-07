# Sandlot Sluggers Backend Integration Examples

Complete integration examples showing how to use the Sandlot Sluggers API in various languages and frameworks.

---

## Table of Contents

1. [React Hook Examples](#react-hook-examples)
2. [JavaScript/Fetch Examples](#javascript-fetch-examples)
3. [Node.js Examples](#nodejs-examples)
4. [Python Examples](#python-examples)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Rate Limiting Best Practices](#rate-limiting-best-practices)

---

## Production API Base URL

```
https://382d06f8.sandlot-sluggers.pages.dev/api
```

---

## React Hook Examples

### Custom Hook: useGlobalStats

```typescript
// hooks/useGlobalStats.ts
import { useState, useEffect } from 'react';

interface GlobalStats {
  activePlayers: number;
  gamesToday: number;
  gamesTotal: number;
  totalHomeRuns: number;
  totalHits: number;
  totalRuns: number;
  topPlayer: {
    id: string;
    name: string;
    homeRuns: number;
  };
  mostPopularStadium: {
    id: string;
    name: string;
    usagePercent: number;
  };
  mostPopularCharacter: {
    id: string;
    name: string;
    usagePercent: number;
  };
  avgGameLength: number;
  lastUpdated: string;
  timezone: string;
}

export function useGlobalStats() {
  const [data, setData] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let retries = 0;
    const maxRetries = 3;

    async function fetchStats() {
      try {
        const response = await fetch(
          'https://382d06f8.sandlot-sluggers.pages.dev/api/stats/global',
          {
            headers: {
              'Origin': window.location.origin,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const stats = await response.json();
        setData(stats);
        setError(null);
      } catch (err) {
        if (retries < maxRetries) {
          retries++;
          // Exponential backoff: 250ms, 500ms, 1000ms
          const delay = 250 * Math.pow(2, retries - 1);
          setTimeout(fetchStats, delay);
        } else {
          setError(err as Error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { data, loading, error };
}
```

### Usage in Component

```tsx
// components/StatsDisplay.tsx
import React from 'react';
import { useGlobalStats } from '../hooks/useGlobalStats';

export function StatsDisplay() {
  const { data, loading, error } = useGlobalStats();

  if (loading) {
    return <div className="loading">Loading stats...</div>;
  }

  if (error) {
    return (
      <div className="error">
        Error loading stats: {error.message}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="stats-container">
      <h2>Global Statistics</h2>

      <div className="stat-card">
        <h3>Active Players</h3>
        <p className="stat-value">{data.activePlayers.toLocaleString()}</p>
      </div>

      <div className="stat-card">
        <h3>Games Today</h3>
        <p className="stat-value">{data.gamesToday.toLocaleString()}</p>
      </div>

      <div className="stat-card">
        <h3>Total Games</h3>
        <p className="stat-value">{data.gamesTotal.toLocaleString()}</p>
      </div>

      <div className="stat-card">
        <h3>Top Player</h3>
        <p className="player-name">{data.topPlayer.name}</p>
        <p className="player-stat">{data.topPlayer.homeRuns} home runs</p>
      </div>

      <div className="stat-card">
        <h3>Most Popular Stadium</h3>
        <p className="stadium-name">{data.mostPopularStadium.name}</p>
        <p className="usage">{data.mostPopularStadium.usagePercent.toFixed(1)}% usage</p>
      </div>

      <p className="timestamp">
        Last updated: {new Date(data.lastUpdated).toLocaleString('en-US', {
          timeZone: 'America/Chicago'
        })}
      </p>
    </div>
  );
}
```

### Custom Hook: useGameResult

```typescript
// hooks/useGameResult.ts
import { useState } from 'react';

interface GameResult {
  playerId: string;
  won: boolean;
  runsScored: number;
  hitsRecorded: number;
  homeRunsHit: number;
}

export function useGameResult() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitGameResult = async (gameData: GameResult) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        'https://382d06f8.sandlot-sluggers.pages.dev/api/game-result',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
          },
          body: JSON.stringify(gameData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit game result');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitGameResult,
    submitting,
    error,
  };
}
```

---

## JavaScript/Fetch Examples

### Fetch Global Stats with Retry

```javascript
async function fetchGlobalStats() {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        'https://382d06f8.sandlot-sluggers.pages.dev/api/stats/global',
        {
          headers: {
            'Origin': window.location.origin,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Global Stats:', data);
      return data;
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const baseDelay = 250 * Math.pow(2, attempt);
        const jitter = Math.random() * baseDelay * 0.1;
        const delay = baseDelay + jitter;

        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Usage
fetchGlobalStats()
  .then(stats => {
    console.log('Active players:', stats.activePlayers);
    console.log('Games today:', stats.gamesToday);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Submit Game Result

```javascript
async function submitGameResult(playerId, won, runsScored, hitsRecorded, homeRunsHit) {
  try {
    const response = await fetch(
      'https://382d06f8.sandlot-sluggers.pages.dev/api/game-result',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          playerId,
          won,
          runsScored,
          hitsRecorded,
          homeRunsHit,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit game result');
    }

    const result = await response.json();
    console.log('Game result submitted successfully:', result);
    console.log('XP gained:', result.xp_gained);
    console.log('Leveled up:', result.leveled_up);

    return result;
  } catch (error) {
    console.error('Error submitting game result:', error);
    throw error;
  }
}

// Usage
submitGameResult('player123', true, 5, 8, 2)
  .then(result => {
    console.log('Success!', result);
  })
  .catch(error => {
    console.error('Failed!', error);
  });
```

### Get Character Stats

```javascript
async function getCharacterStats(characterId = null) {
  const url = characterId
    ? `https://382d06f8.sandlot-sluggers.pages.dev/api/stats/characters?characterId=${characterId}`
    : 'https://382d06f8.sandlot-sluggers.pages.dev/api/stats/characters';

  try {
    const response = await fetch(url, {
      headers: {
        'Origin': window.location.origin,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (characterId) {
      console.log(`Stats for ${data.characterName}:`);
      console.log(`Games played: ${data.gamesPlayed}`);
      console.log(`Win rate: ${data.winRate.toFixed(1)}%`);
      console.log(`Avg home runs: ${data.avgHomeRuns.toFixed(2)}`);
    } else {
      console.log(`Found ${data.characters.length} characters with stats`);
      console.log('Most popular:', data.mostPopular?.characterName || 'None');
    }

    return data;
  } catch (error) {
    console.error('Error fetching character stats:', error);
    throw error;
  }
}

// Usage
getCharacterStats('rocket_rivera');
getCharacterStats(); // Get all characters
```

---

## Node.js Examples

### Using node-fetch with Retry

```javascript
// npm install node-fetch
const fetch = require('node-fetch');

async function withRetry(fn, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = 250 * Math.pow(2, attempt);
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

async function getGlobalStats() {
  return withRetry(async () => {
    const response = await fetch(
      'https://382d06f8.sandlot-sluggers.pages.dev/api/stats/global'
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  });
}

async function getPlayerProgress(playerId) {
  return withRetry(async () => {
    const response = await fetch(
      `https://382d06f8.sandlot-sluggers.pages.dev/api/progress/${playerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  });
}

// Usage
(async () => {
  try {
    const stats = await getGlobalStats();
    console.log('Global Stats:', stats);

    const playerProgress = await getPlayerProgress('player123');
    console.log('Player Progress:', playerProgress);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

### Express.js Proxy Example

```javascript
// npm install express node-fetch
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const API_BASE = 'https://382d06f8.sandlot-sluggers.pages.dev/api';

app.use(express.json());

// Proxy GET requests
app.get('/api/stats/global', async (req, res) => {
  try {
    const response = await fetch(`${API_BASE}/stats/global`);

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch stats from backend',
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy POST requests
app.post('/api/game-result', async (req, res) => {
  try {
    const response = await fetch(`${API_BASE}/game-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Proxy server running on http://localhost:3000');
});
```

---

## Python Examples

### Using requests library with Retry

```python
# pip install requests
import requests
import time
from typing import Dict, Any, Optional

BASE_URL = 'https://382d06f8.sandlot-sluggers.pages.dev/api'

def with_retry(fn, max_retries=3):
    """Retry decorator with exponential backoff"""
    last_error = None

    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as error:
            last_error = error

            if attempt < max_retries - 1:
                delay = 0.25 * (2 ** attempt)  # 250ms, 500ms, 1000ms
                print(f'Retry {attempt + 1}/{max_retries} after {delay * 1000:.0f}ms...')
                time.sleep(delay)

    raise Exception(f'Failed after {max_retries} attempts: {str(last_error)}')

def get_global_stats() -> Dict[str, Any]:
    """Fetch global statistics"""
    def fetch():
        response = requests.get(f'{BASE_URL}/stats/global')
        response.raise_for_status()
        return response.json()

    return with_retry(fetch)

def submit_game_result(
    player_id: str,
    won: bool,
    runs_scored: int,
    hits_recorded: int,
    home_runs_hit: int
) -> Dict[str, Any]:
    """Submit a game result"""
    def submit():
        response = requests.post(
            f'{BASE_URL}/game-result',
            json={
                'playerId': player_id,
                'won': won,
                'runsScored': runs_scored,
                'hitsRecorded': hits_recorded,
                'homeRunsHit': home_runs_hit,
            }
        )
        response.raise_for_status()
        return response.json()

    return with_retry(submit)

def get_player_progress(player_id: str) -> Dict[str, Any]:
    """Get player progress"""
    def fetch():
        response = requests.get(f'{BASE_URL}/progress/{player_id}')
        response.raise_for_status()
        return response.json()

    return with_retry(fetch)

# Usage
if __name__ == '__main__':
    try:
        # Get global stats
        stats = get_global_stats()
        print('Global Stats:', stats)
        print(f"Active players: {stats['activePlayers']}")
        print(f"Games today: {stats['gamesToday']}")

        # Submit game result
        result = submit_game_result(
            player_id='player123',
            won=True,
            runs_scored=5,
            hits_recorded=8,
            home_runs_hit=2
        )
        print(f"XP gained: {result['xp_gained']}")
        print(f"Leveled up: {result['leveled_up']}")

        # Get player progress
        progress = get_player_progress('player123')
        print(f"Games played: {progress['gamesPlayed']}")
        print(f"Current level: {progress['currentLevel']}")

    except Exception as error:
        print(f'Error: {error}')
```

### Using aiohttp for Async Operations

```python
# pip install aiohttp
import asyncio
import aiohttp
from typing import Dict, Any

BASE_URL = 'https://382d06f8.sandlot-sluggers.pages.dev/api'

async def fetch_with_retry(session: aiohttp.ClientSession, url: str, max_retries=3):
    """Async fetch with retry"""
    last_error = None

    for attempt in range(max_retries):
        try:
            async with session.get(url) as response:
                response.raise_for_status()
                return await response.json()
        except Exception as error:
            last_error = error

            if attempt < max_retries - 1:
                delay = 0.25 * (2 ** attempt)
                await asyncio.sleep(delay)

    raise Exception(f'Failed after {max_retries} attempts: {str(last_error)}')

async def get_all_stats():
    """Fetch all stats concurrently"""
    async with aiohttp.ClientSession() as session:
        tasks = [
            fetch_with_retry(session, f'{BASE_URL}/stats/global'),
            fetch_with_retry(session, f'{BASE_URL}/stats/characters'),
            fetch_with_retry(session, f'{BASE_URL}/stats/stadiums'),
        ]

        results = await asyncio.gather(*tasks)

        return {
            'global': results[0],
            'characters': results[1],
            'stadiums': results[2],
        }

# Usage
async def main():
    stats = await get_all_stats()
    print('Global stats:', stats['global'])
    print('Characters:', len(stats['characters']['characters']))
    print('Stadiums:', len(stats['stadiums']['stadiums']))

asyncio.run(main())
```

---

## Error Handling Patterns

### Comprehensive Error Handler

```javascript
class APIError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);

    // Handle different status codes
    if (response.status === 400) {
      const error = await response.json();
      throw new APIError('Bad Request', 400, error);
    }

    if (response.status === 404) {
      throw new APIError('Not Found', 404);
    }

    if (response.status === 429) {
      throw new APIError('Rate Limit Exceeded', 429);
    }

    if (response.status === 500) {
      throw new APIError('Server Error', 500);
    }

    if (!response.ok) {
      throw new APIError(`HTTP ${response.status}`, response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new APIError('Network Error', 0, { originalError: error });
    }

    // Unknown error
    throw new APIError('Unknown Error', 0, { originalError: error });
  }
}

// Usage with error handling
fetchWithErrorHandling('https://382d06f8.sandlot-sluggers.pages.dev/api/stats/global')
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    if (error instanceof APIError) {
      switch (error.statusCode) {
        case 400:
          console.error('Invalid request:', error.details);
          break;
        case 404:
          console.error('Endpoint not found');
          break;
        case 429:
          console.error('Too many requests, please slow down');
          break;
        case 500:
          console.error('Server error, please try again later');
          break;
        case 0:
          console.error('Network error:', error.message);
          break;
        default:
          console.error('Unknown error:', error);
      }
    }
  });
```

---

## Rate Limiting Best Practices

### Client-Side Rate Limiter

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();

    // Remove requests outside the time window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);

      console.log(`Rate limit reached, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Recursively check again
      return this.waitForSlot();
    }

    // Record this request
    this.requests.push(now);
  }

  async execute(fn) {
    await this.waitForSlot();
    return fn();
  }
}

// Usage: 100 requests per minute (as per API limit)
const rateLimiter = new RateLimiter(100, 60000);

async function fetchGlobalStatsWithRateLimit() {
  return rateLimiter.execute(async () => {
    const response = await fetch(
      'https://382d06f8.sandlot-sluggers.pages.dev/api/stats/global'
    );
    return response.json();
  });
}

// Make many requests without hitting rate limit
const promises = Array(150).fill(null).map(() =>
  fetchGlobalStatsWithRateLimit()
);

Promise.all(promises).then(results => {
  console.log(`Successfully fetched ${results.length} responses`);
});
```

---

## WebSocket Integration (Future)

_Note: WebSocket support is planned but not yet implemented. This is a preview of the future API._

```javascript
// Future WebSocket integration for real-time updates
const socket = new WebSocket('wss://382d06f8.sandlot-sluggers.pages.dev/api/ws');

socket.onopen = () => {
  console.log('Connected to real-time updates');

  // Subscribe to global stats
  socket.send(JSON.stringify({
    action: 'subscribe',
    channel: 'global-stats',
  }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'stats-update':
      console.log('Stats updated:', data.payload);
      break;
    case 'game-completed':
      console.log('New game completed:', data.payload);
      break;
    default:
      console.log('Unknown message:', data);
  }
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

socket.onclose = () => {
  console.log('Disconnected from real-time updates');
};
```

---

## Complete Integration Example: React Dashboard

```tsx
// Complete React component integrating multiple endpoints
import React, { useState, useEffect } from 'react';

const API_BASE = 'https://382d06f8.sandlot-sluggers.pages.dev/api';

export function Dashboard() {
  const [globalStats, setGlobalStats] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [statsRes, charRes, stadRes] = await Promise.all([
          fetch(`${API_BASE}/stats/global`),
          fetch(`${API_BASE}/stats/characters`),
          fetch(`${API_BASE}/stats/stadiums`),
        ]);

        const [stats, chars, stads] = await Promise.all([
          statsRes.json(),
          charRes.json(),
          stadRes.json(),
        ]);

        setGlobalStats(stats);
        setCharacters(chars.characters);
        setStadiums(stads.stadiums);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();

    // Refresh every 60 seconds
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Sandlot Sluggers Dashboard</h1>

      {globalStats && (
        <section className="global-stats">
          <h2>Global Statistics</h2>
          <div className="stats-grid">
            <div className="stat">
              <span className="label">Active Players</span>
              <span className="value">{globalStats.activePlayers}</span>
            </div>
            <div className="stat">
              <span className="label">Games Today</span>
              <span className="value">{globalStats.gamesToday}</span>
            </div>
            <div className="stat">
              <span className="label">Total Games</span>
              <span className="value">{globalStats.gamesTotal.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="label">Total Home Runs</span>
              <span className="value">{globalStats.totalHomeRuns.toLocaleString()}</span>
            </div>
          </div>
        </section>
      )}

      <section className="characters">
        <h2>Top Characters</h2>
        <div className="character-list">
          {characters.slice(0, 5).map(char => (
            <div key={char.characterId} className="character-card">
              <h3>{char.characterName}</h3>
              <p>Games: {char.gamesPlayed}</p>
              <p>Win Rate: {char.winRate.toFixed(1)}%</p>
              <p>Avg HR: {char.avgHomeRuns.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stadiums">
        <h2>Popular Stadiums</h2>
        <div className="stadium-list">
          {stadiums.slice(0, 3).map(stadium => (
            <div key={stadium.stadiumId} className="stadium-card">
              <h3>{stadium.stadiumName}</h3>
              <p>Usage: {stadium.usagePercent.toFixed(1)}%</p>
              <p>Avg Runs: {stadium.avgTotalRuns.toFixed(1)}</p>
              <p>HR Rate: {stadium.homeRunRate.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## API Documentation

For complete API reference and interactive testing, visit:

**Swagger UI:** https://382d06f8.sandlot-sluggers.pages.dev/api/docs

---

## Support and Feedback

- **GitHub Issues:** Report bugs or request features
- **API Version:** 1.0.0
- **Last Updated:** 2025-01-07

---

**End of Integration Examples**
