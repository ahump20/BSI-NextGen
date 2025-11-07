# Sandlot Sluggers - Deployment Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-06
**Status:** Production-Ready Backend Deployment

---

## Documentation Overview

This directory contains comprehensive deployment architecture documentation for Sandlot Sluggers, a mobile-first 3D baseball game built with Babylon.js and deployed on Cloudflare Pages.

---

## Quick Navigation

### 🚀 **For Immediate Deployment**
**Start here:** [`DEPLOYMENT_QUICKSTART.md`](./DEPLOYMENT_QUICKSTART.md)
- 30-minute deployment guide
- Step-by-step instructions
- Common issues + solutions
- **Best for:** Getting backend live quickly

---

### 📋 **For Strategic Planning**
**Start here:** [`EXECUTIVE_BRIEFING.md`](./EXECUTIVE_BRIEFING.md)
- Executive summary
- Risk assessment
- Resource requirements
- Timeline + milestones
- **Best for:** Understanding project scope and decisions

---

### 🏗️ **For Technical Implementation**
**Start here:** [`DEPLOYMENT_ARCHITECTURE.md`](./DEPLOYMENT_ARCHITECTURE.md)
- Complete system architecture (22,500 lines)
- API contracts and data flows
- Database schema details
- Monitoring + observability
- Troubleshooting guide
- **Best for:** Deep technical understanding

---

## Document Comparison

| Document | Length | Audience | Purpose |
|----------|--------|----------|---------|
| **DEPLOYMENT_QUICKSTART.md** | 350 lines | Engineers (hands-on) | Fast deployment |
| **EXECUTIVE_BRIEFING.md** | 850 lines | Leadership + Engineers | Strategic overview |
| **DEPLOYMENT_ARCHITECTURE.md** | 22,500 lines | Staff+ Engineers | Complete technical reference |
| **README.md** (this file) | 200 lines | All | Navigation guide |

---

## Deployment Artifacts

### Scripts (`/scripts/`)
```bash
deploy-backend.sh       # Automated deployment (6 steps)
test-api.sh            # Integration tests (7 tests)
rollback-backend.sh    # Emergency rollback (2 modes)
health-check.sh        # Production monitoring
validate-production.sh # Post-deployment validation
```

### Backend Functions (`/functions/api/`)
```typescript
health.ts              // NEW: System health monitoring
game-result.ts         // Record game results + XP
progress/[playerId].ts // Player progression data
stats/                 // Global + leaderboard stats
```

---

## Deployment Phases

### Phase 1: D1 Database (Critical Path)
**Time:** 30 minutes
**Risk:** LOW
**Command:** `./scripts/deploy-backend.sh`

**Deliverables:**
- D1 schema deployed
- Tables created (player_progress, leaderboard)
- Indexes added (3 total)
- Connection verified

---

### Phase 2: API Validation
**Time:** 2 hours
**Risk:** MEDIUM
**Command:** `./scripts/test-api.sh`

**Deliverables:**
- 7 integration tests passing
- Response times < 500ms
- Error rate < 1%
- CORS verified

---

### Phase 3: KV Leaderboard Cache
**Time:** 1 hour
**Risk:** LOW
**Command:** Deploy leaderboard endpoint

**Deliverables:**
- KV cache operational
- Cache hit rate > 80%
- D1 queries reduced 5x
- Leaderboard endpoint live

---

## Current System Status

### ✅ Production (Deployed)
- Frontend: Babylon.js 3D game
- Hosting: Cloudflare Pages
- URL: https://5e1ebbdb.sandlot-sluggers.pages.dev
- Physics: Havok engine
- Offline mode: IndexedDB fallback

### ⚠️ Ready (Not Deployed)
- D1 database schema
- Pages Functions (API endpoints)
- KV namespace binding
- Integration tests

### ❌ Future Work
- Durable Objects (multiplayer)
- OAuth authentication
- Advanced analytics
- Mobile app packaging

---

## Architecture at a Glance

```
Frontend (Babylon.js 3D)
    ↓ HTTPS
Cloudflare Pages (Static + Functions)
    ↓ Bindings
D1 Database + KV Cache
    ↓ (Future)
Durable Objects (Multiplayer)
```

**Current State:** Frontend ✅ | Backend ⚠️ | Multiplayer ❌

---

## Success Metrics

### Phase 1 (D1)
- Schema applied: ✅ / ❌
- Tables created: ✅ / ❌
- Indexes added: ✅ / ❌
- Test query works: ✅ / ❌

### Phase 2 (API)
- Tests passing: 0/7
- Response time: ? ms (target: <500ms)
- Error rate: ? % (target: <1%)
- Uptime: ? hours

