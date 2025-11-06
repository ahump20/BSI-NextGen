# Blaze Backyard Baseball 🔥⚾

A mobile-first baseball game built with Babylon.js, WebGPU, and Cloudflare's edge infrastructure. Physics-driven gameplay with simplified touch controls inspired by classic backyard baseball games, but with 100% original IP.

## 🎮 Features

- **Physics-Driven Gameplay**: Real-time ball physics using Havok Physics engine
- **Touch-Optimized Controls**: Tap timing for batting, swipe gestures for fielding
- **10 Original Characters**: Each with unique stat distributions (power hitters, contact specialists, speed demons, crafty pitchers)
- **5 Unique Stadiums**: Dusty Acres, Frostbite Field, Treehouse Park, Rooftop Rally, Beach Bash
- **Progressive Unlocks**: Secret characters including "Comet Carter" and "Blaze" the dog
- **Cross-Platform Persistence**: Cloudflare D1 for progression, KV for leaderboards
- **PWA Support**: Install as a mobile app for fullscreen experience

## 🏗️ Architecture

- **Frontend**: Babylon.js 7.31 with WebGPU rendering
- **Physics**: Havok Physics for realistic ball trajectories
- **Hosting**: Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite) for player progression
- **Cache**: Cloudflare KV for leaderboards (<50ms read latency)
- **Assets**: Cloudflare R2 for 3D models and textures
- **Build Tool**: Vite 5 with TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Wrangler CLI installed globally: `npm install -g wrangler`

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo>
   cd Sandlot-Sluggers
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser

### Cloudflare Setup

3. **Authenticate with Cloudflare**
   ```bash
   wrangler login
   ```

4. **Create D1 Database**
   ```bash
   wrangler d1 create blaze-baseball-db
   ```
   Copy the `database_id` from the output and update `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "blaze-baseball-db"
   database_id = "YOUR_DATABASE_ID_HERE"
   ```

5. **Initialize Database Schema**
   ```bash
   wrangler d1 execute blaze-baseball-db --file=./schema.sql
   ```

6. **Create KV Namespace** (for leaderboards)
   ```bash
   wrangler kv:namespace create "KV"
   ```
   Update `wrangler.toml` with the namespace ID:
   ```toml
   [[kv_namespaces]]
   binding = "KV"
   id = "YOUR_KV_NAMESPACE_ID_HERE"
   ```

7. **Create R2 Bucket** (for 3D assets)
   ```bash
   wrangler r2 bucket create blaze-baseball-assets
   ```

### Deploy to Production

8. **Build the project**
   ```bash
   npm run build
   ```

9. **Deploy to Cloudflare Pages**
   ```bash
   npm run deploy
   # or
   wrangler pages deploy dist --project-name=blaze-backyard-baseball
   ```

10. **Configure Environment Bindings**
    In Cloudflare Dashboard → Pages → Your Project → Settings → Functions:
    - Add D1 binding: `DB` → `blaze-baseball-db`
    - Add KV binding: `KV` → your KV namespace
    - Add R2 binding: `ASSETS` → `blaze-baseball-assets`

## 📁 Project Structure

```
Sandlot-Sluggers/
├── src/
│   ├── core/
│   │   └── GameEngine.ts       # Main game engine with Babylon.js
│   ├── data/
│   │   ├── characters.ts       # 10 original characters + unlockables
│   │   └── stadiums.ts         # 5 stadium definitions
│   ├── api/
│   │   └── progression.ts      # API client for player progress
│   └── main.ts                 # Entry point
├── functions/
│   └── api/
│       └── progress/
│           └── [playerId].ts   # Cloudflare Pages Function
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # App icons (add 192x192 and 512x512 PNGs)
├── index.html                  # Main HTML file
├── schema.sql                  # D1 database schema
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── wrangler.toml               # Cloudflare configuration
└── package.json
```

## 🎯 How to Play

### Pitching
1. Press the "PITCH" button to throw a pitch
2. The ball's location depends on pitcher's control stat (lower control = more variance)
3. Ball crosses the plate after ~800ms

### Batting
1. When the ball is in the strike zone, tap/click to swing
2. Timing is critical: contact quality depends on ball-to-bat distance
3. Better contact = higher launch angle and more power
4. Player stats affect hit direction and power

### Fielding
1. Swipe gestures control fielders (currently placeholder)
2. Ball outcome based on distance from home plate:
   - <15 units: Ground out
   - 15-25: Single
   - 25-35: Double
   - 35+: Triple
   - >40 or outside fences: Home run

