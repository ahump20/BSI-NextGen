# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**BSI-NextGen** is a professional sports intelligence platform built as a **TypeScript monorepo with pnpm workspaces**. The platform delivers real-time sports data from official APIs with mobile-first design.

**Core Mission:** Fill ESPN's gaps (especially college baseball box scores) with complete, real-time sports coverage.

---

## Unique Features That Set BSI-NextGen Apart

BSI-NextGen is not just another sports platform. Here are the distinctive features that make it unique:

### 1. Major Moments Index (MMI) System

**What it is:** A proprietary baseball analytics engine that quantifies the psychological difficulty of every pitch using 5 factors.

**The Formula:**
```
MMI = 0.35·z(Leverage Index) + 0.20·z(Pressure) + 0.20·z(Fatigue) + 0.15·z(Execution) + 0.10·z(Biometric)
```

**Why it matters:** Unlike traditional stats that focus on outcomes, MMI measures mental difficulty—the TRUE challenge athletes face.

**Key Components:**
- **Leverage Index (35%)** - Game situation criticality (0-10 scale)
- **Pressure Score (20%)** - Crowd noise, streak status, playoff stakes
- **Fatigue Score (20%)** - Pitch count, innings, days rest
- **Execution Demand (15%)** - Pitch velocity, movement, location precision
- **Biometric Indicators (10%)** - Heart rate variability, muscle tension (when available)

**Implementation:** Powered by Cloudflare Workers with D1 database, exposed via `/api/sports/mlb/mmi/*` endpoints.

**Frontend Integration:**
- Real-time MMI scores displayed in game cards
- Color-coded pressure indicators (green → yellow → red)
- Breakdown tooltips showing component scores
- Historical MMI trends and player comparisons

### 2. Pitch Tunnel Simulator (3D Visualization)

**What it is:** An interactive 3D pitch visualization tool with real physics simulation using Babylon.js.

**Real Physics Implementation:**
```typescript
// Magnus Force (spin-induced movement)
F_magnus = (1/2) * ρ * A * C_L * v²
C_L = S / (v * d)  // Lift coefficient from spin rate

// Drag Force (air resistance)
F_drag = (1/2) * ρ * A * C_D * v²
```

**Features:**
- **Statcast Integration** - Real pitch data from MLB's tracking system
- **Pitcher Comparison** - Compare breaking balls side-by-side
- **Custom Pitch Design** - Create hypothetical pitches with physics validation
- **60 FPS Simulation** - Smooth, accurate trajectory rendering
- **Batter's Eye View** - See exactly what the hitter sees

**Technology Stack:**
- Babylon.js for 3D rendering
- Cloudflare Workers for data delivery
- D1 database for pitch library (7-day cache TTL)
- WebGL acceleration for 60 FPS performance

**API Endpoints:**
- `GET /api/pitch-tunnel/pitchers/search` - Find pitchers by name/team
- `GET /api/pitch-tunnel/pitchers/:id/pitches` - Get pitcher's arsenal
- `POST /api/pitch-tunnel/design` - Create custom pitch with physics validation

### 3. Real-Time Edge Computing

**What it is:** 8+ Cloudflare Workers deployed at the edge for <50ms response times globally.

**Performance Targets:**
- Sub-30-second data freshness for live games
- <10ms cache hits via Cloudflare KV
- <200ms P99 API response time (measured)
- 99.9% uptime SLA

**Key Workers:**
- **MMI Engine** - Real-time moment scoring for live games
- **Pitch Tunnel** - 3D physics simulation data delivery
- **Blaze Trends** - AI-powered sports news monitoring with GPT-4 Turbo
- **Blaze Ingestion** - Multi-source data pipeline aggregation
- **Blaze Content** - Content management and caching layer

**Edge Architecture Benefits:**
- Global deployment across 300+ cities
- Automatic failover and redundancy
- Zero cold starts with Workers
- D1 database replication for resilience

### 4. AI-Powered Trend Detection (Blaze Trends)

**What it is:** Automated sports news monitoring with GPT-4 Turbo-powered trend identification.

**How it Works:**
1. **Brave Search API** - Crawl sports news every 15 minutes (cron)
2. **GPT-4 Turbo Analysis** - Identify emerging stories across 7 sports
3. **D1 Storage** - Persist trends with metadata (source, confidence, sport)
4. **KV Caching** - Sub-10ms retrieval for trending topics
5. **Frontend Display** - Real-time trend cards with filtering

**Monitoring Capabilities:**
- Multi-sport coverage (MLB, NFL, NBA, NCAA Football, NCAA Basketball, College Baseball, Youth Sports)
- Confidence scoring (0-100) based on source count and recency
- Source attribution and link aggregation
- Sport-specific filtering and search

**Automation:**
- Cron schedule: Every 15 minutes during peak hours
- Automatic deduplication of similar stories
- Trend decay based on age and engagement
- Error logging and alerting via D1

---

## Monorepo Structure

### Workspace Packages

```
packages/
├── shared/             # @bsi/shared - Common types and utilities
├── api/                # @bsi/api - Sports data adapters
├── web/                # @bsi/web - Next.js web application
├── sports-dashboard/   # Sports dashboard components
├── mcp-sportsdata-io/  # Model Context Protocol server for SportsData.io
└── mmi-baseball/       # Major Moments Index for baseball analytics (Python)
```

### Package Dependencies

```
@bsi/web → @bsi/api → @bsi/shared
                 ↘
          sports-dashboard
          mcp-sportsdata-io → SportsData.io APIs
          mmi-baseball (Python package)
```

---

## Common Commands

### Development

```bash
# Install all dependencies
pnpm install

# Build all packages (required before first dev run)
pnpm build

# Start web dev server (Next.js)
pnpm dev                    # http://localhost:3000

# Start API in watch mode
pnpm dev:api                # TypeScript watch mode

# Build production
pnpm build                  # Builds shared → api → web in order
```

### Package-Specific Commands

```bash
# Run command in specific package
pnpm --filter @bsi/web dev
pnpm --filter @bsi/api build
pnpm --filter @bsi/shared test

# Run command in all packages
pnpm -r build               # Recursive build
pnpm -r clean               # Clean all packages
```

### Testing

```bash
# Playwright E2E tests
npx playwright install      # Install browsers (first time only)
npx playwright test         # Run all tests
npx playwright test --ui    # UI mode
npx playwright show-report  # Show test results

# Mobile regression tests
.claude/tests/mobile-regression.sh --create-baseline
.claude/tests/mobile-regression.sh --performance
.claude/tests/mobile-regression.sh --all

# SportsDataIO Integration Test
pnpm test:sportsdataio        # Test NFL and NBA API integration
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

### Clean & Reset

```bash
# Remove all build artifacts and node_modules
pnpm clean

# Full reset (clean + reinstall)
pnpm clean && pnpm install
```

### Cloudflare Workers

BSI-NextGen uses 8+ production Cloudflare Workers for edge computing and real-time analytics. Each worker is optimized for specific tasks with dedicated D1 databases and KV stores.

---

#### MMI Engine Worker

**Purpose:** Real-time Major Moments Index calculation for live baseball games.

**Location:** `cloudflare-workers/mmi-engine/`

**The MMI Formula:**
```typescript
// Moment Mentality Index (0-100 scale)
MMI = 0.35·z(LI) + 0.20·z(Pressure) + 0.20·z(Fatigue) + 0.15·z(Execution) + 0.10·z(Bio)

// Where z() is standard score normalization:
z(x) = (x - μ) / σ
```

**Component Calculations:**

1. **Leverage Index (35% weight)**
   ```typescript
   // From Win Probability Added (WPA)
   LI = abs(WPA_after - WPA_before)
   // Range: 0-10, typical values: 0.5-3.0
   ```

2. **Pressure Score (20% weight)**
   ```typescript
   Pressure = w1·crowd_factor + w2·streak_pressure + w3·playoff_multiplier
   // crowd_factor: 0-10 (attendance %, noise level)
   // streak_pressure: 0-5 (team/player streak status)
   // playoff_multiplier: 1.0-2.5 (regular=1.0, playoffs=2.5)
   ```

3. **Fatigue Score (20% weight)**
   ```typescript
   Fatigue = (pitch_count/100) + (innings_pitched/9) + (1 - days_rest/5)
   // Normalized to 0-10 scale
   ```

4. **Execution Demand (15% weight)**
   ```typescript
   Execution = velocity_factor + movement_factor + location_precision
   // velocity_factor: (velo - 85) / 15  // 85-100 mph range
   // movement_factor: break_inches / 24  // 0-24 inch break
   // location_precision: edge_distance / 17  // inches from plate edge
   ```

5. **Biometric Indicators (10% weight)**
   ```typescript
   Bio = (heart_rate - resting_HR) / max_HR_range
   // When available: heart rate variability, muscle tension sensors
   // Defaults to 5.0 when data unavailable
   ```

**D1 Database Schema:**

```sql
-- Table: mmi_moments
CREATE TABLE mmi_moments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  inning INTEGER NOT NULL,
  pitch_number INTEGER NOT NULL,
  mmi_score REAL NOT NULL,
  leverage_index REAL,
  pressure_score REAL,
  fatigue_score REAL,
  execution_demand REAL,
  biometric_score REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_game_id (game_id),
  INDEX idx_mmi_score (mmi_score DESC)
);