### Phase 3 (KV)
- Cache hit rate: ? % (target: >80%)
- D1 query reduction: ? x (target: 5x)
- Latency: ? ms (target: <50ms)

---

## Quick Reference Commands

### Deployment
```bash
# Full backend deployment
./scripts/deploy-backend.sh

# Run tests
./scripts/test-api.sh

# Rollback
./scripts/rollback-backend.sh
```

### Monitoring
```bash
# Health check
curl https://5e1ebbdb.sandlot-sluggers.pages.dev/api/health | jq .

# Live logs
wrangler pages deployment tail --project-name sandlot-sluggers

# D1 query
wrangler d1 execute blaze-db --command="SELECT COUNT(*) FROM player_progress"
```

### Troubleshooting
```bash
# Fix Wrangler dependency
npm install @cloudflare/workerd-darwin-arm64 --save-optional

# Verify D1 schema
wrangler d1 execute blaze-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# Check bindings
# Go to: Cloudflare Dashboard > Pages > sandlot-sluggers > Settings > Functions
```

---

## API Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/health` | GET | ✅ Ready | System health check |
| `/api/progress/{id}` | GET | ✅ Ready | Get player progress |
| `/api/game-result` | POST | ✅ Ready | Record game result |
| `/api/stats/global` | GET | ✅ Ready | Global statistics |
| `/api/leaderboard` | GET | ⚠️ Phase 3 | Leaderboard (KV cache) |

---

## Database Schema

### Table: `player_progress`
```sql
CREATE TABLE player_progress (
  player_id TEXT PRIMARY KEY,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  total_home_runs INTEGER DEFAULT 0,
  unlocked_characters TEXT DEFAULT '[]',
  unlocked_stadiums TEXT DEFAULT '[]',
  current_level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `leaderboard`
```sql
CREATE TABLE leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  player_name TEXT,
  stat_type TEXT NOT NULL,
  stat_value INTEGER NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES player_progress(player_id)
);
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| D1 schema fails | LOW | HIGH | Idempotent schema + rollback |
| API errors | MEDIUM | HIGH | Circuit breaker + offline mode |
| Data loss | LOW | CRITICAL | Backup + transactions |
| Wrangler issue | MEDIUM | MEDIUM | Documented fix available |

---

## Support Resources

### Cloudflare Dashboard
- Pages: https://dash.cloudflare.com/pages
- D1: https://dash.cloudflare.com/d1
- KV: https://dash.cloudflare.com/kv
- Analytics: https://dash.cloudflare.com/analytics

### Documentation
- Official: https://developers.cloudflare.com/pages/
- D1: https://developers.cloudflare.com/d1/
- KV: https://developers.cloudflare.com/kv/

### Project Files
- Schema: `/schema.sql`
- Config: `/wrangler.toml`
- README: `/README.md`

---

## Recommended Reading Order

**For Quick Deployment:**
1. This README (navigation)
2. DEPLOYMENT_QUICKSTART.md (30-min guide)
3. Run `./scripts/deploy-backend.sh`

**For Strategic Planning:**
1. EXECUTIVE_BRIEFING.md (overview)
2. DEPLOYMENT_QUICKSTART.md (implementation)
3. Review `/scripts/` for automation

**For Deep Dive:**
1. DEPLOYMENT_ARCHITECTURE.md (complete guide)
2. `/schema.sql` (database design)
3. `/functions/api/` (implementation details)

---

## Next Steps

1. **Immediate (Today):**
   - [ ] Read DEPLOYMENT_QUICKSTART.md
   - [ ] Fix Wrangler dependency
   - [ ] Deploy D1 schema

2. **Day 2:**
   - [ ] Run integration tests
   - [ ] Monitor API performance
   - [ ] Fix any issues

3. **Day 3:**
   - [ ] Deploy KV cache
   - [ ] Optimize slow queries
   - [ ] Document lessons learned

4. **Week 2:**
   - [ ] Review Phase 4 (multiplayer)
   - [ ] Plan OAuth integration
   - [ ] Mobile app testing

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-06 | Initial deployment architecture created |

---

## Contact & Contributions

**Project Owner:** Austin Humphrey
**Location:** Boerne, Texas
**Repository:** /Users/AustinHumphrey/Sandlot-Sluggers

**Contributions:**
- Bug reports: Document in `/docs/` with reproduction steps
- Feature requests: Create ADR (Architecture Decision Record)
- Code changes: Test with `./scripts/test-api.sh` before deployment

---

## License

MIT License - See `/LICENSE` for details

---

**END OF DOCUMENTATION INDEX**
