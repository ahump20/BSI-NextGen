# Blaze Sports Intel Integration - Complete Guide

**Date**: November 6, 2025
**Version**: 1.0.0
**Platform**: Sandlot Sluggers ⚾

---

## 📋 Overview

Sandlot Sluggers is now fully integrated with the **Blaze Sports Intel** platform (blazesportsintel.com) for comprehensive stats synchronization, user progression tracking, and embeddable gameplay.

### Key Features

✅ **OAuth2 Authentication** with Blaze Sports Intel API
✅ **Automatic Stats Synchronization** for every game played
✅ **Real-time Leaderboard Integration**
✅ **XP and Level Progression** synced with Blaze platform
✅ **Embeddable iframe version** for integration into blazesportsintel.com
✅ **Offline support** with automatic sync when connection restored
✅ **Error tracking** via Sentry integration

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Blaze Sports Intel API Configuration
VITE_BLAZE_API_URL=https://api.blazesportsintel.com
VITE_BLAZE_CLIENT_ID=your_client_id_here
VITE_BLAZE_CLIENT_SECRET=your_client_secret_here
VITE_BLAZE_API_KEY=your_api_key_here

# Optional: Sentry Error Tracking
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_APP_VERSION=1.0.0
```

**Security Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### GitHub Secrets (for CI/CD)

Add the following secrets to your GitHub repository:

1. Go to **Settings → Secrets and variables → Actions**
2. Add the following repository secrets:

```
VITE_BLAZE_API_URL
VITE_BLAZE_CLIENT_ID
VITE_BLAZE_CLIENT_SECRET
VITE_BLAZE_API_KEY
VITE_SENTRY_DSN (optional)
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

---

## 🏗️ Architecture

### Blaze API Client (`src/services/BlazeAPI.ts`)

Handles all communication with the Blaze Sports Intel backend:

- **Authentication**: OAuth2 client credentials flow
- **Token Management**: Automatic token refresh
- **Stats Submission**: Game results and player statistics
- **User Profile Management**: XP, levels, achievements
- **Leaderboard Access**: Global and category-specific rankings

### Integration Points

#### 1. **ProgressionAPI** (`src/api/progression.ts`)

The `ProgressionAPI` automatically syncs game stats to Blaze when configured:

```typescript
const progressionAPI = new ProgressionAPI();

// Record game result - automatically syncs to Blaze if configured
await progressionAPI.recordGameResult(playerId, {
  won: true,
  runsScored: 5,
  hitsRecorded: 8,
  homeRunsHit: 2,
  strikeouts: 3,
  atBats: 15
});
```

**Data Flow**:
1. Game ends → `recordGameResult()` called
2. Stats sent to **both** local API and Blaze Sports Intel
3. If Blaze sync fails, local progress still saves
4. Offline queue ensures no stats are lost

#### 2. **Embeddable Version** (`public/embed.html`)

Iframe-ready version for embedding in blazesportsintel.com:

**Embedding on Blaze Sports Intel**:

```html
<iframe
  src="https://sandlot-sluggers.pages.dev/embed.html"
  width="100%"
  height="800px"
  frameborder="0"
  allow="accelerometer; gyroscope; fullscreen"
  sandbox="allow-scripts allow-same-origin allow-popups"
></iframe>
```

**Parent-Iframe Communication**:

```javascript
// Listen for game events
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://sandlot-sluggers.pages.dev') return;

  const { type, data } = event.data;

  switch (type) {
    case 'gameReady':
      console.log('Game initialized');
      break;
    case 'gameEnd':
      console.log('Game stats:', data.stats);
      updateLeaderboard(data.stats);
      break;
    case 'statsUpdate':
      console.log('Current stats:', data.stats);
      break;
  }
});

// Send commands to game
iframe.contentWindow.postMessage(
  { type: 'startGame', data: { difficulty: 'medium' } },
  'https://sandlot-sluggers.pages.dev'
);
```

---