-- Table: player_streaks
CREATE TABLE player_streaks (
  player_id TEXT PRIMARY KEY,
  current_streak INTEGER,
  streak_type TEXT,  -- 'hitting' | 'pitching' | 'winning'
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: game_summary
CREATE TABLE game_summary (
  game_id TEXT PRIMARY KEY,
  peak_mmi REAL,
  peak_moment TEXT,  -- Inning/play description
  total_high_leverage_pitches INTEGER,
  average_mmi REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: calibration
CREATE TABLE calibration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  component TEXT NOT NULL,  -- 'leverage' | 'pressure' | 'fatigue' | etc.
  mean REAL,
  std_dev REAL,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints:**

```typescript
// Get real-time MMI for live game
GET /api/mmi/games/today
Response: {
  games: [
    {
      game_id: "2025_11_21_nyy_at_bos",
      current_mmi: 78.5,
      peak_mmi: 92.3,
      high_leverage_count: 12,
      last_updated: "2025-11-21T19:45:23Z"
    }
  ]
}

// Get top MMI moments across all games
GET /api/mmi/top?limit=10&days=7
Response: {
  moments: [
    {
      game_id: "...",
      inning: 9,
      description: "Bottom 9th, bases loaded, 2 outs, down by 1",
      mmi_score: 95.7,
      breakdown: {
        leverage: 9.2,
        pressure: 8.5,
        fatigue: 7.1,
        execution: 6.8,
        biometric: 7.9
      },
      timestamp: "2025-11-21T22:15:00Z"
    }
  ]
}

// Get MMI breakdown for specific game
GET /api/mmi/:gameId
Response: {
  game_id: "2025_11_21_nyy_at_bos",
  moments: [...],
  summary: {
    peak_mmi: 92.3,
    average_mmi: 45.2,
    high_leverage_pitches: 12,
    pressure_timeline: [...]
  }
}

// Update MMI for new play (internal)
POST /api/mmi/calculate
Body: {
  game_id: "...",
  play_data: {...}
}

// Health check
GET /health
Response: { status: "healthy", db_status: "connected", cache_hit_rate: 0.87 }
```

**Frontend Integration:**

```typescript
// Real-time MMI display in game card
import { useMMI } from '@/hooks/useMMI';

export function GameCard({ gameId }) {
  const { mmi, breakdown, isLoading } = useMMI(gameId);

  // Color-coded pressure indicator
  const getPressureColor = (score: number) => {
    if (score >= 80) return 'bg-red-600';      // Extreme
    if (score >= 60) return 'bg-orange-500';   // High
    if (score >= 40) return 'bg-yellow-400';   // Medium
    return 'bg-green-500';                     // Low
  };

  return (
    <div className="mmi-indicator">
      <div className={getPressureColor(mmi)} />
      <span>MMI: {mmi.toFixed(1)}</span>
      {/* Breakdown tooltip */}
      <Tooltip>
        <div>Leverage: {breakdown.leverage}</div>
        <div>Pressure: {breakdown.pressure}</div>
        <div>Fatigue: {breakdown.fatigue}</div>
        <div>Execution: {breakdown.execution}</div>
      </Tooltip>
    </div>
  );
}
```

**Commands:**

```bash
# Local development
cd cloudflare-workers/mmi-engine
wrangler dev

# Deploy to production
wrangler deploy

# Monitor logs
wrangler tail

# Query D1 database
wrangler d1 execute mmi-db --command "SELECT * FROM mmi_moments ORDER BY mmi_score DESC LIMIT 10"

# Test MMI calculation
curl -X POST http://localhost:8787/api/mmi/calculate \
  -H "Content-Type: application/json" \
  -d '{"game_id":"test_game","play_data":{...}}'
```

**Performance Metrics:**
- Calculation time: <15ms per pitch
- D1 query time: <25ms P95
- KV cache hit rate: 85%+
- Update frequency: Real-time (every pitch)

---

#### Pitch Tunnel Simulator Worker

**Purpose:** Deliver 3D pitch visualization data with real physics calculations.

**Location:** `cloudflare-workers/pitch-tunnel/`

**Physics Engine:**

```typescript
// Core physics simulation (runs at 60 FPS in browser)
interface PitchPhysics {
  // Initial conditions
  velocity: Vector3;      // mph → m/s conversion
  spin_rate: number;      // rpm
  spin_axis: Vector3;     // degrees from vertical
  release_point: Vector3; // feet from home plate

  // Forces (Newtons)
  gravity: Vector3;       // -9.81 m/s² vertical
  magnus: Vector3;        // Spin-induced lift
  drag: Vector3;          // Air resistance
}

// Magnus Force (spin creates pressure differential)
function calculateMagnus(
  velocity: number,      // m/s
  spin_rate: number,     // rpm → rad/s
  ball_diameter: number  // 0.074 m (regulation baseball)
): number {
  const rho = 1.225;  // Air density (kg/m³) at sea level
  const A = Math.PI * Math.pow(ball_diameter / 2, 2);  // Cross-sectional area
  const omega = spin_rate * (2 * Math.PI / 60);  // rpm → rad/s
  const S = omega * ball_diameter / 2;  // Surface velocity

  // Lift coefficient (empirical from wind tunnel data)
  const C_L = S / (velocity * ball_diameter);

  // Magnus force magnitude
  const F_magnus = 0.5 * rho * A * C_L * Math.pow(velocity, 2);

  return F_magnus;
}

// Drag Force (quadratic air resistance)
function calculateDrag(
  velocity: number,
  ball_diameter: number
): number {
  const rho = 1.225;
  const A = Math.PI * Math.pow(ball_diameter / 2, 2);
  const C_D = 0.4;  // Drag coefficient for smooth sphere (approximation)

  const F_drag = 0.5 * rho * A * C_D * Math.pow(velocity, 2);

  return F_drag;
}

// Trajectory integration (Euler method, 60 FPS)
function simulateTrajectory(pitch: PitchPhysics): Vector3[] {
  const dt = 1 / 60;  // 60 FPS time step
  const positions: Vector3[] = [];

  let pos = pitch.release_point.clone();
  let vel = pitch.velocity.clone();

  // Simulate until ball crosses home plate (60.5 feet)
  while (pos.z < 60.5) {
    // Calculate forces
    const F_gravity = new Vector3(0, -9.81 * 0.145, 0);  // kg → lbs conversion
    const F_magnus = calculateMagnus(vel.length(), pitch.spin_rate, 0.074);
    const F_drag = calculateDrag(vel.length(), 0.074);

    // Apply forces (F = ma, a = F/m, m = 0.145 kg)
    const a_gravity = F_gravity.scale(1 / 0.145);
    const a_magnus = pitch.spin_axis.scale(F_magnus / 0.145);
    const a_drag = vel.normalize().scale(-F_drag / 0.145);

    const a_total = a_gravity.add(a_magnus).add(a_drag);

    // Euler integration
    vel = vel.add(a_total.scale(dt));
    pos = pos.add(vel.scale(dt));

    positions.push(pos.clone());
  }

  return positions;
}
```

**D1 Database Schema:**

```sql
-- Table: pitchers
CREATE TABLE pitchers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT,
  mlb_id INTEGER,
  statcast_id TEXT,
  INDEX idx_name (name)
);

-- Table: pitch_arsenal
CREATE TABLE pitch_arsenal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pitcher_id TEXT NOT NULL,
  pitch_type TEXT NOT NULL,  -- 'FF' | 'SL' | 'CU' | 'CH' | 'SI' | etc.
  avg_velocity REAL,
  avg_spin_rate REAL,
  avg_break_x REAL,  -- Horizontal break (inches)
  avg_break_z REAL,  -- Vertical break (inches)
  spin_axis REAL,    -- Degrees from vertical
  release_x REAL,
  release_y REAL,
  release_z REAL,
  usage_pct REAL,
  whiff_rate REAL,
  FOREIGN KEY (pitcher_id) REFERENCES pitchers(id)
);

-- Table: pitch_designs
CREATE TABLE pitch_designs (
  id TEXT PRIMARY KEY,
  user_id TEXT,  -- Optional user attribution
  pitch_name TEXT,
  velocity REAL,
  spin_rate REAL,
  spin_axis REAL,
  release_point TEXT,  -- JSON: {x, y, z}
  physics_valid BOOLEAN,  -- Passes physics validation
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at DESC)
);

-- Table: pitch_cache
CREATE TABLE pitch_cache (
  cache_key TEXT PRIMARY KEY,
  trajectory_data TEXT,  -- JSON array of Vector3 positions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ttl INTEGER DEFAULT 604800  -- 7 days in seconds
);
```

**API Endpoints:**

```typescript
// Search for pitchers
GET /api/pitch-tunnel/pitchers/search?q=kershaw&limit=10
Response: {
  pitchers: [
    {
      id: "kershaw-clayton",
      name: "Clayton Kershaw",
      team: "LAD",
      mlb_id: 477132,
      statcast_id: "477132"
    }
  ]
}

// Get pitcher's arsenal
GET /api/pitch-tunnel/pitchers/:id/pitches
Response: {
  pitcher: {...},
  arsenal: [
    {
      pitch_type: "FF",
      name: "Four-Seam Fastball",
      avg_velocity: 91.5,
      avg_spin_rate: 2450,
      avg_break_x: -4.2,
      avg_break_z: 16.8,
      spin_axis: 225,
      release_point: {x: -2.1, y: 5.8, z: 54.5},
      usage_pct: 42.3,
      whiff_rate: 0.28
    },
    {
      pitch_type: "SL",
      name: "Slider",
      avg_velocity: 87.2,
      avg_spin_rate: 2680,
      avg_break_x: 6.8,
      avg_break_z: 2.1,
      spin_axis: 45,
      release_point: {x: -2.0, y: 5.9, z: 54.3},
      usage_pct: 35.1,
      whiff_rate: 0.41
    }
  ]
}

// Get simulated trajectory
GET /api/pitch-tunnel/trajectory?pitcher_id=...&pitch_type=SL
Response: {
  trajectory: [
    {x: -2.0, y: 5.9, z: 54.3},  // Release point
    {x: -1.95, y: 5.85, z: 55.1},
    // ... 60 FPS positions
    {x: 0.2, y: 2.1, z: 60.5}    // Home plate
  ],
  physics: {
    time_to_plate: 0.42,  // seconds
    perceived_velocity: 88.7,  // mph (slower than actual)
    max_break: 6.8,  // inches
    break_point: 20.5  // feet from plate
  }
}

// Create custom pitch design
POST /api/pitch-tunnel/design
Body: {
  pitch_name: "My Slider",
  velocity: 86,
  spin_rate: 2600,
  spin_axis: 50,
  release_point: {x: -2.0, y: 6.0, z: 54.0}
}
Response: {
  design_id: "design_abc123",
  physics_valid: true,
  trajectory: [...],
  warnings: []  // e.g., "Spin rate high for velocity"
}

// Compare two pitches side-by-side
GET /api/pitch-tunnel/compare?pitcher1=...&pitch1=SL&pitcher2=...&pitch2=SL
Response: {
  pitch1: {...},
  pitch2: {...},
  comparison: {
    velocity_diff: 2.3,
    break_diff: {x: 1.5, z: -0.8},
    similarity_score: 0.87  // 0-1, cosine similarity of trajectories
  }
}

// Health check
GET /health
Response: { status: "healthy", db_status: "connected", cache_size_mb: 45.2 }
```

**Frontend Integration:**

```typescript
// Iframe wrapper component
export function PitchTunnelViewer({ pitcherId, pitchType }) {
  const iframeUrl = `https://pitch-tunnel.blazesportsintel.com/viewer?pitcher=${pitcherId}&pitch=${pitchType}`;

  return (
    <iframe
      src={iframeUrl}
      width="800"
      height="600"
      style={{ border: 'none' }}
      allow="accelerometer; gyroscope"  // For device orientation controls
    />
  );
}

// Direct Babylon.js integration (advanced)
import { Scene, Engine, ArcRotateCamera, Vector3 } from '@babylonjs/core';

export function PitchTunnel3D({ trajectory }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // Camera setup (batter's POV)
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 3,
      20,
      new Vector3(0, 3, 60.5),  // Home plate position
      scene
    );

    // Render baseball trajectory
    const path = trajectory.map(p => new Vector3(p.x, p.y, p.z));
    const tube = MeshBuilder.CreateTube("path", {
      path,
      radius: 0.037,  // Baseball radius in meters
      tessellation: 32
    }, scene);

    engine.runRenderLoop(() => scene.render());

    return () => engine.dispose();
  }, [trajectory]);

  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

**Commands:**

```bash
# Local development
cd cloudflare-workers/pitch-tunnel
wrangler dev

# Deploy
wrangler deploy

# Update pitcher database from Statcast
node scripts/update-statcast-data.js

# Validate physics calculations
npm run test:physics

# Clear trajectory cache
wrangler d1 execute pitch-tunnel-db --command "DELETE FROM pitch_cache WHERE created_at < datetime('now', '-7 days')"
```

