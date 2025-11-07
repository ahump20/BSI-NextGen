# Production Deployment Guide: Sandlot Sluggers ⚾

Complete guide to deploy Sandlot Sluggers (Blaze Backyard Baseball) to production on Cloudflare Pages with full multiplayer support, real-time physics, and hyper-realistic baseball mechanics.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Pages                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Frontend   │  │  WebSockets  │  │ Durable Objects │  │
│  │ (Babylon.js) │◄─┤  Real-time   │◄─┤  Game Sessions  │  │
│  │  + Physics   │  │   Comms      │  │   (Sync State)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌──────────────┐                      ┌─────────────────┐ │
│  │ Pages        │                      │  D1 Database    │ │
│  │ Functions    │─────────────────────►│  (Progression)  │ │
│  │ (API Layer)  │                      │  (Stats/Scores) │ │
│  └──────────────┘                      └─────────────────┘ │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │ KV Namespace │                                          │
│  │ (Leaderboard)│                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler`
- Git for version control

## Project Structure

```
Sandlot-Sluggers/
├── src/
│   ├── core/
│   │   └── GameEngine.ts           # Main Babylon.js game engine
│   ├── physics/
│   │   └── BallPhysics.ts          # Hyper-realistic physics (Magnus effect, drag, gravity)
│   ├── systems/
│   │   ├── PitcherSystem.ts        # Pitch selection, fatigue, repertoire
│   │   ├── BatterSystem.ts         # Swing timing, contact quality, hot zones
│   │   ├── FieldingSystem.ts       # AI fielders, catch probability, throwing
│   │   └── BaseRunningSystem.ts    # Leads, stealing, tagging, sliding
│   ├── data/
│   │   ├── characters.ts           # 10 original characters + 2 unlockables
│   │   └── stadiums.ts             # 5 unique stadiums
│   ├── api/
│   │   └── progression.ts          # Client API for player progress
│   └── main.ts                     # Entry point
├── functions/
│   ├── game-session.ts             # Durable Object for multiplayer
│   └── api/
│       └── progress/
│           └── [playerId].ts       # Pages Function for progression
├── public/
│   ├── manifest.json               # PWA manifest
│   └── icons/                      # App icons
├── dist/                           # Build output (generated)
├── schema.sql                      # D1 database schema
├── wrangler.toml                   # Cloudflare configuration
├── package.json
└── README.md
```

## Step 1: Local Development Setup

### 1.1 Clone and Install

```bash
cd /Users/AustinHumphrey/Sandlot-Sluggers
npm install
```

### 1.2 Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 1.3 Test Physics Systems

The game includes:
- **BallPhysics**: Magnus force, drag, gravity, pitch types
- **PitcherSystem**: Repertoire, fatigue, pitch selection AI
- **BatterSystem**: Timing windows, hot/cold zones, contact quality
- **FieldingSystem**: Catch probability, throw mechanics, positioning
- **BaseRunningSystem**: Leads, stealing, tagging up, sliding

Test by:
1. Click "PITCH" button
2. Click/tap when ball is near home plate to swing
3. Watch physics-driven ball trajectory
4. Observe AI fielding (simplified in current version)

## Step 2: Cloudflare Account Setup

### 2.1 Authenticate Wrangler

```bash
wrangler login
```

This opens a browser to authenticate with Cloudflare.

### 2.2 Create D1 Database (if not exists)

```bash
# Check existing databases
wrangler d1 list

# Use existing blaze-db or create new one
wrangler d1 create sandlot-sluggers-db
```

**Update `wrangler.toml`** with the database_id from output:
```toml
[[d1_databases]]
binding = "DB"
database_name = "sandlot-sluggers-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 2.3 Initialize Database Schema

```bash
wrangler d1 execute sandlot-sluggers-db --file=./schema.sql
```