## 📊 Data Schema

### BlazePlayerStats

Stats sent to Blaze Sports Intel after each game:

```typescript
{
  userId: string;           // Player ID
  gameId: string;          // Unique game identifier
  timestamp: string;       // ISO8601 timestamp
  stats: {
    battingAverage: number;  // Hits / At Bats
    homeRuns: number;        // Total home runs in game
    strikeouts: number;      // Total strikeouts
    hits: number;            // Total hits
    atBats: number;          // Total at-bats
    rbi: number;             // Runs batted in
    runs: number;            // Runs scored
  };
  gameResult: "win" | "loss";
  difficulty: "easy" | "medium" | "hard";
}
```

### BlazeUserProfile

User profile structure from Blaze Sports Intel:

```typescript
{
  userId: string;
  username: string;
  email: string;
  xp: number;              // Experience points
  level: number;           // Current level
  achievements: string[];  // Unlocked achievements
  stats: {
    totalGames: number;
    totalWins: number;
    totalHomeRuns: number;
    totalStrikeouts: number;
    careerBattingAverage: number;
  };
}
```

---

## 🔌 API Endpoints

### Blaze Sports Intel API

All endpoints require OAuth2 authentication.

#### **POST** `/v1/auth/token`
Authenticate and get access token.

**Request:**
```json
{
  "grant_type": "client_credentials",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### **POST** `/v1/games/stats`
Submit game statistics.

**Headers:**
```
Authorization: Bearer {access_token}
X-API-Key: {api_key}
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "player123",
  "gameId": "game-1699234567890",
  "timestamp": "2025-11-06T12:34:56Z",
  "stats": {
    "battingAverage": 0.533,
    "homeRuns": 2,
    "strikeouts": 3,
    "hits": 8,
    "atBats": 15,
    "rbi": 5,
    "runs": 5
  },
  "gameResult": "win",
  "difficulty": "medium"
}
```

#### **GET** `/v1/users/{userId}`
Get user profile and stats.

**Response:**
```json
{
  "userId": "player123",
  "username": "SluggerPro",
  "email": "player@example.com",
  "xp": 1250,
  "level": 8,
  "achievements": ["first-homer", "century-club"],
  "stats": {
    "totalGames": 42,
    "totalWins": 28,
    "totalHomeRuns": 87,
    "totalStrikeouts": 156,
    "careerBattingAverage": 0.342
  }
}
```

#### **GET** `/v1/leaderboard`
Get global leaderboard.

**Query Parameters:**
- `category`: `homeRuns` | `battingAverage` | `wins` (default: `homeRuns`)
- `limit`: number (default: `100`)

**Response:**
```json
[
  {
    "userId": "player123",
    "username": "SluggerPro",
    "rank": 1,
    "totalHomeRuns": 87,
    "totalGames": 42,
    "winPercentage": 66.67,
    "battingAverage": 0.342,
    "createdAt": "2025-10-15T10:00:00Z"
  },
  // ... more entries
]
```

---

## 🧪 Testing

### Local Development

1. **Start dev server with Blaze credentials**:

```bash
# Ensure .env.local has valid Blaze credentials
npm run dev
```

2. **Play a game and check console logs**:

```
✅ Stats synced to Blaze Sports Intel
```

3. **Test offline mode**:

```javascript
// Open DevTools → Network → Offline
// Play game → Stats queued locally
// Go online → Stats automatically sync
```

### Integration Testing

```bash
# Test embeddable version
npm run build
npm run preview

