# League-Wide Sports Data - Quick Reference Card

**Date:** January 11, 2025 | **Timezone:** America/Chicago

---

## 🚀 Quick Start

### Build & Test
```bash
# Rebuild API package with new orchestrator
pnpm --filter @bsi/api build

# Start dev server
pnpm dev

# Test unified endpoints
curl http://localhost:3000/api/unified/games
curl http://localhost:3000/api/unified/search?q=Cardinals
curl http://localhost:3000/api/unified/live
```

---

## 📊 New Unified API Endpoints

| Endpoint | Purpose | Cache TTL |
|----------|---------|-----------|
| `GET /api/unified/games?date=YYYY-MM-DD` | All games from all leagues | 30s (live), 5min (other) |
| `GET /api/unified/standings` | All standings from all leagues | 5min |
| `GET /api/unified/search?q=query` | Search teams across all leagues | 1hr |
| `GET /api/unified/live` | Only live games | 15s |

---

## 🎯 Coverage Status

| Sport | API Source | Cost | Status |
|-------|-----------|------|--------|
| MLB | MLB Stats API | Free | ✅ Complete |
| NFL | SportsDataIO | $50/mo | ✅ Complete |
| NBA | SportsDataIO | Included | ✅ Complete |
| NCAA Football | ESPN API | Free | ✅ Complete |
| College Baseball | ESPN API | Free | ✅ 40% (Box Scores) |

---

## 🔧 Code Examples

### Use Orchestrator (Backend)
```typescript
import { orchestrator } from '@bsi/api';

// Get all games for today
const response = await orchestrator.getAllGames('2025-01-11');
console.log(`${response.data.length} games, confidence: ${response.aggregatedConfidence}`);

// Search teams
const results = await orchestrator.search('Cardinals');
```

### Fetch from API (Frontend)
```typescript
// All games
const { games, meta } = await fetch('/api/unified/games').then(r => r.json());

// Search
const { results } = await fetch('/api/unified/search?q=Cardinals').then(r => r.json());

// Live games only
const { liveGames } = await fetch('/api/unified/live').then(r => r.json());
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `packages/api/src/orchestrator/league-orchestrator.ts` | League orchestrator class |
| `packages/web/app/api/unified/games/route.ts` | Unified games endpoint |
| `packages/web/app/api/unified/search/route.ts` | Unified search endpoint |
| `packages/web/app/api/unified/live/route.ts` | Live games endpoint |
| `docs/LEAGUE_WIDE_DATA_MANAGEMENT.md` | 15,000-word comprehensive plan |
| `docs/UNIFIED_API_QUICKSTART.md` | Developer quick start guide |
| `docs/LEAGUE_WIDE_IMPLEMENTATION_SUMMARY.md` | Executive summary |

---

## ✅ Next Actions

1. **Build API Package:**
   ```bash
   pnpm --filter @bsi/api build
   ```

2. **Test Endpoints:**
   ```bash
   pnpm dev
   curl http://localhost:3000/api/unified/games
   ```

3. **Build Multi-League Dashboard:**
   - Create `packages/web/app/unified/page.tsx`
   - Display games from all leagues
   - Add search bar
   - Implement live updates

4. **Deploy to Production:**
   ```bash
   git add .
   git commit -m "Add league-wide orchestrator and unified API endpoints"
   git push origin main
   ```

---

## 📞 Support

**Questions?** ahump20@outlook.com
**Platform:** blazesportsintel.com
**Repo:** github.com/ahump20/BSI-NextGen

---

*Generated: January 11, 2025, 2:45 PM CST*