## 🎨 Adding Assets

### 3D Models
- Place `.glb` models in R2 bucket at `/models/`
- Characters: `rocket.glb`, `ace.glb`, etc.
- Stadiums: `dusty_acres.glb`, `frostbite_field.glb`, etc.
- Update `modelPath` in `src/data/characters.ts` and `stadiums.ts`

### Textures & Skyboxes
- Place environment maps in R2 at `/textures/`
- Supported formats: `.env`, `.hdr`, `.dds`

### Icons
- Add `icon-192.png` and `icon-512.png` to `public/icons/`
- Recommended: Baseball-themed circular icons with transparent background

## 🛠️ Development

### Commands
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy` - Deploy to Cloudflare Pages

### Testing Locally with Wrangler
```bash
wrangler pages dev dist --d1=DB=blaze-baseball-db --kv=KV=YOUR_KV_ID
```

### Environment Variables
No environment variables needed - all bindings are configured in `wrangler.toml`

## 📊 Database Schema

### `player_progress` Table
- `player_id`: Unique player identifier (generated client-side)
- `games_played`, `wins`, `losses`: Game statistics
- `total_runs`, `total_hits`, `total_home_runs`: Performance metrics
- `unlocked_characters`, `unlocked_stadiums`: JSON arrays of unlocked content
- `current_level`, `experience`: Progression system

### `leaderboard` Table
- `player_id`, `player_name`: Player identification
- `stat_type`: Type of stat (e.g., "home_runs", "wins")
- `stat_value`: Numeric value for ranking
- `recorded_at`: Timestamp

## 🎮 Game Mechanics

### Stat System (1-10 scale)
- **Batting Power**: Base force applied to hits
- **Batting Accuracy**: Controls spray angle (higher = straighter)
- **Speed**: Runner advancement and fielder positioning
- **Pitch Speed**: Velocity of pitches
- **Pitch Control**: Accuracy of pitch location
- **Fielding Range**: Coverage area
- **Fielding Accuracy**: Success rate on catches/throws

### Strike Zone
- X: ±0.5 units from center
- Y: 0.5 to 1.8 units (knee to chest)
- Z: ±0.3 units depth

### Contact Quality Formula
```typescript
contactQuality = 1 - (distance / contactZone)
baseForce = 20 + (power * 3) + (contactQuality * 10)
launchAngle = 20 + (contactQuality * 30) // 20-50 degrees
```

## 🔒 IP & Legal

This project uses **100% original intellectual property**:
- No Humongous Entertainment assets
- No Pablo Sanchez, Pete Wheeler, or any Backyard Baseball characters
- Original character names, designs, and stadiums
- Inspired by the genre, not copying specific implementations

## 🐛 Known Issues / TODOs

- [ ] Fielding mechanics not yet implemented (swipes logged but no action)
- [ ] 3D models are placeholder capsules/spheres - need actual character models
- [ ] Camera doesn't follow ball during flight
- [ ] No AI opponents - pitcher auto-pitches, but no smart fielding/baserunning
- [ ] Leaderboard API not implemented (only progress tracking works)
- [ ] No sound effects or music
- [ ] No team selection screen
- [ ] Icons are placeholders (need actual PNG icons)

## 📈 Roadmap

### Phase 1: Core Gameplay ✅
- [x] Basic game engine
- [x] Pitching mechanics
- [x] Batting mechanics
- [x] Ball physics
- [x] Score tracking

### Phase 2: Polish
- [ ] Fielding AI and player control
- [ ] Camera work (follow ball, action replays)
- [ ] Character animations
- [ ] Stadium environment art
- [ ] Sound effects and music

### Phase 3: Progression
- [ ] Unlock system
- [ ] Experience/leveling
- [ ] Leaderboards
- [ ] Achievements
- [ ] Daily challenges

### Phase 4: Multiplayer
- [ ] Local multiplayer (hot seat)
- [ ] Online multiplayer (Durable Objects?)
- [ ] Tournaments
- [ ] Clan/team system

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome! Open an issue or PR.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with:
- [Babylon.js](https://www.babylonjs.com/) - 3D engine
- [Havok Physics](https://www.havok.com/) - Physics simulation
- [Cloudflare Pages](https://pages.cloudflare.com/) - Hosting & edge compute
- [Vite](https://vitejs.dev/) - Build tool

Inspired by the backyard baseball genre, with 100% original content.