**Performance Metrics:**
- Trajectory calculation: <30ms
- D1 pitch library query: <20ms P95
- Cache TTL: 7 days
- Trajectory points: 25-60 per pitch (60 FPS * 0.4-1.0s)

---

#### Blaze Trends Worker

**Purpose:** Real-time sports news monitoring with AI-powered trend analysis

**Location:** `cloudflare-workers/blaze-trends/`

```bash
# Local development
pnpm trends:dev              # Start worker (http://localhost:8787)

# Deployment
pnpm trends:deploy           # Deploy to Cloudflare

# Monitoring
pnpm trends:tail             # View real-time logs
pnpm trends:health           # Health check all endpoints

# Database management
pnpm trends:db list          # List recent trends
pnpm trends:db stats         # Database statistics
pnpm trends:db errors        # View error logs
pnpm trends:db help          # Show all db commands

# Initial setup
pnpm trends:setup            # Run setup wizard
```

**D1 Database Schema:**

```sql
-- Table: trends
CREATE TABLE trends (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,  -- 'mlb' | 'nfl' | 'nba' | 'college_baseball' | etc.
  headline TEXT NOT NULL,
  summary TEXT,
  confidence REAL,  -- 0-100 score from GPT-4
  source_count INTEGER,
  sources TEXT,  -- JSON array of URLs
  keywords TEXT,  -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  decay_score REAL DEFAULT 100,  -- Decreases over time
  INDEX idx_sport (sport),
  INDEX idx_confidence (confidence DESC),
  INDEX idx_created (created_at DESC)
);

-- Table: trend_sources
CREATE TABLE trend_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trend_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  published_at DATETIME,
  FOREIGN KEY (trend_id) REFERENCES trends(id)
);

-- Table: monitoring_log
CREATE TABLE monitoring_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT,
  trends_found INTEGER,
  api_calls INTEGER,
  gpt4_tokens INTEGER,
  errors TEXT,  -- JSON array
  execution_time_ms INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp DESC)
);
```

**AI Analysis Pipeline:**

```typescript
// GPT-4 Turbo prompt for trend identification
const TREND_PROMPT = `
You are a sports analyst identifying emerging trends from news articles.

Articles: ${JSON.stringify(articles)}

For each significant trend, output JSON:
{
  "headline": "Brief, compelling headline (max 80 chars)",
  "summary": "2-3 sentence summary",
  "confidence": 0-100 (based on source count, recency, significance),
  "keywords": ["keyword1", "keyword2", ...],
  "sport": "mlb" | "nfl" | "nba" | etc.
}

Only identify trends with confidence >= 60.
`;

// Decay algorithm (trends fade over time)
function calculateDecay(created_at: Date): number {
  const hours_old = (Date.now() - created_at.getTime()) / (1000 * 60 * 60);
  const decay_rate = 0.05;  // 5% per hour
  return Math.max(0, 100 - (hours_old * decay_rate));
}
```

**API Endpoints:**
- `GET /health` - Health check
- `GET /api/trends` - Get all trends
- `GET /api/trends?sport=college_baseball` - Filter by sport
- `GET /api/trends/:id` - Get specific trend
- `GET /cron/monitor` - Manual monitoring trigger (internal)

**Cron Schedule:**

```toml
# wrangler.toml
[triggers]
crons = ["*/15 * * * *"]  # Every 15 minutes
```

**Documentation:**
- `cloudflare-workers/blaze-trends/README.md` - Technical overview
- `cloudflare-workers/blaze-trends/DEPLOYMENT.md` - Deployment guide
- `cloudflare-workers/blaze-trends/scripts/README.md` - Script documentation
- `BLAZE-TRENDS-IMPLEMENTATION.md` - Complete implementation summary

**Frontend Integration:**
- `/trends` page in Next.js app
- Components: `TrendCard`, `SportFilter`
- Types: `packages/web/types/trends.ts`

**Performance Metrics:**
- Monitoring cycle: 15 minutes
- GPT-4 analysis: <5s per batch
- D1 storage: <20ms P95
- KV cache hits: <10ms
- Trend retention: 7 days

---

#### Other Production Workers

**Location:** `cloudflare-workers/`

1. **blaze-content** - Content management and caching layer
2. **blaze-ingestion** - Multi-source data pipeline aggregation
3. **longhorns-baseball** - Texas Longhorns baseball-specific worker (team-focused analytics)
4. **blaze-api-gateway** - Unified API gateway with rate limiting
5. **blaze-webhooks** - Webhook delivery system for real-time notifications

See `docs/INFRASTRUCTURE.md` for complete worker mapping (72 total workers documented).

---

## Architecture

### Package: `@bsi/shared`

**Purpose:** Shared TypeScript types and utility functions used across all packages.

**Key Exports:**
```typescript
// Types
export type Team = { id: string; name: string; abbreviation: string; /* ... */ };
export type Game = { id: string; homeTeam: Team; awayTeam: Team; /* ... */ };
export type Standing = { team: Team; wins: number; losses: number; /* ... */ };

// Utilities
export function formatDate(date: Date): string;           // America/Chicago timezone
export function calculateWinPercentage(wins: number, losses: number): string;
export function getTodayInChicago(): string;              // YYYY-MM-DD format
```

**Location:** `packages/shared/src/`

### Package: `@bsi/api`

**Purpose:** Sports data adapters for fetching from official APIs.

**Adapters:**
- `MLBAdapter` - MLB Stats API (free, official)
- `NFLAdapter` - SportsDataIO (requires API key)
- `NBAAdapter` - SportsDataIO (requires API key)
- `NCAAFootballAdapter` - ESPN public API
- `NCAABasketballAdapter` - ESPN public API
- `CollegeBaseballAdapter` - ESPN API + enhanced box scores
- `YouthSportsAdapter` - Youth sports data management

**Usage Pattern:**
```typescript
import { MLBAdapter } from '@bsi/api';

const adapter = new MLBAdapter({ apiKey: process.env.MLB_API_KEY });

// Fetch games
const games = await adapter.getGames({ date: '2025-01-11' });

// Fetch standings
const standings = await adapter.getStandings({ divisionId: '200' });

// Fetch teams
const teams = await adapter.getTeams();
```

**Location:** `packages/api/src/adapters/`

### Package: `@bsi/web`

**Purpose:** Next.js 14 web application with mobile-first UI.

**Key Features:**
- App Router (Next.js 14)
- Tailwind CSS styling
- API Routes for serving sports data
- Real-time game updates
- Responsive design

**Directory Structure:**
```
packages/web/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout
│   ├── api/
│   │   └── sports/           # API routes
│   │       ├── mlb/
│   │       ├── nfl/
│   │       ├── nba/
│   │       ├── college-baseball/
│   │       ├── ncaa/
│   │       ├── youth-sports/
│   │       └── command-center/
│   ├── sports/
│   │   ├── mlb/              # MLB pages
│   │   ├── nfl/              # NFL pages
│   │   ├── nba/              # NBA pages
│   │   ├── college-baseball/ # College baseball pages
│   │   ├── ncaa-football/    # NCAA football pages
│   │   ├── ncaa-basketball/  # NCAA basketball pages
│   │   └── youth-sports/     # Youth sports pages
│   ├── trends/               # Blaze Trends page
│   ├── privacy/              # Privacy policy
│   └── cookies/              # Cookie settings
├── components/               # React components
├── lib/                      # Utilities
└── public/                   # Static assets
```

### Package: `@bsi/mcp-sportsdata-io`

**Purpose:** Model Context Protocol (MCP) server for SportsData.io API integration.

**Key Features:**
- 8 specialized tools for sports data retrieval
- Priority #1: College Baseball (fills ESPN gaps)
- Multi-sport support: MLB, NFL, NCAA Football, NCAA Basketball
- Real-time data with play-by-play feeds
- Cloudflare Workers deployment

**Tools:**
1. `fetch_college_baseball_data` - Priority #1 college baseball coverage
2. `fetch_mlb_data` - MLB games, scores, stats
3. `fetch_nfl_data` - NFL games, scores, stats, injuries
4. `fetch_college_football_data` - College football with FCS focus
5. `fetch_ncaa_basketball_data` - NCAA basketball and March Madness
6. `stream_live_game_data` - Real-time play-by-play updates
7. `fetch_historical_stats` - Historical season and career stats
8. `fetch_odds_and_projections` - Betting lines and projections

**Usage:**
```bash
# Local development
cd packages/mcp-sportsdata-io
pnpm dev

# Deploy to Cloudflare Workers
pnpm deploy
```

**Location:** `packages/mcp-sportsdata-io/`

**Documentation:** `packages/mcp-sportsdata-io/README.md`

### Package: `mmi-baseball`

**Purpose:** Major Moments Index (MMI) - Python package for baseball analytics.

**Key Features:**
- Advanced baseball analytics and moment scoring
- Play-by-play analysis
- Win probability calculations
- High-leverage situation detection
- Python-based analytics engine

**Integration:** Available via `/api/sports/mlb/mmi/*` endpoints

**MMI API Endpoints:**
- `GET /api/sports/mlb/mmi/games/:gameId` - Get MMI score for a game
- `GET /api/sports/mlb/mmi/high-leverage` - High-leverage moments
- `GET /api/sports/mlb/mmi/health` - MMI service health check

**Location:** `packages/mmi-baseball/`

**Documentation:**
- `packages/mmi-baseball/README.md`
- `MMI_INTEGRATION_COMPLETE.md`
- `MMI_DEPLOYMENT_SUMMARY.md`

---

## Development Workflow

### Adding a New Cloudflare Worker

**When to create a worker:** Use Cloudflare Workers for edge computing tasks that require:
- Real-time data processing (<50ms response times)
- Global distribution (CDN benefits)
- D1 database or KV storage
- Cron-based automation
- Heavy computational tasks offloaded from Next.js

**Step-by-step Guide:**

1. **Create Worker Directory:**
   ```bash
   mkdir -p cloudflare-workers/my-worker
   cd cloudflare-workers/my-worker
   ```

2. **Initialize Wrangler Configuration:**
   ```toml
   # wrangler.toml
   name = "my-worker"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"

   # D1 Database (optional)
   [[d1_databases]]
   binding = "DB"
   database_name = "my-worker-db"
   database_id = "your-database-id-here"

   # KV Namespace (optional)
   [[kv_namespaces]]
   binding = "KV"
   id = "your-kv-namespace-id"

   # Cron Triggers (optional)
   [triggers]
   crons = ["*/15 * * * *"]  # Every 15 minutes

   # Environment Variables
   [vars]
   ENVIRONMENT = "production"

   # Secrets (set via: wrangler secret put SECRET_NAME)
   # OPENAI_API_KEY
   # BRAVE_SEARCH_API_KEY
   ```

