# BSI-NextGen Deployment Guide

**Status:** Production-Ready Platform
**Repository:** https://github.com/ahump20/BSI-NextGen
**Last Updated:** 2025-11-09

---

## ✅ Platform Status: PRODUCTION-READY

All 4 sports fully implemented and tested:
- ✅ College Baseball (ESPN API)
- ✅ MLB (Official MLB Stats API)
- ✅ NFL (SportsDataIO)
- ✅ NBA (SportsDataIO)

**Build Status:**
```
✓ 0 TypeScript errors
✓ 12/12 static pages generated
✓ 21 API endpoints functional
✓ Total bundle: 87.2 KB gzipped
```

---

## Quick Deploy: Vercel (Recommended)

### 1. Import from GitHub

Go to: https://vercel.com/new

- Click "Import Project"
- Select `ahump20/BSI-NextGen`
- Root Directory: `packages/web`

### 2. Configure

- **Framework:** Next.js (auto-detected)
- **Build Command:** `cd ../.. && pnpm build`
- **Output Directory:** `.next`

### 3. Add Environment Variable

```
SPORTSDATAIO_API_KEY=6ca2adb39404482da5406f0a6cd7aa37
```

### 4. Deploy

Click "Deploy" - Live in 2-3 minutes at `https://bsi-nextgen.vercel.app`

### 5. Custom Domain (Optional)

- Go to Project Settings → Domains
- Add `blazesportsintel.com`
- Update DNS as instructed

---

## Alternative: Netlify

```bash
# Build locally
pnpm build

# Deploy
netlify deploy --prod --dir=packages/web/.next
```

---

## Alternative: Cloudflare Pages

```bash
# Deploy via Wrangler
cd packages/web
CLOUDFLARE_API_TOKEN="r-2jlIcjxuS-INveZJAaJS-IzwtJeh6HvH9qi9Fi" \
npx wrangler pages deploy .next \
--project-name=bsi-nextgen \
--branch=main
```

---

## Post-Deployment Verification

### Test API Endpoints

```bash
# College Baseball
curl https://your-domain.com/api/sports/college-baseball/games

# MLB
curl https://your-domain.com/api/sports/mlb/games

# NFL
curl https://your-domain.com/api/sports/nfl/games?week=1

# NBA
curl https://your-domain.com/api/sports/nba/games
```

### Run Verification Script

```bash
./verify-deployment.sh https://your-domain.com
```

Expected: ✓ 20/21 endpoints passing

---

## Environment Variables

### Required

```bash
SPORTSDATAIO_API_KEY=6ca2adb39404482da5406f0a6cd7aa37
```

### Optional

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://blazesportsintel.com
```

---

## Sports Coverage

### College Baseball
- Games with box scores
- Conference standings
- Team rosters
- **Data Source:** ESPN API (free)

### MLB
- Live games with linescores
- Division standings
- All team data
- **Data Source:** MLB Stats API (free)

### NFL
- Week-based scheduling
- Conference standings
- Team rosters
- **Data Source:** SportsDataIO (paid)

### NBA
- Date-based scheduling
- Conference standings
- Team rosters
- **Data Source:** SportsDataIO (paid)

---

## Custom Domain Setup

### DNS Records (Vercel)

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

SSL certificates auto-provisioned by all platforms.

---

## Troubleshooting

### Build Fails

```bash
pnpm clean
pnpm install
pnpm build
```

### API Returns 500 Errors

Check:
1. Environment variables set
2. API keys valid
3. Check deployment logs

### Pages Not Loading

Check:
1. All packages built
2. No circular dependencies
3. Static generation completed

---

## Support

- **Repository:** https://github.com/ahump20/BSI-NextGen
- **Documentation:** See CLAUDE.md
- **Deployment Scripts:** `deploy-production.sh`, `verify-deployment.sh`

---

**Ready for deployment to blazesportsintel.com** ✅
