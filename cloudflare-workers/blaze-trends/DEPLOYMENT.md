# Blaze Trends Deployment Guide

Complete deployment guide for the Blaze Trends Cloudflare Worker and Next.js frontend.

## Prerequisites

### Required Accounts
- **Cloudflare Account** with Workers enabled
- **OpenAI API Key** (GPT-4 Turbo access)
- **Brave Search API Key** (free tier available)
- **Vercel Account** (for frontend deployment)
- **GitHub Account** (for CI/CD)

### Local Development Tools
- Node.js 20+
- npm or pnpm
- wrangler CLI (`npm install -g wrangler`)

## Part 1: Cloudflare Worker Setup

### Step 1: Install Dependencies

```bash
cd cloudflare-workers/blaze-trends
npm install
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate.

### Step 3: Get Your Account ID

```bash
wrangler whoami
```

Copy your account ID and update `wrangler.toml`:

```toml
account_id = "YOUR_ACCOUNT_ID"
```

### Step 4: Create D1 Database

```bash
npm run db:create
```

This will output:

```
✅ Successfully created DB 'blaze-trends-db'

[[d1_databases]]
binding = "DB"
database_name = "blaze-trends-db"
database_id = "xxxx-xxxx-xxxx-xxxx"
```

Copy the `database_id` and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "blaze-trends-db"
database_id = "YOUR_DATABASE_ID"
```

### Step 5: Initialize Database Schema

```bash
npm run db:init
```

This runs the schema.sql file to create tables.

### Step 6: Create KV Namespaces

**Production:**
```bash
npm run kv:create
```

Output:
```
✅ Success! Created KV namespace
id = "xxxx-xxxx-xxxx"
```

**Preview (for dev):**
```bash
npm run kv:create:preview
```

Update `wrangler.toml` with both IDs:

```toml
[[kv_namespaces]]
binding = "BLAZE_TRENDS_CACHE"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_ID"
```

### Step 7: Set API Key Secrets

**OpenAI API Key:**
```bash
npm run secret:openai
# Enter your OpenAI API key when prompted
```

**Brave Search API Key:**
```bash
npm run secret:brave
# Enter your Brave API key when prompted
```

### Step 8: Test Locally

```bash
npm run dev
```

Visit `http://localhost:8787`:
- `/health` - Health check
- `/api/trends` - Get all trends
- `/cron/monitor` - Manually trigger monitoring

### Step 9: Deploy to Cloudflare

```bash
npm run deploy
```

Your worker will be available at:
```
https://blaze-trends.YOUR_SUBDOMAIN.workers.dev
```

### Step 10: Configure Cron Triggers

Cron triggers are already configured in `wrangler.toml`:

```toml
[triggers]
crons = ["*/15 * * * *"]
```

This runs monitoring every 15 minutes.

### Step 11: Set Up Custom Domain (Optional)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to Settings → Triggers → Custom Domains
4. Add: `trends.blazesportsintel.com` or similar

Update your DNS:
```
CNAME trends YOUR_SUBDOMAIN.workers.dev
```

## Part 2: Frontend Setup (Next.js)

### Step 1: Configure Environment Variables

Create `.env.local` in `packages/web/`:

```bash
# Cloudflare Worker URL
NEXT_PUBLIC_WORKER_URL=https://blaze-trends.YOUR_SUBDOMAIN.workers.dev
```

### Step 2: Install Dependencies

```bash
cd packages/web
pnpm install
```

### Step 3: Build and Test Locally

```bash
pnpm build
pnpm dev
```

Visit `http://localhost:3000/trends`

### Step 4: Deploy to Vercel

**Option A: Automatic Deployment via GitHub**

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variable in Vercel Dashboard:
   - `NEXT_PUBLIC_WORKER_URL` = Your worker URL

**Option B: Manual Deployment**

```bash
cd packages/web
npx vercel --prod
```

Set environment variables when prompted.

## Part 3: GitHub Actions Setup

### Step 1: Add Repository Secrets

Go to GitHub → Settings → Secrets and variables → Actions

Add the following secrets:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your account ID

### Step 2: Create Workflow File

The workflow file is already created at `.github/workflows/deploy-blaze-trends.yml`.

It will automatically deploy on:
- Push to `main` branch
- Changes in `cloudflare-workers/blaze-trends/**`

### Step 3: Test Deployment

```bash
git add .
git commit -m "Add Blaze Trends feature"
git push origin main
```

Monitor deployment at: GitHub → Actions

## Part 4: Verification

### Test Worker Endpoints

**Health Check:**
```bash
curl https://blaze-trends.YOUR_SUBDOMAIN.workers.dev/health
```

**Get Trends:**
```bash
curl https://blaze-trends.YOUR_SUBDOMAIN.workers.dev/api/trends
```

**Get Trends by Sport:**
```bash
curl https://blaze-trends.YOUR_SUBDOMAIN.workers.dev/api/trends?sport=college_baseball
```