3. **Create Worker Source Code:**
   ```typescript
   // src/index.ts
   export interface Env {
     DB: D1Database;       // D1 binding (if configured)
     KV: KVNamespace;      // KV binding (if configured)
     OPENAI_API_KEY: string;  // Secrets
     ENVIRONMENT: string;   // Variables
   }

   export default {
     // HTTP requests
     async fetch(
       request: Request,
       env: Env,
       ctx: ExecutionContext
     ): Promise<Response> {
       const url = new URL(request.url);

       // Health check
       if (url.pathname === '/health') {
         return Response.json({
           status: 'healthy',
           timestamp: new Date().toISOString(),
           environment: env.ENVIRONMENT
         });
       }

       // API endpoint
       if (url.pathname === '/api/data') {
         try {
           // Query D1 database
           const result = await env.DB.prepare(
             'SELECT * FROM my_table LIMIT 10'
           ).all();

           // Cache in KV
           await env.KV.put(
             'cache:data',
             JSON.stringify(result.results),
             { expirationTtl: 300 }  // 5 minutes
           );

           return Response.json(result.results);
         } catch (error) {
           return Response.json(
             { error: error.message },
             { status: 500 }
           );
         }
       }

       return Response.json(
         { error: 'Not found' },
         { status: 404 }
       );
     },

     // Cron triggers (if configured)
     async scheduled(
       event: ScheduledEvent,
       env: Env,
       ctx: ExecutionContext
     ): Promise<void> {
       console.log('Cron triggered:', event.scheduledTime);

       // Perform scheduled task
       await performBackgroundTask(env);
     }
   };

   async function performBackgroundTask(env: Env): Promise<void> {
     // Example: Clean up old database records
     await env.DB.prepare(
       `DELETE FROM my_table WHERE created_at < datetime('now', '-7 days')`
     ).run();
   }
   ```

4. **Create D1 Database Schema (if needed):**
   ```bash
   # Create database
   wrangler d1 create my-worker-db

   # Get database ID and add to wrangler.toml
   # Copy the ID from output
   ```

   ```sql
   -- migrations/0001_initial.sql
   CREATE TABLE my_table (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     data TEXT NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_created (created_at DESC)
   );
   ```

   ```bash
   # Apply migration
   wrangler d1 execute my-worker-db --file=migrations/0001_initial.sql
   ```

5. **Add Package Scripts:**
   ```json
   // package.json (root)
   {
     "scripts": {
       "my-worker:dev": "cd cloudflare-workers/my-worker && wrangler dev",
       "my-worker:deploy": "cd cloudflare-workers/my-worker && wrangler deploy",
       "my-worker:tail": "cd cloudflare-workers/my-worker && wrangler tail",
       "my-worker:db": "cd cloudflare-workers/my-worker && wrangler d1 execute my-worker-db"
     }
   }
   ```

6. **Test Locally:**
   ```bash
   # Start dev server
   pnpm my-worker:dev

   # Test in another terminal
   curl http://localhost:8787/health
   curl http://localhost:8787/api/data
   ```

7. **Deploy to Production:**
   ```bash
   # Set secrets (first time only)
   cd cloudflare-workers/my-worker
   wrangler secret put OPENAI_API_KEY
   # Enter your API key when prompted

   # Deploy
   pnpm my-worker:deploy

   # Monitor logs
   pnpm my-worker:tail
   ```

8. **Integrate with Next.js (if needed):**
   ```typescript
   // packages/web/app/api/my-endpoint/route.ts
   import { NextRequest, NextResponse } from 'next/server';

   export async function GET(request: NextRequest) {
     try {
       // Call Cloudflare Worker
       const response = await fetch(
         'https://my-worker.your-subdomain.workers.dev/api/data',
         {
           headers: {
             'Authorization': `Bearer ${process.env.WORKER_API_KEY}`
           }
         }
       );

       const data = await response.json();

       return NextResponse.json(data, {
         headers: {
           'Cache-Control': 'public, max-age=300, s-maxage=600'
         }
       });
     } catch (error) {
       console.error('[API] Worker error:', error);
       return NextResponse.json(
         { error: 'Failed to fetch data' },
         { status: 500 }
       );
     }
   }
   ```

9. **Update Documentation:**
   - Add worker to `docs/INFRASTRUCTURE.md`
   - Document API endpoints in this CLAUDE.md file
   - Add deployment notes to `DEPLOYMENT.md`
   - Create README in worker directory

**Best Practices:**

- **Error Handling:** Always wrap D1/KV operations in try-catch blocks
- **Caching:** Use KV for frequently accessed data (<1MB)
- **Database:** Use D1 for relational data and complex queries
- **Observability:** Log errors and performance metrics
- **Security:** Never commit secrets, use wrangler secret
- **Performance:** Keep response times <200ms P99
- **Testing:** Test locally with wrangler dev before deploying

**Common Patterns:**

```typescript
// Cache-aside pattern (check KV first, fallback to D1)
async function getCachedData(env: Env, key: string) {
  // Try KV cache first
  const cached = await env.KV.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fallback to D1 database
  const result = await env.DB.prepare(
    'SELECT * FROM data WHERE id = ?'
  ).bind(key).first();

  // Cache for next time
  if (result) {
    await env.KV.put(key, JSON.stringify(result), {
      expirationTtl: 300  // 5 minutes
    });
  }

  return result;
}

// Rate limiting pattern
async function checkRateLimit(env: Env, clientId: string): Promise<boolean> {
  const key = `ratelimit:${clientId}`;
  const current = await env.KV.get(key);

  if (!current) {
    await env.KV.put(key, '1', { expirationTtl: 60 });
    return true;
  }

  const count = parseInt(current);
  if (count >= 60) {  // 60 requests per minute
    return false;
  }

  await env.KV.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}
```

---

### Adding a New Sports Adapter

1. **Create adapter** in `packages/api/src/adapters/`:
   ```typescript
   // packages/api/src/adapters/hockey-adapter.ts
   import { Game, Team } from '@bsi/shared';

   export class HockeyAdapter {
     constructor(private config: { apiKey: string }) {}

     async getGames(params: { date: string }): Promise<Game[]> {
       // Fetch from API
       // Transform to shared types
       return games;
     }
   }
   ```

2. **Export from index**:
   ```typescript
   // packages/api/src/index.ts
   export * from './adapters/hockey-adapter';
   ```

3. **Build API package**:
   ```bash
   pnpm --filter @bsi/api build
   ```

4. **Create API route** in `packages/web/app/api/sports/hockey/`:
   ```typescript
   // packages/web/app/api/sports/hockey/games/route.ts
   import { HockeyAdapter } from '@bsi/api';
   import { NextRequest, NextResponse } from 'next/server';

   export async function GET(request: NextRequest) {
     const searchParams = request.nextUrl.searchParams;
     const date = searchParams.get('date') || getTodayInChicago();

     const adapter = new HockeyAdapter({
       apiKey: process.env.HOCKEY_API_KEY!
     });

     const games = await adapter.getGames({ date });

     return NextResponse.json(games);
   }
   ```

5. **Create frontend page**:
   ```typescript
   // packages/web/app/sports/hockey/page.tsx
   import { HockeySchedule } from '@/components/sports/HockeySchedule';

   export default function HockeyPage() {
     return <HockeySchedule />;
   }
   ```

### Adding Shared Types

1. **Add to shared package**:
   ```typescript
   // packages/shared/src/types.ts
   export interface Player {
     id: string;
     name: string;
     position: string;
     jerseyNumber: number;
   }
   ```

2. **Build shared package**:
   ```bash
   pnpm --filter @bsi/shared build
   ```

3. **Use in other packages** (no rebuild needed - workspace linking):
   ```typescript
   import { Player } from '@bsi/shared';
   ```

---

## API Routes

### Next.js API Route Pattern

```typescript
// packages/web/app/api/sports/[sport]/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Extract query params
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  // Fetch data
  const data = await fetchData(date);

  // Return JSON
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handle POST
  return NextResponse.json({ success: true });
}
```

### Available API Endpoints

```
# MLB
GET /api/sports/mlb/games?date=2025-01-11
GET /api/sports/mlb/standings?divisionId=200
GET /api/sports/mlb/teams

# MLB MMI (Major Moments Index) - Next.js Routes
GET /api/sports/mlb/mmi/games/:gameId      # Get MMI breakdown for specific game
GET /api/sports/mlb/mmi/high-leverage       # Get high-leverage moments
GET /api/sports/mlb/mmi/health              # MMI service health check

# MMI Engine Worker (Cloudflare Workers - Direct Access)
GET /api/mmi/games/today                    # Real-time MMI for all live games
GET /api/mmi/top?limit=10&days=7           # Top MMI moments across games
GET /api/mmi/:gameId                        # MMI breakdown for game
POST /api/mmi/calculate                     # Update MMI (internal)
GET /health                                 # Worker health check

# Pitch Tunnel Simulator (Cloudflare Workers)
GET /api/pitch-tunnel/pitchers/search?q=kershaw&limit=10
GET /api/pitch-tunnel/pitchers/:id/pitches
GET /api/pitch-tunnel/trajectory?pitcher_id=...&pitch_type=SL
POST /api/pitch-tunnel/design               # Create custom pitch
GET /api/pitch-tunnel/compare?pitcher1=...&pitch1=SL&pitcher2=...&pitch2=SL
GET /health                                 # Worker health check

# Blaze Trends (AI-Powered News Monitoring)
GET /api/trends                             # Get all trends
GET /api/trends?sport=college_baseball     # Filter by sport
GET /api/trends/:id                         # Get specific trend
GET /cron/monitor                           # Manual monitoring trigger (internal)
GET /health                                 # Worker health check

# NFL
GET /api/sports/nfl/games?week=1&season=2025
GET /api/sports/nfl/standings?season=2025
GET /api/sports/nfl/teams

# NBA
GET /api/sports/nba/games?date=2025-01-11
GET /api/sports/nba/standings
GET /api/sports/nba/teams

# NCAA Football
GET /api/sports/ncaa/football/games?week=1
GET /api/sports/ncaa/football/standings?conference=12

# NCAA Basketball
GET /api/sports/ncaa/basketball/games?date=2025-01-11
GET /api/sports/ncaa/basketball/standings

# College Baseball (Priority #1)
GET /api/sports/college-baseball/games?date=2025-01-11
GET /api/sports/college-baseball/standings?conference=ACC
GET /api/sports/college-baseball/teams

# Youth Sports
GET /api/sports/youth-sports/games
GET /api/sports/youth-sports/teams

# Command Center (Multi-sport dashboard)
GET /api/sports/command-center/dashboard

# System Health
GET /api/health                             # Next.js application health
```

**Endpoint Architecture:**

- **Next.js API Routes** (`/api/sports/*`): Main application endpoints, deployed on Netlify
- **Cloudflare Workers** (various domains): Edge computing endpoints with D1/KV
  - MMI Engine: `https://mmi-engine.your-subdomain.workers.dev`
  - Pitch Tunnel: `https://pitch-tunnel.your-subdomain.workers.dev`
  - Blaze Trends: `https://blaze-trends.your-subdomain.workers.dev`

**Response Format Standard:**

All endpoints return JSON with the following structure:

```typescript
{
  data: T,  // Actual response data
  meta: {
    lastUpdated: string,      // ISO 8601 timestamp
    timezone: "America/Chicago",
    dataSource: string,       // "MLB Stats API" | "ESPN" | "SportsDataIO" | etc.
    cacheStatus?: "hit" | "miss",
    responseTime?: number     // milliseconds
  },
  error?: {
    message: string,
    code: string,
    details?: any
  }
}
```

