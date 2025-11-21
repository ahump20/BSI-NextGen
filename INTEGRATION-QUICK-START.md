# Blaze Sports Intelligence - Integration Quick Start Guide
**Get Real Sports Data Flowing in Week 1**

---

## 🎯 Week 1 Goal: Real Cardinals Data on Sandlot Sluggers

**Timeline:** 5 days
**Result:** Live MLB standings and Monte Carlo predictions

---

## Day 1: Setup & Audit (4 hours)

### Morning: Audit BSI-1 APIs

```bash
# Navigate to BSI-1 directory
cd /Users/AustinHumphrey/BSI-1

# Test API endpoints
npm install
npm start

# In another terminal, test endpoints
curl http://localhost:3000/api/mlb-standings
curl http://localhost:3000/api/sports-data-real-mlb
curl http://localhost:3000/api/monte-carlo
```

**Expected:** Real Cardinals data, not mock data

**If mock data:** Check `/functions/api/sports-data-real-mlb.js` for API keys

### Afternoon: Backup & Branch

```bash
# Navigate to Sandlot Sluggers
cd /Users/AustinHumphrey/Sandlot-Sluggers

# Backup current state
git tag v1.0-pre-bsi-integration
git push origin v1.0-pre-bsi-integration

# Create feature branch
git checkout -b feature/bsi-integration

# Confirm branch
git branch
# Output: * feature/bsi-integration
```

---

## Day 2: Port MLB Stats API (6 hours)

### Step 1: Copy MLB API Client

```bash
# Create sports directory
mkdir -p /Users/AustinHumphrey/Sandlot-Sluggers/lib/api

# Copy MLB API client from BSI-1
cp /Users/AustinHumphrey/BSI-1/functions/api/sports-data-real-mlb.js \
   /Users/AustinHumphrey/Sandlot-Sluggers/lib/api/mlb-client.ts
```

### Step 2: Convert to TypeScript

Edit `/lib/api/mlb-client.ts`:

```typescript
// /Users/AustinHumphrey/Sandlot-Sluggers/lib/api/mlb-client.ts

interface MLBTeam {
  id: number;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: string;
  runs: number;
  runsAllowed: number;
}

interface MLBStandingsResponse {
  division: string;
  teams: MLBTeam[];
}

export class MLBStatsAPIClient {
  private baseUrl = 'https://statsapi.mlb.com/api/v1';

  async getStandings(season: number = 2025): Promise<MLBStandingsResponse[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason`
      );

      if (!response.ok) {
        throw new Error(`MLB API error: ${response.status}`);
      }

      const data = await response.json();

      return this.parseStandings(data);
    } catch (error) {
      console.error('Failed to fetch MLB standings:', error);
      throw error;
    }
  }

  private parseStandings(data: any): MLBStandingsResponse[] {
    const standings: MLBStandingsResponse[] = [];

    for (const record of data.records) {
      const division: MLBStandingsResponse = {
        division: record.division.name,
        teams: record.teamRecords.map((team: any) => ({
          id: team.team.id,
          name: team.team.name,
          abbreviation: team.team.abbreviation,
          wins: team.wins,
          losses: team.losses,
          winPercentage: parseFloat(team.leagueRecord.pct),
          gamesBack: team.gamesBack,
          runs: team.runsScored,
          runsAllowed: team.runsAllowed
        }))
      };

      standings.push(division);
    }

    return standings;
  }

  async getTeamStats(teamId: number, season: number = 2025) {
    const response = await fetch(
      `${this.baseUrl}/teams/${teamId}?season=${season}`
    );

    if (!response.ok) {
      throw new Error(`MLB API error: ${response.status}`);
    }

    return response.json();
  }
}

