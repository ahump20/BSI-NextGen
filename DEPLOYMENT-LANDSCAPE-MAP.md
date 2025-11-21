# Blaze Sports Intelligence - Deployment Landscape Map
**Visual Guide to All BSI Deployments**
**Date:** November 7, 2025

---

## 🗺️ Deployment Ecosystem Overview

```
BLAZE SPORTS INTELLIGENCE ECOSYSTEM
====================================

┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DOMAINS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  blazesportsintel.com (PRIMARY)                             │
│  ✅ LIVE | Cloudflare Pages | Real ESPN Data               │
│  ⚠️ api.blazesportsintel.com (522 ERROR - DOWN)             │
│  ⚠️ www.blazesportsintel.com (404 NOT FOUND)                │
│                                                              │
│  blaze-intelligence.netlify.app (SECONDARY)                 │
│  ✅ ACTIVE | Netlify | MLB Statcast Analytics              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE PAGES DEPLOYMENTS                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  sandlot-sluggers (THIS PROJECT)                            │
│  https://ebd35fb7.sandlot-sluggers.pages.dev               │
│  ✅ 3D Baseball Game + Backend API + D1 + KV               │
│  ⚠️ Missing: Real sports data, analytics, college baseball │
│                                                              │
│  blaze-intelligence (MAIN BSI PROJECT - 26+ versions)       │
│  - b7b1ea2a.blaze-intelligence.pages.dev (Latest)          │
│  - de4f80ea.blaze-intelligence.pages.dev (Previous)        │
│  - 76c9e5b9.blaze-intelligence.pages.dev (Unified HQ)      │
│  - 288211e2.blaze-intelligence.pages.dev (Optimized)       │
│  - 4ce1b7a1.blaze-intelligence.pages.dev (Visual Upgrade)  │
│                                                              │
│  Specialized Projects (Cloudflare Pages):                   │
│  - blaze-3d-worlds                                          │
│  - blaze-ar-coaching                                        │
│  - blaze-video-intelligence                                 │
│  - blaze-championship-analytics                             │
│  - blaze-mcp-integration                                    │
│  - blaze-neural-platform                                    │
│  - blaze-real-time-intelligence                             │
│  - blaze-college-baseball (TBD)                             │
│  ... and 18 more                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 LOCAL CODEBASES (SOURCE)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /Users/AustinHumphrey/Sandlot-Sluggers/                   │
│  🎮 3D Baseball Game                                        │
│  ✅ Babylon.js + WebGPU + Havok Physics                    │
│  ✅ Cloudflare D1 + KV + Pages Functions                   │
│  ✅ OpenAPI 3.0 Documentation (25,000+ lines)              │
│  ⚠️ 4 Security Blockers Identified                         │
│                                                              │
│  /Users/AustinHumphrey/BSI-1/                               │
│  🏆 SUPERIOR ANALYTICS PLATFORM                             │
│  ✅ Monte Carlo Engine (100k simulations)                  │
│  ✅ Championship Dashboard Integration                      │
│  ✅ Real MLB/NFL/NBA Data APIs                             │
│  ✅ 20+ Production API Endpoints                            │
│  ✅ 3D Championship Visualizer                              │
│  ⚠️ Less Organized Than Sandlot Sluggers                   │
│                                                              │
│  /Users/AustinHumphrey/blaze-college-baseball/              │
│  🎓 COLLEGE SPORTS EXCELLENCE                               │
│  ✅ Full D1 Baseball Coverage                              │
│  ✅ Biomechanics Vision System                             │
│  ✅ Power Rankings System                                   │
│  ✅ Conference Tracking (SEC, Big 12, ACC, Pac-12)         │
│  ✅ Visual Integration (Three.js)                           │
│                                                              │
│  /Users/AustinHumphrey/blaze-intelligence-platform/         │
│  📊 LEGACY PLATFORM (mostly inactive)                       │
│  ⚠️ Character Intelligence (38KB code)                     │
│  ⚠️ Dashboard Templates (empty shells)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  REPLIT DEPLOYMENTS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Main Development Environment:                               │
│  https://cd1a64ed-e3df-45a6-8410-e0bb8c2e0e1e.prod...      │
│  ⚠️ Status: 400 (Zero values issue)                        │
│  ⚠️ Priority: HIGH - Fix credibility issues                │
│                                                              │
│  Staging/Backup Environments:                                │
│  - 865077b5-eb09-4af8-aed5-e38e370bbbf8.prod...            │
│  - 879fdff1-f80d-479e-ae8c-b5a3a69d3d51.prod...            │
│  - 3872c2f8-7ccd-4a55-8d89-ac852df88e07.prod... (Enhanced) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Feature Distribution Across Deployments

### Game Engine & 3D
```
Sandlot Sluggers:         ████████████████████ 100% (Babylon.js + WebGPU)
BSI-1:                    ████░░░░░░░░░░░░░░░░  20% (3D visualizations only)
blaze-college-baseball:   ████░░░░░░░░░░░░░░░░  20% (Three.js charts)
blazesportsintel.com:     ░░░░░░░░░░░░░░░░░░░░   0% (no 3D)
```

### Real Sports Data Integration
```
Sandlot Sluggers:         ░░░░░░░░░░░░░░░░░░░░   0% (none)
BSI-1:                    ████████████████████ 100% (MLB/NFL/NBA/NCAA)
blaze-college-baseball:   ███████████████░░░░░  75% (College + MLB/NFL/NBA)
blazesportsintel.com:     ████████████░░░░░░░░  60% (ESPN API only)
```

### Monte Carlo / Championship Analytics
```
Sandlot Sluggers:         ░░░░░░░░░░░░░░░░░░░░   0% (none)
BSI-1:                    ████████████████████ 100% (full engine)
blaze-college-baseball:   ██████████░░░░░░░░░░  50% (visualizer only)
blazesportsintel.com:     ░░░░░░░░░░░░░░░░░░░░   0% (none)
```

### College Baseball Coverage
```
Sandlot Sluggers:         ░░░░░░░░░░░░░░░░░░░░   0% (none)
BSI-1:                    ░░░░░░░░░░░░░░░░░░░░   0% (none)
blaze-college-baseball:   ████████████████████ 100% (full D1 coverage)
blazesportsintel.com:     ░░░░░░░░░░░░░░░░░░░░   0% (none)
```

### Documentation Quality
```
Sandlot Sluggers:         ████████████████████ 100% (OpenAPI 3.0, 25k lines)
BSI-1:                    ████░░░░░░░░░░░░░░░░  20% (code comments only)
blaze-college-baseball:   ████████░░░░░░░░░░░░  40% (API docs present)
blazesportsintel.com:     ██░░░░░░░░░░░░░░░░░░  10% (minimal)
```

### Security Posture
```
Sandlot Sluggers:         ██████████████░░░░░░  70% (audit complete, 4 blockers)
BSI-1:                    ██████░░░░░░░░░░░░░░  30% (unknown, needs audit)
blaze-college-baseball:   ████████████░░░░░░░░  60% (headers present)
blazesportsintel.com:     ██████████████████░░  90% (excellent headers)
```

### Code Organization
```
Sandlot Sluggers:         ████████████████████ 100% (Vite 5 + TypeScript)
BSI-1:                    ████████░░░░░░░░░░░░  40% (messy structure)
blaze-college-baseball:   ████████████████░░░░  80% (good structure)
blazesportsintel.com:     ██████████████░░░░░░  70% (decent)
```

---

## 📊 Quality Assessment by Feature Category

### 🥇 GOLD STANDARD (Port These Features)

**Monte Carlo Simulation Engine**
- Source: BSI-1 (`/monte-carlo-engine.js`)
- Quality: ⭐⭐⭐⭐⭐ (100k simulations, Web Workers, statistical distributions)
- Status: Production-ready, needs TypeScript conversion
- Destination: Sandlot Sluggers → `/lib/analytics/monte-carlo-engine.ts`

**Real Sports Data APIs**
- Source: BSI-1 (`/functions/api/sports-data-real-*.js`)
- Quality: ⭐⭐⭐⭐⭐ (MLB Stats API, ESPN API, error handling)
- Status: Production-ready, well-tested
- Destination: Sandlot Sluggers → `/functions/api/sports/`

**College Baseball Module**
- Source: blaze-college-baseball (`/college-baseball-demo.html`)
- Quality: ⭐⭐⭐⭐⭐ (D1 coverage, conference tracking, recruiting)
- Status: Production-ready, needs integration
- Destination: Sandlot Sluggers → `/src/college-baseball/`

**Championship Dashboard**
- Source: BSI-1 (`/championship-dashboard-integration.js`)
- Quality: ⭐⭐⭐⭐☆ (widget system, real-time updates, good UX)
- Status: Production-ready, needs cleanup
- Destination: Sandlot Sluggers → `/src/dashboard/`

**Power Rankings System**
- Source: blaze-college-baseball (`/js/power-rankings.js`)
- Quality: ⭐⭐⭐⭐☆ (dynamic rankings, SOS adjustments)
- Status: Production-ready
- Destination: Sandlot Sluggers → `/lib/analytics/power-rankings.ts`

### 🥈 SILVER (Consider for Phase 2)

**Biomechanics Vision System**
- Source: blaze-college-baseball (`/biomechanics_vision_system.js`)
- Quality: ⭐⭐⭐⭐⭐ (3D pose tracking, injury risk assessment)
- Status: Requires significant infrastructure (GPU, Python, video processing)
- Recommendation: Phase 3 or separate microservice

**3D Championship Visualizer**
- Source: BSI-1 (`/championship_3d_visualizer.js`)
- Quality: ⭐⭐⭐⭐☆ (Three.js charts, interactive)
- Status: Production-ready, integrate with Babylon.js scene
- Destination: Sandlot Sluggers → integrate into game engine

**Character Intelligence**
- Source: blaze-intelligence-platform (`/character-intelligence.js`)
- Quality: ⭐⭐⭐☆☆ (38KB code, unclear functionality)
- Status: Needs review before porting
- Recommendation: Audit first, may be unused

### 🥉 BRONZE (Lower Priority)

**Legacy Dashboard Templates**
- Source: blaze-intelligence-platform (various HTML files)
- Quality: ⭐⭐☆☆☆ (mostly empty shells)
- Status: Not production-ready
- Recommendation: Ignore, use BSI-1 dashboard instead

**Replit Deployments**
- Source: Multiple Replit URLs
- Quality: ⭐⭐☆☆☆ (400 errors, zero values issue)
- Status: Broken, needs fixes
- Recommendation: Fix OR deprecate, use Cloudflare instead

---

## 🚀 Optimal Integration Path (Visual)

```
BEFORE (Scattered Features):
=========================