---

## Environment Variables

### Required

```bash
# SportsDataIO (for NFL/NBA)
SPORTSDATAIO_API_KEY=your_api_key_here
```

### Optional

```bash
# Next.js environment
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://blazesportsintel.com

# API keys for additional sports
MLB_API_KEY=your_key_here
NCAA_API_KEY=your_key_here
```

### Environment Setup

1. Copy example: `cp .env.example .env`
2. Add your API keys to `.env`
3. Never commit `.env` to git (already in `.gitignore`)

---

## Deployment

### Current Production Deployment

**Platform:** Netlify
**Production URL:** https://blazesportsintelligence.netlify.app
**Alternate URL:** https://www.blazesportsintel.com
**Deployment Status:** ✅ Live

**Build Configuration:**
- **Build Command:** `cd ../.. && CI='' pnpm install --frozen-lockfile && pnpm build`
- **Publish Directory:** `packages/web/.next`
- **Node Version:** 18
- **Base Directory:** `packages/web`
- **Plugin:** `@netlify/plugin-nextjs`

**Environment Variables (Required):**
- `SPORTSDATAIO_API_KEY` - SportsDataIO API key for NFL/NBA data

**Auto-deploy:**
- ✅ Pushes to `main` branch deploy automatically
- ✅ PR previews enabled
- ✅ Automatic cache purge via GitHub Actions

**Security Headers (Deployed):**
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security: max-age=31536000
- ✅ Content-Security-Policy: Comprehensive CSP
- ✅ Referrer-Policy: origin-when-cross-origin
- ✅ Permissions-Policy: Restricted device permissions

**Configuration Files:**
- `netlify.toml` - Netlify build configuration
- `packages/web/next.config.js` - Next.js configuration with security headers

### Deployment Workflow

**GitHub Actions:** `.github/workflows/deploy-with-cache-purge.yml`

The deployment workflow includes:
1. ✅ Automatic Netlify deployment on push to `main`
2. ✅ Cloudflare cache purge after successful deployment
3. ✅ Verification checks for critical endpoints
4. ✅ Slack/PagerDuty notifications (optional)

**Manual Cache Purge:**
```bash
# Purge all cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Deployment Checklist

Before deploying:
- [ ] All tests passing (`pnpm test`)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] Environment variables configured
- [ ] Cache headers reviewed
- [ ] Security headers verified
- [ ] Health check endpoint responding
- [ ] Monitoring scripts tested

After deployment:
- [ ] Verify homepage loads
- [ ] Test API endpoints
- [ ] Check `/api/health` endpoint
- [ ] Monitor error rates for 15 minutes
- [ ] Verify cache headers with `curl -I`
- [ ] Check Cloudflare Analytics dashboard

### Alternative: Vercel Deployment

**Framework Preset:** Next.js
**Root Directory:** `packages/web`
**Build Command:** `cd ../.. && pnpm build`
**Output Directory:** Default (`.next`)

**Environment Variables:**
- Set in Vercel Dashboard → Project → Settings → Environment Variables
- Add `SPORTSDATAIO_API_KEY`

**Auto-deploy:**
- Pushes to `main` → Production
- PR pushes → Preview deployments

### Deployment Documentation

- `DEPLOYMENT.md` - General deployment procedures
- `DEPLOYMENT-READY-STATUS.md` - Pre-deployment status
- `DEPLOYMENT_LOG.md` - Recent deployment history
- `CACHE-FIX-IMPLEMENTATION.md` - Cache control implementation
- `observability/PRODUCTION_DEPLOYMENT_GUIDE.md` - Observability deployment

---

## Testing Strategy

### Playwright E2E Tests

Located in `tests/` directory:

```typescript
// tests/mobile-visual-regression.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test('homepage loads on mobile', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('h1')).toBeVisible();
});
```

**Run Tests:**
```bash
# Headless mode
npx playwright test

# UI mode (interactive)
npx playwright test --ui

# Specific test file
npx playwright test tests/mobile-visual-regression.spec.ts

# Debug mode
npx playwright test --debug
```

### Mobile Regression Tests

**Create Baseline:**
```bash
.claude/tests/mobile-regression.sh --create-baseline
```

**Run Regression Tests:**
```bash
# Performance tests
.claude/tests/mobile-regression.sh --performance

# Visual tests
.claude/tests/mobile-regression.sh --visual

# All tests
.claude/tests/mobile-regression.sh --all
```

---

## Infrastructure & Operations

### Observability & Monitoring

**Location:** `observability/`

BSI-NextGen has comprehensive production observability infrastructure:

**Key Components:**
1. **Structured Logging** - JSON-formatted logs with correlation IDs
2. **Metrics Recording** - Cloudflare Analytics Engine integration
3. **Distributed Tracing** - OpenTelemetry-compatible tracing
4. **Circuit Breakers** - Automatic failure protection for external APIs
5. **Health Checks** - Production health monitoring endpoints

**Observability Helpers:**
- `observability/helpers/telemetry.ts` - Logging, metrics, tracing
- `observability/helpers/middleware.ts` - Request instrumentation
- `observability/helpers/circuit-breaker.ts` - Failure protection

**Service Level Objectives (SLOs):**
- Page Load Performance: P95 <2s, Error rate <0.1%
- API Response Time: P99 <200ms, 5xx rate <0.5%
- Data Freshness: Live games <30s, Standings <5min
- External API Reliability: 99.5% success rate

**Documentation:**
- `observability/README.md` - Observability overview (START HERE)
- `observability/QUICK_START.md` - 5-minute quick start
- `observability/DEBUGGABILITY_CARD.md` - Incident response guide
- `observability/RUNBOOK.md` - Operational procedures
- `observability/PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment steps

**Monitoring Commands:**
```bash
# Check production health
curl https://www.blazesportsintel.com/api/health

# Monitor production endpoints
./scripts/monitor-production.sh

# Check cache staleness
./scripts/check-cache-staleness.sh
```

### Production Monitoring

**Health Check Endpoint:** `GET /api/health`

**Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T18:30:00.000Z",
  "timezone": "America/Chicago",
  "response_time_ms": 45,
  "checks": {
    "database": "not_configured",
    "external_apis": "healthy",
    "environment": "healthy"
  },
  "version": "1.0.0"
}
```

**Monitoring Script:** `scripts/monitor-production.sh`
- Monitors multiple endpoints (/, /api/health, /sports/mlb)
- Email alerts via ALERT_EMAIL environment variable
- Slack alerts via SLACK_WEBHOOK_URL
- Exit codes for CI/CD integration

**Documentation:** `MONITORING.md`

### Infrastructure Documentation

Located in `docs/`:

1. **[INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md)** - Architecture overview
   - 72 Cloudflare Workers mapped
   - 18 D1 databases documented
   - 20+ KV stores tracked
   - Mermaid diagrams

2. **[R2_STORAGE_SETUP.md](./docs/R2_STORAGE_SETUP.md)** - HIGH PRIORITY
   - Media storage implementation guide
   - File upload/download workers
   - CORS configuration
   - Cost: ~$10/month

3. **[HYPERDRIVE_SETUP.md](./docs/HYPERDRIVE_SETUP.md)** - MEDIUM PRIORITY
   - Database connection pooling
   - 50-80% query performance improvement
   - Phased rollout strategy

4. **[DATABASE_MONITORING.md](./docs/DATABASE_MONITORING.md)** - MEDIUM PRIORITY
   - Monitoring worker implementation
   - Alerts and dashboards
   - Growth rate tracking

5. **[OPERATIONAL_RUNBOOKS.md](./docs/OPERATIONAL_RUNBOOKS.md)** - HIGH PRIORITY
   - Deployment procedures
   - Incident response
   - Backup/recovery
   - Security protocols

6. **[IMPLEMENTATION_SUMMARY.md](./docs/IMPLEMENTATION_SUMMARY.md)** - START HERE
   - Overview of all guides
   - Implementation roadmap
   - Success metrics

7. **[PRODUCTION_SETUP.md](./docs/PRODUCTION_SETUP.md)** - Production configuration
8. **[SENTRY-SETUP-GUIDE.md](./docs/SENTRY-SETUP-GUIDE.md)** - Error tracking setup

### Implementation Priorities

**Phase 1 (Week 1-2):** R2 Storage Setup
**Phase 2 (Week 3-6):** Hyperdrive Configuration
**Phase 3 (Week 7-8):** Database Monitoring

---

## Sports Data Sources

### MLB
- **API:** Official MLB Stats API (free)
- **Base URL:** `https://statsapi.mlb.com/api/v1`
- **Documentation:** [MLB Stats API](https://github.com/toddrob99/MLB-StatsAPI)
- **No API Key Required**

### NFL
- **API:** SportsDataIO
- **Base URL:** `https://api.sportsdata.io/v3/nfl`
- **Documentation:** [SportsDataIO NFL](https://sportsdata.io/developers/api-documentation/nfl)
- **Requires API Key:** `SPORTSDATAIO_API_KEY`

### NBA
- **API:** SportsDataIO
- **Base URL:** `https://api.sportsdata.io/v3/nba`
- **Documentation:** [SportsDataIO NBA](https://sportsdata.io/developers/api-documentation/nba)
- **Requires API Key:** `SPORTSDATAIO_API_KEY`

### NCAA Football
- **API:** ESPN Public API
- **Base URL:** `https://site.api.espn.com/apis/site/v2/sports/football/college-football`
- **No API Key Required**

### College Baseball
- **API:** ESPN Public API (enhanced)
- **Base URL:** `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball`
- **Enhancement:** Add complete box scores (ESPN gap filler)
- **No API Key Required**

### NCAA Basketball
- **API:** ESPN Public API
- **Base URL:** `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball`
- **No API Key Required**

### Youth Sports
- **Purpose:** Local youth sports leagues and tournaments
- **Data Management:** Internal API for community sports coverage
- **Features:** Schedules, scores, team rosters, standings
- **No External API Required**

---

## Common Patterns

### Data Transformation

Always transform external API data to shared types:

```typescript
import { Game, Team } from '@bsi/shared';

class ExternalAdapter {
  private transformGame(externalData: any): Game {
    return {
      id: externalData.gameId,
      homeTeam: this.transformTeam(externalData.home),
      awayTeam: this.transformTeam(externalData.away),
      startTime: externalData.scheduledTime,
      status: externalData.gameStatus,
      venue: externalData.venueName,
      // ... other fields
      meta: {
        dataSource: 'External API Name',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };
  }

  private transformTeam(externalTeam: any): Team {
    return {
      id: externalTeam.teamId,
      name: externalTeam.fullName,
      abbreviation: externalTeam.abbr,
      // ... other fields
    };
  }
}
```

### Error Handling

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Caching Strategy

**IMPORTANT:** BSI-NextGen uses aggressive cache control to prevent stale content and React hydration errors.

```typescript
// API Routes - Data endpoints
export async function GET(request: NextRequest) {
  const data = await fetchData();

  return NextResponse.json(data, {
    headers: {
      // Browser cache: 5 minutes
      // CDN cache: 10 minutes
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}
```

**HTML Pages Cache Control:**

Configured in `packages/web/next.config.js`:

```javascript
{
  // HTML pages: Short CDN cache to prevent stale content
  source: '/:path((?!_next|api).*)*',
  headers: [
    {
      key: 'Cache-Control',
      // Browser: always revalidate
      // CDN: cache for 60 seconds, then revalidate
      // Prevents hydration mismatches from stale HTML
      value: 'public, max-age=0, s-maxage=60, must-revalidate',
    },
  ],
},
{
  // Static assets: Long cache with immutable (versioned by Next.js)
  source: '/_next/static/:path*',
  headers: [
    {
      key: 'Cache-Control',
      // 1 year cache - safe because Next.js versions these files
      value: 'public, max-age=31536000, immutable',
    },
  ],
}
```

**Why This Matters:**
- Prevents 500 errors from HTML/JS version mismatches
- Ensures users always get fresh content after deployment
- Static assets still cached aggressively (1 year) with versioned URLs
- CDN cache limited to 60 seconds for HTML prevents stale content

**Cache Monitoring:**
```bash
# Check for cache staleness
./scripts/check-cache-staleness.sh

# Monitor with alerts
MAX_CACHE_AGE=90 SLACK_WEBHOOK_URL="..." ./scripts/check-cache-staleness.sh
```

**Documentation:** `CACHE-FIX-IMPLEMENTATION.md`

---

## Timezone

All timestamps use **America/Chicago** timezone:

```typescript
import { getTodayInChicago, formatDateInChicago } from '@bsi/shared';

const today = getTodayInChicago();        // "2025-01-11"
const formatted = formatDateInChicago(new Date()); // "Jan 11, 2025 2:30 PM CST"
```

Always include timezone in API responses:

```typescript
{
  data: games,
  meta: {
    lastUpdated: new Date().toISOString(),
    timezone: 'America/Chicago'
  }
}
```

---

## Troubleshooting

### Build Fails

```bash
# Clean and reinstall
pnpm clean
pnpm install
pnpm build
```

### Type Errors in Web Package

```bash
# Rebuild shared and api packages
pnpm --filter @bsi/shared build
pnpm --filter @bsi/api build
```

### Dev Server Won't Start

```bash
# Make sure all packages are built first
pnpm build

# Then start dev server
pnpm dev
```

### Workspace Dependencies Not Updating

```bash
# Rebuild the dependency
pnpm --filter @bsi/shared build

# Restart dev server
pnpm dev
```

---

## Resources

### Frontend & Build Tools

- **Next.js 14:** https://nextjs.org/docs
- **pnpm Workspaces:** https://pnpm.io/workspaces
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Playwright:** https://playwright.dev/
- **TypeScript:** https://www.typescriptlang.org/docs

### Deployment & Hosting

- **Netlify:** https://docs.netlify.com/
- **Vercel:** https://vercel.com/docs
- **Cloudflare Pages:** https://developers.cloudflare.com/pages/

### Cloudflare Workers & Edge Computing

- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
  - Platform overview and getting started
  - Runtime APIs and bindings
  - Best practices for edge computing

- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
  - `wrangler dev` - Local development
  - `wrangler deploy` - Production deployment
  - `wrangler tail` - Real-time logging
  - `wrangler d1` - D1 database management

- **D1 Database:** https://developers.cloudflare.com/d1/
  - SQLite-compatible edge database
  - Query API and bindings
  - Migrations and schema management
  - Performance optimization

- **Workers KV:** https://developers.cloudflare.com/kv/
  - Global, low-latency key-value store
  - <10ms read times (cached)
  - TTL and expiration strategies
  - List operations and pagination

- **Durable Objects:** https://developers.cloudflare.com/durable-objects/
  - Stateful coordination primitives
  - Strong consistency guarantees
  - WebSocket support for real-time

- **Cloudflare Analytics Engine:** https://developers.cloudflare.com/analytics/analytics-engine/
  - Time-series data collection
  - Custom metrics and events
  - SQL-based querying

### 3D Graphics & Physics

- **Babylon.js:** https://doc.babylonjs.com/
  - 3D rendering engine for WebGL
  - Scene graph and mesh manipulation
  - Physics integration (Havok, Cannon.js)
  - Camera systems and controls

- **Babylon.js Playground:** https://playground.babylonjs.com/
  - Interactive code examples
  - Prototyping and testing

- **WebGL:** https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
  - Low-level graphics API
  - Performance considerations
  - Browser compatibility

### Sports Data APIs

- **MLB Stats API:** https://github.com/toddrob99/MLB-StatsAPI
  - Official MLB data (free)
  - Game feeds, standings, stats
  - No API key required

- **SportsDataIO:** https://sportsdata.io/developers/api-documentation
  - NFL, NBA, NCAA data
  - Requires API key
  - Real-time and historical data

- **ESPN Public API:** https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b
  - Unofficial documentation
  - College sports coverage
  - No API key required

### AI & Machine Learning

- **OpenAI API:** https://platform.openai.com/docs/api-reference
  - GPT-4 Turbo for trend analysis
  - Embeddings for similarity search
  - Structured output mode

- **Brave Search API:** https://brave.com/search/api/
  - Web search for news aggregation
  - Sports-specific queries
  - Rate limiting and pricing

### Observability & Monitoring

- **Sentry:** https://docs.sentry.io/
  - Error tracking and reporting
  - Performance monitoring
  - Source maps for debugging

- **Cloudflare Web Analytics:** https://developers.cloudflare.com/analytics/web-analytics/
  - Privacy-friendly analytics
  - Real user monitoring (RUM)
  - Core Web Vitals tracking

### Development Tools

- **GitHub Actions:** https://docs.github.com/en/actions
  - CI/CD pipelines
  - Automated testing and deployment
  - Workflow triggers and secrets

- **ESLint:** https://eslint.org/docs/latest/
  - Code linting and style enforcement
  - TypeScript integration

- **Prettier:** https://prettier.io/docs/en/
  - Code formatting
  - Pre-commit hooks

---

## Production Status & Recent Updates

### Current Production Status (November 2025)

**Deployment:** ✅ Live on Netlify
**URL:** https://blazesportsintelligence.netlify.app
**Status:** Stable and monitored

**Recent Major Updates:**
1. ✅ **P0 Critical Fixes** (Nov 20, 2025)
   - Health check endpoint deployed (`/api/health`)
   - Production monitoring script implemented
   - Complete monitoring documentation (MONITORING.md)

2. ✅ **P1 Security Improvements** (Nov 20, 2025)
   - Security headers implemented (7/7 deployed)
   - Console logging cleanup in production routes
   - Debug endpoint removed
   - Security audit passed (0 vulnerabilities)

3. ✅ **Cache Control Fix** (Nov 20, 2025)
   - HTML cache reduced from 7 days to 60 seconds
   - Prevents React hydration errors from stale content
   - Automatic cache purge via GitHub Actions
   - Cache monitoring script implemented

4. ✅ **Homepage Enhancement** (Nov 20, 2025)
   - Full backend integration with real data
   - Alerts system with live data sources
   - Enhanced homepage with interactive design
   - Improved mobile responsiveness

5. ✅ **Observability Infrastructure** (Nov 20, 2025)
   - Structured logging with correlation IDs
   - Metrics recording with Cloudflare Analytics Engine
   - Distributed tracing support
   - Circuit breakers for external APIs
   - SLO definitions and monitoring

6. ✅ **MMI Integration** (2025)
   - Major Moments Index for baseball analytics
   - API endpoints for high-leverage situations
   - Win probability calculations
   - Play-by-play analysis

7. ✅ **MCP Server** (2025)
   - Model Context Protocol server for SportsData.io
   - 8 specialized tools for sports data
   - Priority on college baseball coverage
   - Cloudflare Workers deployment

**Season Updates:**
- ✅ All sports updated for 2025-2026 season
- ✅ MLB MMI with adaptive cache control
- ✅ NFL season data current
- ✅ NBA season data via ESPN adapter

**Known Limitations:**
- MMI service returns 503 (expected - service in development)
- Some API endpoints require SPORTSDATAIO_API_KEY

### Next Steps (Planned)

**P2 Enhancements:**
- Tighten CSP by removing 'unsafe-inline' and 'unsafe-eval'
- Add Subresource Integrity (SRI) for external scripts
- Implement rate limiting on API endpoints
- Set up automated security scanning in CI/CD
- Add request logging with correlation IDs

**Feature Development:**
- Youth sports league management expansion
- Enhanced analytics dashboard
- Real-time notifications system
- Mobile app development

---

## Project-Specific Notes

### Mobile-First Design

All components must be mobile-first:

```typescript
// Mobile (default)
className="p-4 text-sm"

// Tablet
className="p-4 text-sm md:p-6 md:text-base"

// Desktop
className="p-4 text-sm md:p-6 md:text-base lg:p-8 lg:text-lg"
```

### College Baseball Priority

College baseball gets **priority treatment** - it's the #1 gap in ESPN's coverage:

- Complete box scores with batting/pitching lines
- Play-by-play data
- Conference standings
- Real-time updates every 30 seconds

### No Placeholders

**Never use placeholder data.** All data must come from real APIs with proper error handling:

```typescript
// ❌ NEVER DO THIS
const games = [{ id: '1', homeTeam: 'Team A', /* ... */ }];

// ✅ ALWAYS DO THIS
const games = await adapter.getGames({ date });
if (!games.length) {
  return <EmptyState message="No games scheduled" />;
}
```

---

### MMI Score Interpretation (Project-Specific)

**IMPORTANT:** When displaying MMI scores in the UI, always show both the numeric value AND the contextual label. MMI scores are meaningless without interpretation.

**Score Ranges and Labels:**

```typescript
function getMMILabel(score: number): string {
  if (score >= 90) return 'Historic Pressure';      // 90-100
  if (score >= 80) return 'Extreme Pressure';       // 80-89
  if (score >= 60) return 'High Pressure';          // 60-79
  if (score >= 40) return 'Medium Pressure';        // 40-59
  if (score >= 20) return 'Low Pressure';           // 20-39
  return 'Routine Play';                             // 0-19
}

function getMMIColor(score: number): string {
  if (score >= 90) return 'bg-red-900 text-white';     // Historic
  if (score >= 80) return 'bg-red-600 text-white';     // Extreme
  if (score >= 60) return 'bg-orange-500 text-white';  // High
  if (score >= 40) return 'bg-yellow-400 text-black';  // Medium
  if (score >= 20) return 'bg-green-500 text-white';   // Low
  return 'bg-gray-300 text-black';                     // Routine
}
```

**Always Display Component Breakdown:**

```typescript
interface MMIDisplay {
  score: number;
  label: string;
  breakdown: {
    leverage: number;      // 0-10 scale
    pressure: number;      // 0-10 scale
    fatigue: number;       // 0-10 scale
    execution: number;     // 0-10 scale
    biometric: number;     // 0-10 scale
  };
}

// Example UI component
export function MMIIndicator({ mmi }: { mmi: MMIDisplay }) {
  return (
    <div className={`mmi-card ${getMMIColor(mmi.score)}`}>
      {/* Primary score */}
      <div className="text-3xl font-bold">{mmi.score.toFixed(1)}</div>
      <div className="text-sm">{getMMILabel(mmi.score)}</div>

      {/* Component breakdown */}
      <div className="mt-2 text-xs">
        <div>Leverage: {mmi.breakdown.leverage.toFixed(1)} / 10</div>
        <div>Pressure: {mmi.breakdown.pressure.toFixed(1)} / 10</div>
        <div>Fatigue: {mmi.breakdown.fatigue.toFixed(1)} / 10</div>
        <div>Execution: {mmi.breakdown.execution.toFixed(1)} / 10</div>
        {mmi.breakdown.biometric !== 5.0 && (
          <div>Biometric: {mmi.breakdown.biometric.toFixed(1)} / 10</div>
        )}
      </div>

      {/* Visual breakdown bars */}
      <div className="mt-2 space-y-1">
        <ProgressBar value={mmi.breakdown.leverage} max={10} label="L" />
        <ProgressBar value={mmi.breakdown.pressure} max={10} label="P" />
        <ProgressBar value={mmi.breakdown.fatigue} max={10} label="F" />
        <ProgressBar value={mmi.breakdown.execution} max={10} label="E" />
      </div>
    </div>
  );
}
```

**Contextual Examples (for documentation/tooltips):**

| MMI Score | Label | Example Situation |
|-----------|-------|-------------------|
| 95.7 | Historic Pressure | Bottom 9th, bases loaded, 2 outs, down by 1, World Series Game 7 |
| 87.3 | Extreme Pressure | Bottom 9th, 2 outs, tying run on 3rd, pitcher at 110 pitches |
| 72.4 | High Pressure | 8th inning, 1-run lead, runners on 2nd and 3rd, 1 out |
| 48.2 | Medium Pressure | 6th inning, tie game, runner on 1st, 2 outs |
| 25.1 | Low Pressure | 3rd inning, 5-run lead, bases empty, 1 out |
| 12.5 | Routine Play | 2nd inning, 8-run lead, bases empty, 0 outs |

**API Response Format (enforce this):**

```typescript
// ✅ CORRECT - Always include breakdown
{
  mmi_score: 78.5,
  label: "High Pressure",
  breakdown: {
    leverage: 7.2,
    pressure: 8.1,
    fatigue: 6.5,
    execution: 7.8,
    biometric: 5.0  // Default when unavailable
  },
  situation: "Bottom 8th, 2 outs, runner on 2nd, down by 1"
}

// ❌ INCORRECT - Never return just the score
{
  mmi_score: 78.5
}
```

---

### Physics Accuracy Guidelines (Pitch Tunnel Simulator)

**CRITICAL:** The Pitch Tunnel Simulator uses real physics. DO NOT use simplified or placeholder calculations.

**Unit Conversions (MUST BE EXACT):**

```typescript
// Velocity conversions
const mph_to_ms = (mph: number) => mph * 0.44704;  // mph → m/s
const ms_to_mph = (ms: number) => ms / 0.44704;    // m/s → mph

// Distance conversions
const feet_to_m = (feet: number) => feet * 0.3048;  // feet → meters
const m_to_feet = (m: number) => m / 0.3048;        // meters → feet

// Spin rate conversions
const rpm_to_rads = (rpm: number) => rpm * (2 * Math.PI / 60);  // rpm → rad/s
const rads_to_rpm = (rads: number) => rads * (60 / (2 * Math.PI));  // rad/s → rpm

// NEVER use approximations like:
// ❌ const mph_to_ms = (mph: number) => mph * 0.45;  // TOO IMPRECISE
```

**Physics Constants (DO NOT MODIFY):**

```typescript
const PHYSICS_CONSTANTS = {
  // Baseball properties
  BALL_MASS: 0.145,           // kg (official MLB weight)
  BALL_DIAMETER: 0.074,       // meters (2.9 inches)
  BALL_CIRCUMFERENCE: 0.229,  // meters (9 inches)

  // Field dimensions
  MOUND_TO_PLATE: 18.44,      // meters (60.5 feet)
  MOUND_HEIGHT: 0.254,        // meters (10 inches)
  PLATE_WIDTH: 0.432,         // meters (17 inches)

  // Air properties (sea level, 20°C)
  AIR_DENSITY: 1.225,         // kg/m³
  GRAVITY: 9.81,              // m/s²

  // Drag coefficient (smooth sphere approximation)
  DRAG_COEFFICIENT: 0.4,

  // Simulation parameters
  FRAME_RATE: 60,             // FPS (DO NOT CHANGE - affects accuracy)
  TIME_STEP: 1/60,            // seconds per frame
};
```

**Magnus Force Calculation (EXACT FORMULA):**

```typescript
/**
 * Calculate Magnus force on a spinning baseball
 *
 * Formula: F_magnus = (1/2) * ρ * A * C_L * v²
 * Where C_L = S / (v * d)  // Lift coefficient
 *       S = ω * r           // Surface velocity
 *
 * @param velocity - Ball velocity in m/s
 * @param spin_rate - Spin rate in rpm
 * @param spin_axis - Spin axis in degrees from vertical (0° = pure backspin)
 * @returns Magnus force vector in Newtons
 */
function calculateMagnus(
  velocity: Vector3,
  spin_rate: number,
  spin_axis: number
): Vector3 {
  const v = velocity.length();  // Speed magnitude
  const omega = rpm_to_rads(spin_rate);
  const r = PHYSICS_CONSTANTS.BALL_DIAMETER / 2;
  const S = omega * r;  // Surface velocity

  // Lift coefficient (empirical)
  const C_L = S / (v * PHYSICS_CONSTANTS.BALL_DIAMETER);

  // Cross-sectional area
  const A = Math.PI * Math.pow(r, 2);

  // Magnus force magnitude
  const F_mag = 0.5 * PHYSICS_CONSTANTS.AIR_DENSITY * A * C_L * Math.pow(v, 2);

  // Direction: perpendicular to both velocity and spin axis
  const spin_axis_rad = spin_axis * (Math.PI / 180);
  const spin_vector = new Vector3(
    Math.sin(spin_axis_rad),
    Math.cos(spin_axis_rad),
    0
  );

  // F = ω × v (cross product)
  const force_direction = Vector3.Cross(spin_vector, velocity.normalize());

  return force_direction.scale(F_mag);
}
```

**Drag Force Calculation (EXACT FORMULA):**

```typescript
/**
 * Calculate drag force on a baseball
 *
 * Formula: F_drag = (1/2) * ρ * A * C_D * v²
 *
 * @param velocity - Ball velocity vector in m/s
 * @returns Drag force vector in Newtons (opposite to velocity)
 */
function calculateDrag(velocity: Vector3): Vector3 {
  const v = velocity.length();
  const r = PHYSICS_CONSTANTS.BALL_DIAMETER / 2;
  const A = Math.PI * Math.pow(r, 2);

  // Drag force magnitude
  const F_drag = 0.5 *
    PHYSICS_CONSTANTS.AIR_DENSITY *
    A *
    PHYSICS_CONSTANTS.DRAG_COEFFICIENT *
    Math.pow(v, 2);

  // Direction: opposite to velocity
  return velocity.normalize().scale(-F_drag);
}
```

**Trajectory Integration (60 FPS REQUIRED):**

```typescript
/**
 * Simulate baseball trajectory using Euler integration
 *
 * IMPORTANT: Time step MUST be 1/60 second for accuracy
 *
 * @param initial_conditions - Release point, velocity, spin
 * @returns Array of position vectors from release to plate
 */
function simulateTrajectory(initial_conditions: PitchPhysics): TrajectoryPoint[] {
  const dt = PHYSICS_CONSTANTS.TIME_STEP;  // 1/60 second
  const positions: TrajectoryPoint[] = [];

  let pos = initial_conditions.release_point.clone();
  let vel = initial_conditions.velocity.clone();

  // Simulate until ball crosses home plate
  const plate_distance = PHYSICS_CONSTANTS.MOUND_TO_PLATE;

  while (pos.z < plate_distance && positions.length < 300) {  // Safety limit
    // Calculate forces
    const F_gravity = new Vector3(
      0,
      -PHYSICS_CONSTANTS.GRAVITY * PHYSICS_CONSTANTS.BALL_MASS,
      0
    );
    const F_magnus = calculateMagnus(vel, initial_conditions.spin_rate, initial_conditions.spin_axis);
    const F_drag = calculateDrag(vel);

    // Net force
    const F_total = F_gravity.add(F_magnus).add(F_drag);

    // Acceleration (F = ma, so a = F/m)
    const a = F_total.scale(1 / PHYSICS_CONSTANTS.BALL_MASS);

    // Euler integration (position and velocity update)
    vel = vel.add(a.scale(dt));
    pos = pos.add(vel.scale(dt));

    positions.push({
      position: pos.clone(),
      velocity: vel.clone(),
      time: positions.length * dt
    });
  }

  return positions;
}
```

**Validation Checks (enforce these):**

```typescript
/**
 * Validate pitch physics before simulation
 *
 * @throws Error if physics parameters are unrealistic
 */
function validatePitchPhysics(pitch: PitchPhysics): void {
  // Velocity range (MLB: ~70-105 mph)
  const velocity_mph = ms_to_mph(pitch.velocity.length());
  if (velocity_mph < 50 || velocity_mph > 110) {
    throw new Error(`Unrealistic velocity: ${velocity_mph.toFixed(1)} mph (expected 50-110)`);
  }

  // Spin rate range (MLB: ~1000-3500 rpm)
  if (pitch.spin_rate < 500 || pitch.spin_rate > 4000) {
    throw new Error(`Unrealistic spin rate: ${pitch.spin_rate} rpm (expected 500-4000)`);
  }

  // Spin axis (0-360 degrees)
  if (pitch.spin_axis < 0 || pitch.spin_axis > 360) {
    throw new Error(`Invalid spin axis: ${pitch.spin_axis}° (expected 0-360)`);
  }

  // Release point (reasonable range from mound)
  const release_height_feet = m_to_feet(pitch.release_point.y);
  if (release_height_feet < 4 || release_height_feet > 8) {
    throw new Error(`Unrealistic release height: ${release_height_feet.toFixed(1)} ft (expected 4-8)`);
  }

  // Release distance from plate
  const release_distance_feet = m_to_feet(pitch.release_point.z);
  if (release_distance_feet < 50 || release_distance_feet > 58) {
    throw new Error(`Unrealistic release distance: ${release_distance_feet.toFixed(1)} ft (expected 50-58)`);
  }
}
```

**Common Pitfalls (AVOID THESE):**

```typescript
// ❌ WRONG - Using simplified linear trajectory
const trajectory = [
  start,
  {x: start.x, y: start.y - 1, z: start.z + 10},
  {x: start.x, y: start.y - 2, z: start.z + 20},
  // ...
];

// ✅ CORRECT - Using physics simulation
const trajectory = simulateTrajectory(pitchPhysics);

// ❌ WRONG - Ignoring Magnus force
const force = gravity + drag;

// ✅ CORRECT - Including all forces
const force = gravity + magnus + drag;

// ❌ WRONG - Using wrong time step
const dt = 0.1;  // 10 FPS - too coarse!

// ✅ CORRECT - 60 FPS for smooth, accurate simulation
const dt = 1/60;  // 16.67 ms per frame

// ❌ WRONG - Mixing units
const velocity = 95;  // mph or m/s???

// ✅ CORRECT - Explicit unit conversion
const velocity_mph = 95;
const velocity_ms = mph_to_ms(velocity_mph);
```

**Testing Physics Accuracy:**

```typescript
// Regression test: fastball drop should be ~2-3 feet
test('fastball trajectory accuracy', () => {
  const fastball: PitchPhysics = {
    velocity: new Vector3(0, 0, mph_to_ms(95)),
    spin_rate: 2400,
    spin_axis: 180,  // Pure backspin
    release_point: new Vector3(0, feet_to_m(6), feet_to_m(54))
  };

  const trajectory = simulateTrajectory(fastball);
  const final_pos = trajectory[trajectory.length - 1].position;
  const drop_feet = m_to_feet(fastball.release_point.y - final_pos.y);

  // Expect 2-3 feet of drop for 95 mph fastball
  expect(drop_feet).toBeGreaterThan(1.5);
  expect(drop_feet).toBeLessThan(3.5);
});
```

---

## AI Assistant Guidelines

### Working with this Codebase

**Key Principles:**
1. **Always use real data** - Never create placeholder or mock data
2. **Mobile-first approach** - Start with mobile design, scale up to desktop
3. **College baseball priority** - This is the #1 feature (fills ESPN gaps)
4. **Cache awareness** - Understand cache implications of changes
5. **Security first** - Never expose API keys or sensitive data
6. **Comprehensive error handling** - All external API calls must handle failures
7. **Timezone consistency** - Always use America/Chicago timezone

**Before Making Changes:**
1. Read relevant documentation in `docs/` and `observability/`
2. Check recent deployment logs in `DEPLOYMENT_LOG.md`
3. Verify production status with `/api/health` endpoint
4. Review SLOs in `observability/slos/`
5. Test locally before suggesting deployment

**When Adding New Features:**
1. Create adapter in `packages/api/src/adapters/`
2. Export from `packages/api/src/index.ts`
3. Build API package: `pnpm --filter @bsi/api build`
4. Create API route in `packages/web/app/api/sports/[sport]/`
5. Add frontend page in `packages/web/app/sports/[sport]/`
6. Update this CLAUDE.md with new endpoints and features
7. Add tests and verify functionality
8. Check monitoring and observability impact

**When Fixing Production Issues:**
1. Check `observability/DEBUGGABILITY_CARD.md` for common issues
2. Review logs in Cloudflare Dashboard
3. Check health endpoint: `curl https://www.blazesportsintel.com/api/health`
4. Verify external API connectivity
5. Check cache staleness with monitoring script
6. Document fix in `DEPLOYMENT_LOG.md`

**API Development Patterns:**
- Always transform external API responses to shared types (`@bsi/shared`)
- Include `meta` object with `dataSource`, `lastUpdated`, `timezone`
- Implement proper error handling with descriptive messages
- Use appropriate cache headers (see Caching Strategy section)
- Add observability metadata (requestId, traceId)

**Security Considerations:**
- Never commit `.env` files
- Never log API keys or sensitive data
- Always validate environment variables
- Use security headers (already configured in `next.config.js`)
- Follow OWASP top 10 guidelines

**Performance Guidelines:**
- Keep API response times under 200ms (P99)
- HTML pages cached for 60 seconds max (CDN)
- Static assets cached for 1 year (immutable)
- Monitor external API latency with circuit breakers
- Use Cloudflare Analytics Engine for metrics

**Testing Requirements:**
- Playwright tests for E2E functionality
- Integration tests for API endpoints
- Mobile regression tests for UI changes
- Performance tests before production deployment
- Health check verification after deployment

---

## Claude Code Web Support

This repository is configured for **Claude Code on the web** with automatic setup hooks and network access requirements.

### Automatic Setup

When you start a Claude Code web session, the `.claude/scripts/setup.sh` script runs automatically to:

1. ✅ Verify Node.js and pnpm installation
2. ✅ Install all dependencies with `pnpm install`
3. ✅ Build all packages in dependency order (@bsi/shared → @bsi/api → @bsi/web)
4. ✅ Check for `.env` file and environment variables
5. ✅ Display available commands and next steps

**Configuration:** `.claude/settings.json` contains SessionStart hooks that trigger setup automatically.

### Network Requirements

This project requires network access to the following domains:

**Required (Core Functionality):**
- `statsapi.mlb.com` - MLB Stats API (free, official)
- `site.api.espn.com` - ESPN APIs for NCAA/College sports (free, official)

**Required with API Keys:**
- `api.sportsdata.io` - SportsDataIO for NFL/NBA data (requires `SPORTSDATAIO_API_KEY`)
- `sportsdata.io` - SportsDataIO authentication

**Optional (Authentication):**
- `*.auth0.com` - Auth0 authentication (if configured)

**Network Access Level:** Requires **Full Internet Access** or domain allowlist with the above domains.

### Verifying Network Access

Run the network check script to validate API connectivity:

```bash
.claude/scripts/network-check.sh
```

This script tests all required sports data APIs and reports which ones are accessible. If required APIs fail, you may need to adjust network access settings in your Claude Code web environment.

### Environment Variables

**Required for full functionality:**

```bash
# SportsDataIO API (for NFL/NBA)
SPORTSDATAIO_API_KEY=your_api_key_here

# Auth0 (for authentication)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Setup:**
1. Copy `.env.example` to `.env`
2. Add your API keys
3. Never commit `.env` to version control

### Claude Code Web Limitations

**What works:**
- ✅ Automatic dependency installation via SessionStart hooks
- ✅ Full monorepo build process
- ✅ Development server (`pnpm dev`)
- ✅ API integration with external sports data sources
- ✅ Playwright E2E tests (after browser installation)

**Potential issues:**
- ⚠️ Network access may be restricted - use `.claude/scripts/network-check.sh` to verify
- ⚠️ Some APIs require environment variables - ensure `.env` is configured
- ⚠️ Playwright browser installation may timeout - run `npx playwright install` manually if needed

### Development Workflow in Claude Code Web

1. **Session starts** → Setup script runs automatically
2. **Verify environment:** Check that setup completed successfully
3. **Test network access:** Run `.claude/scripts/network-check.sh`
4. **Configure environment:** Ensure `.env` file has required API keys
5. **Start development:** Run `pnpm dev` to start Next.js server
6. **Make changes:** Edit code, Claude Code will help implement features
7. **Test changes:** Use Playwright tests or manual testing
8. **Commit & push:** Claude Code will help create commits and push to your branch

### Troubleshooting in Claude Code Web

**Setup fails with permission errors:**
```bash
# Manually run setup with verbose output
bash -x .claude/scripts/setup.sh
```

**Network access blocked:**
```bash
# Check which APIs are accessible
.claude/scripts/network-check.sh

# If required APIs are blocked, request Full Internet Access or domain allowlist
```

**Build fails during setup:**
```bash
# Clean and rebuild manually
pnpm clean
pnpm install
pnpm build
```

**Environment variables not working:**
```bash
# Verify .env file exists and has required keys
cat .env

# If missing, copy from template
cp .env.example .env
# Then edit .env with your API keys
```

### Additional Resources

- **Claude Code Documentation:** https://docs.anthropic.com/claude/docs/claude-code
- **SessionStart Hooks:** `.claude/settings.json` configuration
- **Setup Script:** `.claude/scripts/setup.sh` implementation
- **Network Check:** `.claude/scripts/network-check.sh` for API validation
- **Claude Code Configuration:** `.claude/README.md` for detailed setup notes

---

## Documentation Files

### Root Documentation

- `README.md` - Project overview and quick start
- `QUICK_START.md` - Detailed setup instructions
- `CLAUDE.md` - **This file** - AI assistant guide and codebase overview
- `DEPLOYMENT.md` - General deployment procedures
- `DEPLOYMENT-READY-STATUS.md` - Pre-deployment status check
- `DEPLOYMENT_LOG.md` - Recent deployment history (P0/P1 fixes)
- `MONITORING.md` - Production monitoring setup guide
- `CACHE-FIX-IMPLEMENTATION.md` - Cache control implementation details

### Integration & Implementation

- `SPORTSDATAIO_INTEGRATION.md` - SportsDataIO API integration guide
- `MMI_INTEGRATION_COMPLETE.md` - Major Moments Index integration
- `MMI_DEPLOYMENT_SUMMARY.md` - MMI deployment status
- `BLAZE-TRENDS-IMPLEMENTATION.md` - Blaze Trends worker implementation
- `COLLEGE-BASEBALL-IMPLEMENTATION.md` - College baseball feature implementation
- `NCAA-FUSION-DASHBOARD.md` - NCAA multi-sport dashboard

### Analytics & 3D Features

- `ANALYTICS-DEPLOYMENT-GUIDE.md` - Analytics implementation guide
- `BLAZE-3D-IMPLEMENTATION-SUMMARY.md` - 3D visualization summary
- `BLAZE-3D-QUICK-START.md` - 3D visualization quick start
- `BLAZE-3D-VISUALIZATION-ARCHITECTURE.md` - 3D architecture details

### Infrastructure Documentation (`docs/`)

- `docs/INFRASTRUCTURE.md` - Complete architecture mapping (72 workers, 18 D1 DBs)
- `docs/IMPLEMENTATION_SUMMARY.md` - Infrastructure implementation roadmap
- `docs/OPERATIONAL_RUNBOOKS.md` - Operations procedures
- `docs/PRODUCTION_SETUP.md` - Production configuration
- `docs/R2_STORAGE_SETUP.md` - R2 media storage implementation
- `docs/HYPERDRIVE_SETUP.md` - Database connection pooling
- `docs/DATABASE_MONITORING.md` - Database monitoring setup
- `docs/SENTRY-SETUP-GUIDE.md` - Error tracking setup
- `docs/DOMAIN_SETUP_GUIDE.md` - Domain configuration
- `docs/PERFORMANCE_TESTING.md` - Performance testing procedures

### Observability Documentation (`observability/`)

- `observability/README.md` - Observability overview (**START HERE**)
- `observability/QUICK_START.md` - 5-minute quick start guide
- `observability/DEBUGGABILITY_CARD.md` - Incident response guide
- `observability/RUNBOOK.md` - Operational procedures
- `observability/PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment steps
- `observability/IMPLEMENTATION_SUMMARY.md` - Technical implementation overview

### Claude Code Configuration (`.claude/`)

- `.claude/README.md` - Claude Code web setup documentation
- `.claude/scripts/setup.sh` - Automatic session setup script
- `.claude/scripts/network-check.sh` - API connectivity verification
- `.claude/settings.json` - SessionStart hooks configuration

### Package-Specific Documentation

- `packages/mcp-sportsdata-io/README.md` - MCP server documentation
- `packages/mmi-baseball/README.md` - MMI analytics package
- `cloudflare-workers/blaze-trends/README.md` - Blaze Trends worker
- `cloudflare-workers/blaze-trends/DEPLOYMENT.md` - Trends deployment guide