export const mlbClient = new MLBStatsAPIClient();
```

### Step 3: Create Pages Function Endpoint

```bash
# Create MLB API directory
mkdir -p /Users/AustinHumphrey/Sandlot-Sluggers/functions/api/mlb
```

Create `/functions/api/mlb/standings.ts`:

```typescript
// /Users/AustinHumphrey/Sandlot-Sluggers/functions/api/mlb/standings.ts

import { mlbClient } from '../../../lib/api/mlb-client';

interface Env {
  KV: KVNamespace;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const season = url.searchParams.get('season') || '2025';

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check KV cache first (TTL: 1 hour for standings)
    const cacheKey = `mlb:standings:${season}`;
    const cached = await env.KV.get(cacheKey, 'json');

    if (cached) {
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        data: cached,
        lastUpdated: new Date().toISOString()
      }), {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=3600' // 1 hour
        }
      });
    }

    // Fetch from MLB Stats API
    const standings = await mlbClient.getStandings(parseInt(season));

    // Cache in KV (1 hour TTL)
    await env.KV.put(cacheKey, JSON.stringify(standings), {
      expirationTtl: 3600
    });

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      data: standings,
      lastUpdated: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('MLB standings endpoint error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
```

### Step 4: Test Locally

```bash
# In Sandlot Sluggers directory
npm run dev

# In another terminal
curl http://localhost:5173/api/mlb/standings

# Expected: Real MLB standings with Cardinals data
```

---

## Day 3: Port Monte Carlo Engine (8 hours)

### Step 1: Copy Monte Carlo Engine

```bash
# Create analytics directory
mkdir -p /Users/AustinHumphrey/Sandlot-Sluggers/lib/analytics

# Copy Monte Carlo engine
cp /Users/AustinHumphrey/BSI-1/monte-carlo-engine.js \
   /Users/AustinHumphrey/Sandlot-Sluggers/lib/analytics/monte-carlo-engine.ts
```

### Step 2: Convert to TypeScript (Basic)

Edit `/lib/analytics/monte-carlo-engine.ts`:

```typescript
// /Users/AustinHumphrey/Sandlot-Sluggers/lib/analytics/monte-carlo-engine.ts

interface SimulationConfig {
  simulations: number;
  convergenceThreshold: number;
  confidenceLevel: number;
}

interface TeamData {
  id: string;
  name: string;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
}

interface SimulationResult {
  teamId: string;
  championshipProbability: number;
  expectedWins: number;
  confidenceInterval: [number, number];
}

export class MonteCarloEngine {
  private config: SimulationConfig;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      simulations: config.simulations || 100000,
      convergenceThreshold: config.convergenceThreshold || 0.001,
      confidenceLevel: config.confidenceLevel || 0.95
    };
  }

  async runChampionshipSimulation(
    teams: TeamData[],
    sport: 'baseball' | 'football' | 'basketball'
  ): Promise<SimulationResult[]> {
    console.log(`Running ${sport} championship simulation (${this.config.simulations} iterations)`);

    const results = new Map<string, number>();

    for (let i = 0; i < this.config.simulations; i++) {
      const winner = this.simulateSeason(teams, sport);
      results.set(winner, (results.get(winner) || 0) + 1);
    }

    return teams.map(team => ({
      teamId: team.id,
      championshipProbability: (results.get(team.id) || 0) / this.config.simulations,
      expectedWins: this.calculateExpectedWins(team),
      confidenceInterval: this.calculateConfidenceInterval(team, results.get(team.id) || 0)
    }));
  }

  private simulateSeason(teams: TeamData[], sport: string): string {
    // Simplified: Use Pythagorean expectation to determine winner
    const teamStrengths = teams.map(team => ({
      id: team.id,
      strength: this.calculateTeamStrength(team, sport)
    }));

    // Weight random selection by team strength
    const totalStrength = teamStrengths.reduce((sum, t) => sum + t.strength, 0);
    let random = Math.random() * totalStrength;

    for (const team of teamStrengths) {
      random -= team.strength;
      if (random <= 0) return team.id;
    }

    return teamStrengths[0].id;
  }

  private calculateTeamStrength(team: TeamData, sport: string): number {
    // Pythagorean expectation
    const exponent = sport === 'baseball' ? 1.83 : 2.37;

    if (team.runsScored === 0 && team.runsAllowed === 0) {
      return 0.5; // Neutral if no data
    }

    return Math.pow(team.runsScored, exponent) /
           (Math.pow(team.runsScored, exponent) + Math.pow(team.runsAllowed, exponent));
  }

  private calculateExpectedWins(team: TeamData): number {
    const totalGames = team.wins + team.losses;
    const strength = this.calculateTeamStrength(team, 'baseball');
    return strength * totalGames;
  }

  private calculateConfidenceInterval(
    team: TeamData,
    wins: number
  ): [number, number] {
    const p = wins / this.config.simulations;
    const n = this.config.simulations;
    const z = 1.96; // 95% confidence

    const margin = z * Math.sqrt((p * (1 - p)) / n);

    return [
      Math.max(0, p - margin),
      Math.min(1, p + margin)
    ];
  }
}