**Verify tables:**
```bash
wrangler d1 execute sandlot-sluggers-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Should show: `player_progress`, `leaderboard`

### 2.4 Create KV Namespace (if not exists)

```bash
wrangler kv:namespace create "GAME_KV"
```

**Update `wrangler.toml`**:
```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID_HERE"
```

### 2.5 Enable Durable Objects

Durable Objects are already configured in `wrangler.toml`. No additional setup needed, but ensure your Cloudflare account has DO enabled (Workers Paid plan required for production scale).

**Free tier limits:**
- 1 million requests/month
- 30 seconds CPU time/request
- Perfect for development and small-scale multiplayer

## Step 3: Build for Production

### 3.1 Run Build Command

```bash
npm run build
```

This:
1. Compiles TypeScript to JavaScript
2. Bundles with Vite
3. Outputs to `dist/` directory
4. Optimizes assets (minification, tree-shaking)

**Verify build output:**
```bash
ls -lh dist/
```

Should see:
- `index.html`
- `assets/` (JS, CSS bundles)
- `manifest.json`

### 3.2 Test Production Build Locally

```bash
npm run preview
```

Open http://localhost:4173 to test production build.

## Step 4: Deploy to Cloudflare Pages

### Option A: Deploy via Wrangler CLI

```bash
npm run deploy
# or
wrangler pages deploy dist --project-name=sandlot-sluggers
```

**Output:**
```
✨ Success! Uploaded 15 files (2.5 MB)
✨ Deployment complete! Take a look over at https://sandlot-sluggers.pages.dev
```

### Option B: Deploy via Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages** → **Create a project**
3. Connect Git repository (recommended) or upload `dist/` folder
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. Add environment bindings (see Step 5)
6. Deploy

## Step 5: Configure Environment Bindings

### 5.1 Via Cloudflare Dashboard

1. Go to **Pages** → **sandlot-sluggers** → **Settings** → **Functions**
2. Add bindings:

**D1 Database:**
- Variable name: `DB`
- D1 database: Select `sandlot-sluggers-db`

**KV Namespace:**
- Variable name: `KV`
- KV namespace: Select your game KV namespace

**Durable Objects:**
- Variable name: `GAME_SESSIONS`
- Class name: `GameSessionDurableObject`
- Script name: `blaze-backyard-baseball`

3. Save and redeploy

### 5.2 Via wrangler.toml (Already Configured)

All bindings are in `wrangler.toml`. When deploying with Wrangler, these are automatically applied.

## Step 6: Custom Domain Setup (Optional)

### 6.1 Add Custom Domain

1. Go to **Pages** → **sandlot-sluggers** → **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `baseball.blazesportsintel.com`
4. Follow DNS setup instructions (CNAME or A record)
5. Wait for DNS propagation (5-30 minutes)

### 6.2 Enable HTTPS

Cloudflare automatically provisions SSL certificates. Wait for status to show "Active".

## Step 7: Verify Deployment

### 7.1 Test Core Gameplay

1. Open deployed URL
2. Click "PITCH" button
3. Swing at ball
4. Verify:
   - Ball physics are realistic (curve, drop, speed)
   - Hit detection works
   - Score updates correctly
   - Inning logic progresses

### 7.2 Test Progression API

Open browser console and run:
```javascript
fetch('https://sandlot-sluggers.pages.dev/api/progress/player_test123')
  .then(r => r.json())
  .then(console.log);
```

Should return:
```json
{
  "player_id": "player_test123",
  "games_played": 0,
  "wins": 0,
  "losses": 0,
  "current_level": 1,
  "experience": 0,
  ...
}
```

### 7.3 Test Multiplayer (WebSockets)

**Create a game session:**
```bash
curl -X POST https://sandlot-sluggers.pages.dev/game/test-session-123/join \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "playerName": "Slugger",
    "team": [],
    "side": "home"
  }'
```

**Connect via WebSocket:**
```javascript
const ws = new WebSocket('wss://sandlot-sluggers.pages.dev/game/test-session-123?playerId=player1');

ws.onopen = () => console.log('Connected to game session');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
ws.send(JSON.stringify({ type: 'ping' }));
```

Should receive `state_sync` and `pong` messages.

## Step 8: Performance Optimization

### 8.1 Enable Cloudflare Caching

Add `_headers` file in `public/`:
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=86400, s-maxage=604800

/*.css
  Cache-Control: public, max-age=86400, s-maxage=604800

/manifest.json
  Cache-Control: public, max-age=3600

/index.html
  Cache-Control: public, max-age=0, must-revalidate
```

### 8.2 Enable Compression

Cloudflare automatically compresses responses (Brotli/Gzip). Verify:
```bash
curl -I -H "Accept-Encoding: br" https://sandlot-sluggers.pages.dev
```

Should see `Content-Encoding: br`

### 8.3 Monitor Performance

1. Go to **Analytics** → **Web Analytics** in Cloudflare Dashboard
2. Add Web Analytics snippet to `index.html` (optional)
3. Monitor:
   - Page load time (target: <3s)
   - Core Web Vitals (LCP, FID, CLS)
   - Geographic distribution

**Expected performance:**
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Time to Interactive**: <3.5s
- **WebGPU rendering**: 60 FPS

## Step 9: Monitoring & Debugging

### 9.1 View Logs

**Real-time logs:**
```bash
wrangler pages deployment tail --project-name=sandlot-sluggers
```