Sandlot Sluggers:    [3D Game] [Backend API]
BSI-1:               [Monte Carlo] [Real Data] [Dashboard] [Analytics APIs]
blaze-college-baseball: [College Baseball] [Biomechanics] [Power Rankings]
blazesportsintel.com:   [Basic Site] [ESPN API]

AFTER (Unified Platform):
======================

Sandlot Sluggers (Integrated):
┌────────────────────────────────────────────────────────┐
│                                                         │
│  [3D Game] ← Original                                  │
│  [Backend API] ← Original + Enhanced                   │
│  [Monte Carlo Engine] ← Ported from BSI-1             │
│  [Real MLB/NFL/NBA Data] ← Ported from BSI-1          │
│  [Championship Dashboard] ← Ported from BSI-1         │
│  [College Baseball] ← Ported from blaze-college-bb    │
│  [Power Rankings] ← Ported from blaze-college-bb      │
│  [3D Analytics Viz] ← Ported from BSI-1               │
│  [20+ API Endpoints] ← Ported from BSI-1              │
│                                                         │
└────────────────────────────────────────────────────────┘

Result: Championship-grade unified platform
```

---

## 📍 Deployment URLs Quick Reference

### ✅ ACTIVE & RECOMMENDED

**Primary Production:**
- https://blazesportsintel.com (Cloudflare Pages)
- https://blaze-intelligence.netlify.app (Netlify)

**Current Project:**
- https://ebd35fb7.sandlot-sluggers.pages.dev (Cloudflare Pages)
- https://sandlot-sluggers.pages.dev (canonical, when deployed)

**Latest Enhanced Versions:**
- https://b7b1ea2a.blaze-intelligence.pages.dev
- https://4ce1b7a1.blaze-intelligence.pages.dev

### ⚠️ NEEDS ATTENTION

**Broken/Down:**
- https://api.blazesportsintel.com (522 error)
- https://www.blazesportsintel.com (404 not found)
- Replit URLs (400 errors, zero values)

### 📁 LOCAL SOURCE CODE (BEST FEATURES)

**Port from here:**
- /Users/AustinHumphrey/BSI-1/ (Monte Carlo, real data, APIs)
- /Users/AustinHumphrey/blaze-college-baseball/ (college sports)

**Current project:**
- /Users/AustinHumphrey/Sandlot-Sluggers/ (3D game, clean architecture)

---

## 🎯 Decision Matrix: Which Deployment to Keep?

```
                        │ Sandlot │ BSI-1 │ blaze-college │ blazesportsintel.com
                        │ Sluggers│       │  -baseball    │