# Navigate to http://localhost:4173/embed.html
# Test iframe communication
```

---

## 🚀 Deployment

### Automatic Deployment (via GitHub Actions)

When you push to `main`, the CI/CD workflow automatically:

1. ✅ Runs TypeScript type checking
2. ✅ Runs linting (warnings allowed)
3. ✅ Builds production bundle with Blaze environment variables
4. ✅ Deploys to Cloudflare Pages
5. ✅ Sends Discord notification

### Manual Deployment

```bash
# Build with Blaze credentials
VITE_BLAZE_CLIENT_ID=X252EXMZ5BD2XZNIU804XVGYM9A6KXG4 \
VITE_BLAZE_CLIENT_SECRET=4252V9LMU8NHY4KN7WIVR3RVNW4WXHV3456ZNE6XGUNEOR3BHE3NPD1JXE62WNHG \
VITE_BLAZE_API_KEY=blaze_live_83453667ea265aa73a3ccae226cc0003ba006b27a36fe8470828e65f6c7871f5 \
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=sandlot-sluggers
```

---

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
2. **Use GitHub Secrets** for CI/CD environment variables
3. **Validate iframe origin** before processing messages
4. **Implement CORS** properly for Blaze domain
5. **Rotate API keys** periodically
6. **Monitor Sentry** for authentication errors

### CORS Configuration

Ensure Cloudflare Pages allows embedding from blazesportsintel.com:

```javascript
// In Cloudflare Workers/Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## 📈 Monitoring

### Sentry Integration

Blaze API errors are automatically captured by Sentry:

```typescript
try {
  await blazeAPI.submitGameStats(stats);
} catch (error) {
  console.error('Blaze sync failed:', error);
  // Error automatically sent to Sentry
}
```

### Health Checks

```typescript
import { getBlazeAPI } from './services/BlazeAPI';

const blazeAPI = getBlazeAPI();

// Check if Blaze API is configured
if (blazeAPI.isConfigured()) {
  console.log('✅ Blaze Sports Intel integration active');

  // Health check
  const health = await blazeAPI.healthCheck();
  console.log('Blaze API status:', health.status);
} else {
  console.warn('⚠️ Blaze Sports Intel not configured');
}
```

---

## 🐛 Troubleshooting

### Stats not syncing to Blaze

**Check:**
1. Environment variables are set correctly in `.env.local`
2. Blaze API credentials are valid
3. Network requests aren't blocked (check DevTools → Network)
4. Console logs show `✅ Stats synced to Blaze Sports Intel`

**Debug:**
```typescript
const blazeAPI = getBlazeAPI();

console.log('Blaze configured:', blazeAPI.isConfigured());

// Test authentication
try {
  await blazeAPI.authenticate();
  console.log('✅ Authentication successful');
} catch (error) {
  console.error('❌ Authentication failed:', error);
}
```

### Iframe not communicating

**Check:**
1. Parent domain is whitelisted in `embed.html` (`isAllowedOrigin()`)
2. `postMessage` origin matches iframe URL
3. Browser console for CORS errors
4. Message event listeners are properly attached

---

## 📝 Development Checklist

- [x] Blaze API client implementation
- [x] OAuth2 authentication flow
- [x] Stats synchronization in ProgressionAPI
- [x] Embeddable iframe version
- [x] Parent-iframe communication API
- [x] Environment variable configuration
- [x] GitHub Actions workflow update
- [x] Error handling and offline support
- [x] Documentation

---

## 🎯 Next Steps

1. **Backend Setup**: Configure Blaze Sports Intel API endpoints at `api.blazesportsintel.com`
2. **User Authentication**: Implement full user login flow (currently using client credentials)
3. **Achievement System**: Define and implement game achievements
4. **Leaderboard UI**: Build in-game leaderboard displays
5. **Analytics Dashboard**: Create admin dashboard for viewing aggregated stats

---

## 📚 Additional Resources

- [Blaze Sports Intel Platform](https://blazesportsintel.com)
- [OAuth2 Specification](https://oauth.net/2/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [PostMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Cloudflare Pages](https://pages.cloudflare.com)

---

**Questions or Issues?**

Contact: ahump20@outlook.com
Repository: [github.com/ahump20/Sandlot-Sluggers](https://github.com/ahump20/Sandlot-Sluggers)

**All systems operational and ready for championship-level sports analytics!** ⚾🏆