**Trigger Monitoring (Manual):**
```bash
curl https://blaze-trends.YOUR_SUBDOMAIN.workers.dev/cron/monitor
```

### Test Frontend

Visit your Vercel deployment URL and navigate to `/trends`.

### Check Cron Logs

```bash
cd cloudflare-workers/blaze-trends
npm run tail
```

This shows real-time logs from your worker.

### Query Database

```bash
# List all trends
npm run db:query "SELECT * FROM trends ORDER BY created_at DESC LIMIT 5"

# Count articles
npm run db:query "SELECT sport, COUNT(*) as count FROM news_articles GROUP BY sport"

# Check monitoring logs
npm run db:query "SELECT * FROM monitoring_logs ORDER BY timestamp DESC LIMIT 10"
```

## Part 5: Monitoring & Maintenance

### Cloudflare Dashboard

Monitor your worker at: https://dash.cloudflare.com

Key metrics:
- Requests per minute
- Error rate
- CPU time
- KV operations
- D1 queries

### View Cron Execution

Go to: Workers & Pages → blaze-trends → Logs

Filter by cron trigger to see scheduled executions.

### Check API Usage

**Brave Search API:**
- Free tier: 2,000 queries/month
- At 15-min intervals with 5 sports: ~14,400 queries/month
- May need paid tier (~$5/month)

**OpenAI API:**
- GPT-4 Turbo: ~$0.01 per 1K tokens
- Expected cost: ~$10/month for 2,880 calls/month

### Database Maintenance

**Clean old articles (monthly):**
```sql
DELETE FROM news_articles
WHERE created_at < datetime('now', '-30 days');
```

Run via:
```bash
npm run db:query "DELETE FROM news_articles WHERE created_at < datetime('now', '-30 days')"
```

**Archive old trends (monthly):**
```sql
DELETE FROM trends
WHERE created_at < datetime('now', '-90 days');
```

## Part 6: Troubleshooting

### Worker Returns 500 Errors

**Check secrets are set:**
```bash
wrangler secret list
```

Should show:
- `OPENAI_API_KEY`
- `BRAVE_API_KEY`

**Check logs:**
```bash
npm run tail
```

### No Trends Generated

**Check monitoring logs:**
```bash
npm run db:query "SELECT * FROM monitoring_logs WHERE event_type = 'monitor_error' ORDER BY timestamp DESC LIMIT 5"
```

**Manually trigger monitoring:**
```bash
curl https://blaze-trends.YOUR_SUBDOMAIN.workers.dev/cron/monitor
```

### Frontend Shows Error

**Check CORS is enabled** - Already configured in worker.

**Verify worker URL** in `.env.local`:
```bash
echo $NEXT_PUBLIC_WORKER_URL
```

**Check browser console** for network errors.

### Database Query Timeouts

D1 has limits:
- Max query time: 30 seconds
- Max database size: 10 GB

**Optimize queries:**
- Add indexes (already in schema.sql)
- Archive old data regularly
- Use pagination for large results

## Part 7: Cost Estimation

### Monthly Costs

| Service | Usage | Cost |
|---------|-------|------|
| Cloudflare Workers | ~100k requests | $5 |
| D1 Database | 5M reads, 100k writes | $0.75 |
| KV Storage | 100k reads | $0.50 |
| OpenAI API | 2,880 calls/month | $10 |
| Brave Search | 14,400 searches/month | $5 |
| Vercel | Free tier | $0 |
| **Total** | | **~$21/month** |

### Optimization Tips

1. **Increase cron interval** to 30 minutes (half the cost)
2. **Reduce articles per sport** from 20 to 10
3. **Cache more aggressively** - extend TTL from 5min to 15min
4. **Batch API calls** - process multiple sports in one OpenAI call

## Part 8: Scaling

### Handling Increased Traffic

**KV Cache Configuration:**
- Current TTL: 5 minutes
- Increase to 10-15 minutes for more cache hits
- Reduces worker invocations and API costs

**D1 Scaling:**
- D1 automatically scales
- Consider Hyperdrive for connection pooling if needed

**Worker Concurrency:**
- Workers scale automatically to handle load
- No configuration needed

### Adding More Sports

Edit `src/index.ts` and add to `SPORTS_CONFIG`:

```typescript
const SPORTS_CONFIG = {
  // ... existing sports
  nhl: {
    keywords: ['NHL', 'National Hockey League', 'hockey'],
    priority: 6,
  },
};
```

Redeploy:
```bash
npm run deploy
```

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/yourusername/blaze-trends/issues
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Blaze Sports Intel**: contact@blazesportsintel.com

## Next Steps

1. ✅ Deploy worker to production
2. ✅ Configure custom domain
3. ✅ Deploy frontend to Vercel
4. ✅ Set up monitoring alerts
5. ✅ Test cron execution
6. ✅ Share with users!

---

**Deployed by:** [Your Name]
**Deployment Date:** [Date]
**Version:** 1.0.0