────────────────────────┼─────────┼───────┼───────────────┼────────────────────
3D Game Engine          │   ✅    │  ❌   │      ❌       │        ❌
Real Sports Data        │   ❌    │  ✅   │      ✅       │        ⚠️ Partial
Monte Carlo Analytics   │   ❌    │  ✅   │      ⚠️ Partial│        ❌
College Baseball        │   ❌    │  ❌   │      ✅       │        ❌
Code Organization       │   ✅    │  ⚠️   │      ✅       │        ⚠️
Documentation          │   ✅    │  ❌   │      ⚠️       │        ❌
Security Audit         │   ✅    │  ❌   │      ⚠️       │        ✅
Modern Build System    │   ✅    │  ⚠️   │      ✅       │        ⚠️
Active Development     │   ✅    │  ⚠️   │      ⚠️       │        ✅
────────────────────────┼─────────┼───────┼───────────────┼────────────────────
TOTAL SCORE            │  6/9    │ 3/9   │     5/9       │      3/9
────────────────────────┴─────────┴───────┴───────────────┴────────────────────

WINNER: Sandlot Sluggers (best foundation, port features from others)
```

---

## 🔄 Migration Flow Diagram

```
STEP 1: Audit BSI-1 APIs
└─> Verify real data, document endpoints