**Function logs:**
```bash
wrangler tail --project-name=blaze-backyard-baseball
```

### 9.2 Durable Objects Logs

```bash
wrangler tail --durable-object=GameSessionDurableObject
```

### 9.3 D1 Database Queries

**Check player progress:**
```bash
wrangler d1 execute sandlot-sluggers-db \
  --command="SELECT * FROM player_progress LIMIT 10;"
```

**Leaderboard:**
```bash
wrangler d1 execute sandlot-sluggers-db \
  --command="SELECT * FROM leaderboard ORDER BY stat_value DESC LIMIT 10;"
```

### 9.4 Error Tracking

Set up error tracking (optional):
```typescript
// In src/main.ts
window.addEventListener('error', (event) => {
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href,
      timestamp: Date.now()
    })
  });
});
```

## Step 10: Post-Deployment Checklist

- [ ] Core gameplay works (pitching, batting, fielding)
- [ ] Physics are realistic (Magnus effect, drag, proper trajectories)
- [ ] Multiplayer sessions can be created and joined
- [ ] WebSocket connections are stable
- [ ] Progression API saves player stats
- [ ] Leaderboard displays correctly
- [ ] Mobile responsive (test on iPhone/Android)
- [ ] PWA installable (test "Add to Home Screen")
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enabled and certificate valid
- [ ] Web Analytics tracking (optional)
- [ ] Error monitoring in place (optional)

## Troubleshooting

### Issue: WebGL/WebGPU not supported

**Solution:** Fallback to WebGL2:
```typescript
// In GameEngine.ts constructor
this.engine = new Engine(canvas, true, {
  adaptToDeviceRatio: true,
  powerPreference: "high-performance",
  disableWebGL2Support: false // Force WebGL2 fallback
});
```

### Issue: Physics are laggy on mobile

**Solution:** Reduce physics accuracy:
```typescript
// In BallPhysics.ts
const timeStep = 0.02; // Increase from 0.01 to 0.02 (30 FPS physics)
```

### Issue: Durable Objects not working

**Solution:** Ensure Workers Paid plan is enabled:
```bash
wrangler whoami
```

Check "Account Plan" in output. Upgrade if needed.

### Issue: D1 queries timing out

**Solution:** Add indexes:
```sql
CREATE INDEX idx_player_progress_id ON player_progress(player_id);
CREATE INDEX idx_leaderboard_stat_value ON leaderboard(stat_value DESC);
```

### Issue: WebSocket disconnects frequently

**Solution:** Implement reconnection logic:
```typescript
let reconnectAttempts = 0;
const maxReconnects = 5;

function connectWebSocket() {
  const ws = new WebSocket(url);

  ws.onclose = () => {
    if (reconnectAttempts < maxReconnects) {
      setTimeout(connectWebSocket, 1000 * Math.pow(2, reconnectAttempts));
      reconnectAttempts++;
    }
  };

  ws.onopen = () => reconnectAttempts = 0;
}
```

## Next Steps

### Phase 2: Enhanced Features

1. **Fielding AI**: Implement full fielder control with pathfinding
2. **Animations**: Add smooth character animations (8-12 frames per action)
3. **Sound Effects**: Integrate Web Audio API for bat cracks, crowd noise
4. **Camera Work**: Follow ball in flight, action replays
5. **Stadium Art**: Replace placeholder models with detailed 3D environments

### Phase 3: Advanced Gameplay

1. **Season Mode**: Track stats across 162-game season
2. **Franchise Mode**: Manage roster, trades, draft picks
3. **Tournament Mode**: Bracket-style elimination tournaments
4. **Daily Challenges**: Special scenarios with rewards
5. **Achievement System**: 50+ unlockable achievements

### Phase 4: Mobile Optimization

1. **iOS App**: Package as native app with Capacitor
2. **Android App**: Deploy to Google Play Store
3. **Touch Controls**: Gesture-based pitching/fielding
4. **Offline Mode**: Play without internet connection
5. **Push Notifications**: Game invites, tournament alerts

## Resources

- **Babylon.js Docs**: https://doc.babylonjs.com/
- **Havok Physics**: https://www.havok.com/
- **Cloudflare Pages**: https://developers.cloudflare.com/pages/
- **Durable Objects**: https://developers.cloudflare.com/durable-objects/
- **D1 Database**: https://developers.cloudflare.com/d1/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

## Support

For issues or questions:
- GitHub Issues: [Your Repo]
- Email: ahump20@outlook.com
- Discord: [Your Server]

---

**Built with Babylon.js, Cloudflare Pages, and a love for baseball ⚾**

*Last Updated: November 6, 2025*