export const monteCarloEngine = new MonteCarloEngine();
```

### Step 3: Create Simulation Endpoint

Create `/functions/api/simulations/run.ts`:

```typescript
// /Users/AustinHumphrey/Sandlot-Sluggers/functions/api/simulations/run.ts

import { MonteCarloEngine } from '../../../lib/analytics/monte-carlo-engine';

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { teams, sport, simulations } = await request.json();

    if (!teams || !sport) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: teams, sport'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const engine = new MonteCarloEngine({ simulations: simulations || 100000 });
    const results = await engine.runChampionshipSimulation(teams, sport);

    // Save to D1 for history
    const simulationId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO simulations (id, sport, teams_count, results, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      simulationId,
      sport,
      teams.length,
      JSON.stringify(results),
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      simulationId,
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Monte Carlo simulation error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
```

### Step 4: Update D1 Schema

```bash
# Add simulations table to schema.sql
cat >> /Users/AustinHumphrey/Sandlot-Sluggers/schema.sql << 'EOF'

-- Monte Carlo Simulations History
CREATE TABLE IF NOT EXISTS simulations (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  teams_count INTEGER NOT NULL,
  results TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_simulations_sport ON simulations(sport);
CREATE INDEX idx_simulations_created_at ON simulations(created_at);
EOF

# Apply schema update
wrangler d1 execute blaze-db --file=./schema.sql
```

---

## Day 4: Create Dashboard Page (6 hours)

### Step 1: Create Dashboard HTML

Create `/public/dashboard.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Championship Dashboard - Blaze Sports Intel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #fff;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      background: linear-gradient(45deg, #ff6b00, #ff8c00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: #aaa;
      margin-bottom: 40px;
    }

    .widget-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .widget {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 107, 0, 0.3);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }

    .widget h2 {
      font-size: 1.3rem;
      margin-bottom: 15px;
      color: #ff6b00;
    }

    .standings-table {
      width: 100%;
      border-collapse: collapse;
    }

    .standings-table th {
      text-align: left;
      padding: 10px;
      border-bottom: 2px solid rgba(255, 107, 0, 0.5);
      color: #ff6b00;
      font-weight: 600;
    }

    .standings-table td {
      padding: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .standings-table tr:hover {
      background: rgba(255, 107, 0, 0.1);
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #aaa;
    }

    .error {
      background: rgba(255, 0, 0, 0.1);
      border: 1px solid rgba(255, 0, 0, 0.3);
      padding: 15px;
      border-radius: 8px;
      color: #ff6666;
    }

    .timestamp {
      font-size: 0.85rem;
      color: #666;
      margin-top: 10px;
    }

    .probability-bar {
      background: rgba(255, 255, 255, 0.1);
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }

    .probability-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff6b00, #ff8c00);
      transition: width 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ Championship Dashboard</h1>
    <p class="subtitle">Real-time analytics powered by Monte Carlo simulations</p>

    <div class="widget-grid">
      <!-- MLB Standings Widget -->
      <div class="widget">
        <h2>🟢 MLB Standings - NL Central</h2>
        <div id="mlb-standings" class="loading">Loading MLB standings...</div>
      </div>

      <!-- Championship Predictions Widget -->
      <div class="widget">
        <h2>🏆 Championship Probabilities</h2>
        <div id="championship-predictions" class="loading">Running simulations...</div>
      </div>
    </div>
  </div>

  <script>
    // Fetch MLB standings
    async function loadMLBStandings() {
      try {
        const response = await fetch('/api/mlb/standings?season=2025');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        // Find NL Central
        const nlCentral = data.data.find(d => d.division.includes('Central'));

        if (!nlCentral) {
          throw new Error('NL Central not found');
        }

        // Sort by wins
        const teams = nlCentral.teams.sort((a, b) => b.wins - a.wins);

        // Render table
        const html = `
          <table class="standings-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>W</th>
                <th>L</th>
                <th>PCT</th>
                <th>GB</th>
              </tr>
            </thead>
            <tbody>
              ${teams.map(team => `
                <tr>
                  <td><strong>${team.abbreviation}</strong></td>
                  <td>${team.wins}</td>
                  <td>${team.losses}</td>
                  <td>${team.winPercentage.toFixed(3)}</td>
                  <td>${team.gamesBack}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="timestamp">
            ${data.cached ? 'Cached' : 'Live'} • Updated ${new Date(data.lastUpdated).toLocaleString()}
          </div>
        `;

        document.getElementById('mlb-standings').innerHTML = html;

        // Run championship predictions
        runChampionshipPredictions(teams);

      } catch (error) {
        document.getElementById('mlb-standings').innerHTML = `
          <div class="error">
            Failed to load MLB standings: ${error.message}
          </div>
        `;
      }
    }

    // Run Monte Carlo championship predictions
    async function runChampionshipPredictions(teams) {
      try {
        const response = await fetch('/api/simulations/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sport: 'baseball',
            simulations: 10000, // Quick for demo
            teams: teams.map(t => ({
              id: t.id.toString(),
              name: t.name,
              wins: t.wins,
              losses: t.losses,
              runsScored: t.runs,
              runsAllowed: t.runsAllowed
            }))
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        // Sort by probability
        const results = data.results.sort((a, b) =>
          b.championshipProbability - a.championshipProbability
        );

        // Render predictions
        const html = `
          <div>
            ${results.map(result => {
              const team = teams.find(t => t.id === parseInt(result.teamId));
              const probability = (result.championshipProbability * 100).toFixed(1);

              return `
                <div style="margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${team.abbreviation}</strong>
                    <span>${probability}%</span>
                  </div>
                  <div class="probability-bar">
                    <div class="probability-fill" style="width: ${probability}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="timestamp">
            10,000 simulations • ${new Date(data.timestamp).toLocaleString()}
          </div>
        `;

        document.getElementById('championship-predictions').innerHTML = html;

      } catch (error) {
        document.getElementById('championship-predictions').innerHTML = `
          <div class="error">
            Failed to run simulations: ${error.message}
          </div>
        `;
      }
    }

    // Load on page load
    loadMLBStandings();
  </script>
</body>
</html>
```

---

## Day 5: Deploy & Test (4 hours)

### Step 1: Test Locally

```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:5173/dashboard.html

# Expected:
# - Real MLB standings
# - Championship probabilities from Monte Carlo simulations
# - Cardinals data visible
```

### Step 2: Deploy to Preview

```bash
# Commit changes
git add .
git commit -m "feat: Add MLB Stats API and Monte Carlo engine integration

- Port MLB Stats API client from BSI-1
- Convert to TypeScript
- Add KV caching (1 hour TTL for standings)
- Port Monte Carlo engine (100k simulations)
- Create championship dashboard with real data
- Add simulations history to D1 database

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to preview
git push origin feature/bsi-integration

# Deploy to Cloudflare Pages (preview)
npx wrangler pages deploy dist --project-name sandlot-sluggers --branch feature/bsi-integration
```

### Step 3: Verify Preview Deployment

```bash
# Get preview URL from Wrangler output
# Example: https://abc123.sandlot-sluggers.pages.dev

# Test endpoints
curl https://abc123.sandlot-sluggers.pages.dev/api/mlb/standings

# Open dashboard in browser
open https://abc123.sandlot-sluggers.pages.dev/dashboard.html
```

### Step 4: Share with Stakeholders

**Week 1 Deliverables:**
- ✅ Real MLB standings (Cardinals data)
- ✅ Monte Carlo championship predictions
- ✅ Interactive dashboard
- ✅ KV caching (API responses cached for 1 hour)
- ✅ D1 simulation history
- ✅ Preview deployment live

**Demo URL:** `https://[your-preview].sandlot-sluggers.pages.dev/dashboard.html`

---

## 🎯 Quick Reference: Key Files Created

```
/Users/AustinHumphrey/Sandlot-Sluggers/

├── lib/
│   ├── api/
│   │   └── mlb-client.ts (NEW - MLB Stats API client)
│   └── analytics/
│       └── monte-carlo-engine.ts (NEW - Monte Carlo engine)
│
├── functions/
│   └── api/
│       ├── mlb/
│       │   └── standings.ts (NEW - MLB standings endpoint)
│       └── simulations/
│           └── run.ts (NEW - Monte Carlo simulation endpoint)
│
├── public/
│   └── dashboard.html (NEW - Championship dashboard)
│
└── schema.sql (UPDATED - Added simulations table)
```

---

## 🚀 Next Steps (Week 2)

After Week 1 success:

1. **Add NFL/NBA Data**
   - Port ESPN API client from BSI-1
   - Create `/api/nfl/standings` and `/api/nba/standings`
   - Add to dashboard

2. **Enhance Monte Carlo**
   - Add confidence intervals visualization
   - Implement Web Workers for parallel processing
   - Add season projection (not just championship)

3. **Improve Dashboard**
   - Add live score updates (WebSocket or polling)
   - Add historical charts (Three.js visualizations)
   - Mobile optimization

4. **Security Fixes**
   - Fix CORS wildcard in game-result.ts
   - Add security headers middleware
   - Implement request timeouts
   - Add retry logic

---

## 📊 Success Metrics (End of Week 1)

- [ ] Real Cardinals standings visible on dashboard
- [ ] Monte Carlo simulations complete in <5 seconds
- [ ] API response time <200ms
- [ ] KV cache hit rate >50% (after warmup)
- [ ] Zero 500 errors on endpoints
- [ ] Preview deployment accessible from phone
- [ ] Stakeholder approval to continue Week 2-8

---

## 🆘 Troubleshooting

### Issue: MLB API returns 403 or 429
**Cause:** Rate limit exceeded
**Fix:**
```typescript
// Add retry with exponential backoff
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;

      if (response.status === 429) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

### Issue: KV cache not working
**Cause:** KV namespace not bound
**Fix:**
```bash
# Verify KV binding in wrangler.toml
cat wrangler.toml | grep -A 2 "kv_namespaces"

# Should show:
# [[kv_namespaces]]
# binding = "KV"
# id = "YOUR_ID_HERE"
```

### Issue: Monte Carlo too slow
**Cause:** Running 100k simulations synchronously
**Fix:** Reduce to 10k for initial testing
```typescript
const engine = new MonteCarloEngine({ simulations: 10000 });
```

Later, implement Web Workers for parallel processing.

---

**Quick Start Guide By:** Claude Sonnet 4.5
**Date:** November 7, 2025, 16:00 CST
**Status:** Ready for Week 1 execution