STEP 2: Backup Sandlot Sluggers
└─> git tag v1.0-pre-bsi-integration

STEP 3: Create Feature Branch
└─> git checkout -b feature/bsi-integration

STEP 4: Port Monte Carlo Engine (Week 1)
┌─> BSI-1/monte-carlo-engine.js
└─> Sandlot-Sluggers/lib/analytics/monte-carlo-engine.ts

STEP 5: Port Real Data APIs (Week 1-2)
┌─> BSI-1/functions/api/sports-data-real-*.js
└─> Sandlot-Sluggers/functions/api/sports/*.ts

STEP 6: Port Championship Dashboard (Week 2-3)
┌─> BSI-1/championship-dashboard-integration.js
└─> Sandlot-Sluggers/src/dashboard/

STEP 7: Port College Baseball (Week 3-4)
┌─> blaze-college-baseball/college-baseball-demo.html
└─> Sandlot-Sluggers/src/college-baseball/

STEP 8: Port Power Rankings (Week 4)
┌─> blaze-college-baseball/js/power-rankings.js
└─> Sandlot-Sluggers/lib/analytics/power-rankings.ts

STEP 9: Port 3D Visualizations (Week 5-6)
┌─> BSI-1/championship_3d_visualizer.js
└─> Sandlot-Sluggers/src/visualizations/

STEP 10: Fix Security Blockers (Week 7)
└─> CORS, headers, timeouts, retry logic

STEP 11: Deploy to Production (Week 8)
└─> blazesportsintel.com OR sandlot-sluggers.pages.dev

RESULT: Unified Championship Platform 🏆
```

---

## 🏆 Final Recommendation Visual

```
┌────────────────────────────────────────────────────┐
│                                                     │
│            RECOMMENDED ARCHITECTURE                 │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │                                               │ │
│  │     blazesportsintel.com (Primary Domain)    │ │
│  │                                               │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ /game (3D Baseball - Sandlot Sluggers) │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  │                                               │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ /dashboard (Championship Analytics)     │ │ │
│  │  │ ← Ported from BSI-1                     │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  │                                               │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ /analytics (Monte Carlo Simulations)    │ │ │
│  │  │ ← Ported from BSI-1                     │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  │                                               │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ /college-baseball (NCAA D1 Coverage)    │ │ │
│  │  │ ← Ported from blaze-college-baseball    │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  │                                               │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ /mlb, /nfl, /nba (League Pages)         │ │ │
│  │  │ ← Ported from BSI-1                     │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  │                                               │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ /api (Unified API Layer)                │ │ │
│  │  │ ← Combined from all sources             │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Infrastructure:                                    │
│  • Cloudflare Pages (hosting)                      │
│  • Cloudflare D1 (database)                        │
│  • Cloudflare KV (cache)                           │
│  • Cloudflare R2 (assets)                          │
│                                                     │
│  Data Sources:                                      │
│  • MLB Stats API (free)                            │
│  • ESPN API (free)                                 │
│  • SportsDataIO (paid, if needed)                  │
│                                                     │
│  Result: Championship-Grade Unified Platform       │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## 📝 Summary: DO NOT Duplicate These Excellent Features

**From BSI-1 (PORT, DON'T RECREATE):**
- ✅ Monte Carlo Engine (100k simulations)
- ✅ Real MLB/NFL/NBA/NCAA data APIs
- ✅ Championship Dashboard widgets
- ✅ 20+ production API endpoints
- ✅ 3D championship visualizer

**From blaze-college-baseball (PORT, DON'T RECREATE):**
- ✅ College baseball D1 coverage
- ✅ Biomechanics vision system
- ✅ Power rankings system
- ✅ Conference tracking

**Result:** Unified platform combining best of all deployments

**Timeline:** 8 weeks

**Cost:** $12k-36k (development only)

---

**Map Created By:** Claude Sonnet 4.5 Deployment Integration Specialist
**Date:** November 7, 2025, 15:45 CST
**Status:** Ready for implementation
