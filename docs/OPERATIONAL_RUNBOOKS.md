# Operational Runbooks - BlazeSportsIntel.com

**Last Updated:** November 8, 2025
**Owner:** Infrastructure Team
**Purpose:** Standard operating procedures for common infrastructure tasks

## Table of Contents

1. [Worker Deployment](#worker-deployment)
2. [Database Operations](#database-operations)
3. [Incident Response](#incident-response)
4. [Performance Troubleshooting](#performance-troubleshooting)
5. [Backup & Recovery](#backup--recovery)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Security Procedures](#security-procedures)
8. [Scaling Operations](#scaling-operations)

---

## Worker Deployment

### Deploy New Worker

**Frequency:** As needed
**Duration:** 5-10 minutes
**Prerequisites:** Worker code tested locally

```bash
# 1. Review changes
git diff main

# 2. Run tests
npm test

# 3. Build worker
npm run build

# 4. Deploy to staging
wrangler deploy --env staging

# 5. Test staging deployment
curl https://[worker-name]-staging.workers.dev/health

# 6. Deploy to production
wrangler deploy --env production

# 7. Verify production deployment
curl https://[worker-name].workers.dev/health

# 8. Monitor logs for 5 minutes
wrangler tail [worker-name] --env production
```

**Rollback Procedure:**

```bash
# 1. List recent deployments
wrangler deployments list [worker-name]

# 2. Rollback to previous version
wrangler rollback [worker-name] --message "Rolling back due to [reason]"

# 3. Verify rollback
curl https://[worker-name].workers.dev/health
```

### Update Worker Bindings

**When:** Adding/modifying D1, KV, R2, or Hyperdrive bindings

```bash
# 1. Update wrangler.toml
# Add new binding configuration

# 2. Verify binding IDs
wrangler d1 list
wrangler kv:namespace list
wrangler r2 bucket list

# 3. Deploy with new bindings
wrangler deploy

# 4. Test binding access
# Use worker API endpoint that tests the binding
```

### Worker Performance Optimization

**When:** Worker CPU time exceeds 50ms or memory usage high

```bash
# 1. Check current performance
wrangler tail [worker-name] --format json | grep duration

# 2. Enable detailed logging
# Add console.time() / console.timeEnd() in worker code

# 3. Identify bottlenecks
# Review logs for slow operations

# 4. Common optimizations:
# - Add KV caching for repeated queries
# - Use Hyperdrive for database connections
# - Implement batch operations
# - Reduce external API calls
# - Optimize JSON parsing

# 5. Test optimizations in staging
wrangler deploy --env staging

# 6. Compare performance
# Before vs After metrics
```

---

## Database Operations

### Run Database Migration

**Frequency:** As needed for schema changes
**Duration:** 5-15 minutes
**Risk:** Medium (test thoroughly)

```bash
# 1. Create migration file
cat > migrations/$(date +%Y%m%d_%H%M%S)_add_user_preferences.sql << 'EOF'
CREATE TABLE user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  preferences TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
EOF

# 2. Test on local D1
wrangler d1 execute blaze-db --local --file=migrations/[migration-file].sql

# 3. Backup production database
wrangler d1 backup create blaze-db --name "pre-migration-$(date +%Y%m%d)"

# 4. Apply to production
wrangler d1 execute blaze-db --file=migrations/[migration-file].sql

# 5. Verify migration
wrangler d1 execute blaze-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# 6. Test application
# Verify workers can access new schema
```

### Database Backup

**Frequency:** Daily (automated) + Manual before major changes
**Duration:** 2-5 minutes
**Retention:** 30 days

```bash
# 1. Create backup
wrangler d1 backup create blaze-db --name "manual-backup-$(date +%Y%m%d)"

# 2. List backups
wrangler d1 backup list blaze-db

# 3. Verify backup size
# Check output for reasonable file size

# 4. Document backup
echo "$(date +%Y-%m-%d): Manual backup created - [reason]" >> backup-log.txt
```

### Database Restore

**Frequency:** Emergency only
**Duration:** 10-30 minutes
**Risk:** HIGH

```bash
# 1. STOP - Verify this is necessary
# Restoring will OVERWRITE current data

# 2. List available backups
wrangler d1 backup list blaze-db

# 3. Create backup of current state (safety)
wrangler d1 backup create blaze-db --name "pre-restore-$(date +%Y%m%d-%H%M%S)"

# 4. Restore from backup
wrangler d1 backup restore blaze-db --backup-id [backup-id]

# 5. Verify restoration
wrangler d1 execute blaze-db --command "SELECT COUNT(*) FROM [critical-table]"

# 6. Test application
# Verify workers function correctly

# 7. Document incident
# Log reason for restore and outcome
```

### Query Slow Database

**When:** Investigating performance issues or data

```bash
# 1. Execute query
wrangler d1 execute blaze-db --command "SELECT * FROM games WHERE date = '2025-11-08' LIMIT 10"

# 2. Analyze table size
wrangler d1 execute blaze-db --command "SELECT COUNT(*) as count FROM games"

# 3. Check indexes
wrangler d1 execute blaze-db --command "SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='games'"

# 4. Export data for analysis
wrangler d1 execute blaze-db --command "SELECT * FROM games" --json > games-export.json
```

### Database Cleanup

**Frequency:** Monthly
**Duration:** 15-30 minutes

```bash
# 1. Identify old data
wrangler d1 execute blaze-db --command \
  "SELECT COUNT(*) FROM games WHERE date < date('now', '-90 days')"

# 2. Archive old data (if needed)
# Export to R2 or external storage first

# 3. Delete old records
wrangler d1 execute blaze-db --command \
  "DELETE FROM games WHERE date < date('now', '-90 days')"

# 4. Vacuum database
wrangler d1 execute blaze-db --command "VACUUM"

# 5. Verify size reduction
# Check database metrics
```

---

## Incident Response

### Observability-Guided Triage
1. **Check dashboards first** – call `GET /api/observability/dashboard` or open Cloudflare Analytics for `worker.request.duration` and `error_budget.breach` to see which route or worker is burning the budget.
2. **Correlate alerts** – review Cloudflare Logpush or GitHub notifications for:
   - `alert.data-freshness` (stale live game feed >90s)
   - `alert.auth-failures` (401/403 rate from API wrappers)
   - `alert.upstream-errors` (>=10% failures from providers)
3. **Trace by ID** – copy the `x-trace-id` header from the failing API response and search worker logs (`wrangler tail`) and Next.js server logs for matching entries.
4. **Stabilize with cache** – if upstream is failing, enable KV cache for the affected route and verify cache hit rate via `/api/observability/dashboard` > `cache.hitRate`.
5. **Escalate** – if data freshness remains >90s for 10+ minutes, fail over to static scoreboard JSON in R2 and notify #ops.

### Performance Tuning with Instrumentation
1. Hit `/api/observability/dashboard` and record current p50/p95, cache hit rate, and error budget breaches.
2. Use `reportWebVitals` output (via Analytics Engine) to isolate INP/LCP regressions; compare against CI Lighthouse report stored as `lighthouse-report.json` in workflow artifacts.
3. Add or adjust caching (Cloudflare KV/CDN) and re-run the `quality-audits` GitHub Action to ensure budgets stay above **Performance ≥0.9** / **Accessibility ≥0.95**.
4. For Workers, run `wrangler tail --format json | grep traceId` with the ID from `x-trace-id` to find slow spans and upstream errors.
5. Update alert thresholds in code (`withApiObservability` / Worker middleware) if SLOs change, and document the new targets in `OBSERVABILITY_DASHBOARDS.md`.

### Worker Down / Failing

**Severity:** HIGH
**Response Time:** Immediate

```bash
# 1. Check worker health
curl https://[worker-name].workers.dev/health

# 2. Check Cloudflare dashboard
# https://dash.cloudflare.com → Workers → [worker-name]
# Look for error rate, CPU time, request volume

# 3. Check recent deployments
wrangler deployments list [worker-name]

# 4. View error logs
wrangler tail [worker-name] --env production | grep -i error

# 5. Quick fix options:
#    Option A: Rollback to previous version
wrangler rollback [worker-name]

#    Option B: Apply hotfix
#    - Fix critical bug
#    - Deploy immediately
wrangler deploy --env production

# 6. Monitor recovery
wrangler tail [worker-name] --env production

# 7. Document incident
# Create incident report with:
# - Timeline
# - Root cause
# - Resolution
# - Prevention measures
```

### Database Connection Errors

**Severity:** HIGH
**Response Time:** Immediate

```bash
# 1. Check database status
wrangler d1 list

# 2. Test database connectivity
wrangler d1 execute blaze-db --command "SELECT 1"

# 3. Check worker logs for specific errors
wrangler tail [worker-name] | grep "D1"

# 4. Verify bindings in wrangler.toml
cat wrangler.toml | grep -A 5 d1_databases

# 5. If binding issue:
#    - Update binding configuration
#    - Redeploy worker
wrangler deploy

# 6. If database corruption:
#    - Restore from backup (see Database Restore)

# 7. Monitor affected workers
wrangler tail [worker-name]
```

### High Error Rate

**Severity:** MEDIUM-HIGH
**Response Time:** 15 minutes

```bash
# 1. Identify error pattern
wrangler tail [worker-name] --format json | \
  jq 'select(.outcome == "exception") | .logs'

# 2. Check error rate in dashboard
# Cloudflare Dashboard → Analytics

# 3. Common causes:
#    - External API failures
#    - Database query errors
#    - Rate limiting
#    - Invalid input data

# 4. Quick mitigation:
#    - Enable fallback responses
#    - Increase error handling
#    - Add circuit breaker

# 5. Deploy fix
wrangler deploy

# 6. Monitor improvement
# Watch error rate decrease
```

### Performance Degradation

**Severity:** MEDIUM
**Response Time:** 30 minutes

```bash
# 1. Check CPU time metrics
wrangler tail [worker-name] --format json | jq '.logs[] | select(.message | contains("duration"))'

# 2. Identify slow operations
# Add timing logs to worker code

# 3. Common bottlenecks:
#    - Slow database queries → Add indexes or use Hyperdrive
#    - External API calls → Add caching
#    - Large JSON parsing → Optimize data structure
#    - Missing KV cache → Implement caching

# 4. Test fixes in staging
wrangler deploy --env staging

# 5. Compare performance
# Before vs After metrics

# 6. Deploy to production
wrangler deploy --env production
```

---

## Performance Troubleshooting

### Slow API Responses

**Diagnosis Steps:**

1. **Check Worker Logs**
   ```bash
   wrangler tail [worker-name] --format json | \
     jq 'select(.logs[] | contains("duration"))'
   ```

2. **Identify Slow Database Queries**
   ```typescript
   // Add to worker code
   console.time('db-query');
   const result = await env.DB.prepare(sql).all();
   console.timeEnd('db-query');
   ```

3. **Profile External API Calls**
   ```typescript
   const start = Date.now();
   const response = await fetch(externalAPI);
   console.log(`External API took ${Date.now() - start}ms`);
   ```

4. **Solutions:**
   - Add KV caching for repeated data
   - Use Hyperdrive for database connections
   - Implement CDN caching for static responses
   - Add response compression

### High Memory Usage

**Diagnosis Steps:**

1. **Check Worker Memory**
   - Cloudflare Dashboard → Worker → Analytics → Memory Usage

2. **Identify Large Objects**
   ```typescript
   // Add memory profiling
   const obj = { /* large data */ };
   console.log(`Object size: ${JSON.stringify(obj).length} bytes`);
   ```

3. **Solutions:**
   - Stream large responses instead of buffering
   - Limit result set sizes
   - Use pagination for large datasets
   - Clear references to unused objects

### Database Query Optimization

```sql
-- 1. Analyze query plan
EXPLAIN QUERY PLAN
SELECT * FROM games WHERE date = '2025-11-08' AND status = 'live';

-- 2. Add missing indexes
CREATE INDEX idx_games_date_status ON games(date, status);

-- 3. Optimize query
-- Before (slow)
SELECT * FROM games WHERE date >= '2025-01-01';

-- After (fast)
SELECT * FROM games
WHERE date >= '2025-01-01'
LIMIT 100;
```

---

## Backup & Recovery

### Automated Backup Schedule

**Databases:** Daily at 02:00 UTC
**KV Namespaces:** Weekly exports
**R2 Buckets:** Versioning enabled

### Manual Backup Procedure

```bash
# Database backup
wrangler d1 backup create blaze-db --name "manual-$(date +%Y%m%d)"

# KV namespace export
wrangler kv:key list --namespace-id [id] --prefix "" > kv-backup-$(date +%Y%m%d).json

# R2 bucket backup
# Versioning handles this automatically
wrangler r2 object list blazesports-media-production > r2-inventory-$(date +%Y%m%d).txt
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 2 hours
**RPO (Recovery Point Objective):** 24 hours

1. **Database Failure:**
   - Restore from latest backup (automated daily)
   - Maximum data loss: 24 hours

2. **Worker Failure:**
   - Redeploy from git repository
   - Recovery time: 10 minutes

3. **Complete Infrastructure Loss:**
   - Restore from Infrastructure-as-Code (Terraform/Wrangler)
   - Restore databases from backups
   - Redeploy all workers
   - Recovery time: 2 hours

---

## Monitoring & Alerting

### Daily Health Check

```bash
#!/bin/bash
# daily-health-check.sh

echo "=== BlazeSportsIntel Health Check ==="
echo "Date: $(date)"

# Check critical workers
WORKERS=(
  "blaze-gateway-production"
  "blaze-auth-production"
  "blaze-storage"
  "blaze-analytics-production"
)

for worker in "${WORKERS[@]}"; do
  echo -n "Checking $worker... "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$worker.workers.dev/health")
  if [ "$STATUS" -eq 200 ]; then
    echo "✓ OK"
  else
    echo "✗ FAILED (HTTP $STATUS)"
  fi
done

# Check database sizes
echo "=== Database Sizes ==="
curl -s https://blaze-db-monitor-production.workers.dev/metrics | \
  jq '.[] | "\(.databaseName): \(.sizeMB)MB"'

# Check recent alerts
echo "=== Recent Alerts ==="
curl -s https://blaze-monitoring-production.workers.dev/alerts/recent
```

### Alert Response Procedures

**Severity Levels:**

| Severity | Response Time | Escalation |
|----------|--------------|------------|
| INFO | No action | None |
| WARNING | 1 hour | Team notification |
| ERROR | 30 minutes | On-call engineer |
| CRITICAL | Immediate | All hands |

**Alert Types:**

1. **Database Size Warning:**
   - Review growth trends
   - Plan cleanup or archival
   - Update capacity plan

2. **High Error Rate:**
   - Follow Incident Response runbook
   - Investigate root cause
   - Deploy fix or rollback

3. **Worker Performance:**
   - Profile slow operations
   - Implement optimizations
   - Test and deploy

---

## Security Procedures

### Rotate API Keys

**Frequency:** Quarterly
**Duration:** 30 minutes

```bash
# 1. Generate new API key
wrangler secret put NEW_API_KEY --env production

# 2. Update dependent services
# Notify integrations of key change

# 3. Monitor for errors
wrangler tail [worker-name] | grep "auth"

# 4. Retire old key after 7 days
wrangler secret delete OLD_API_KEY --env production
```

### Security Audit

**Frequency:** Monthly
**Checklist:**

- [ ] Review worker authentication
- [ ] Check CORS configurations
- [ ] Verify rate limiting
- [ ] Audit database permissions
- [ ] Review access logs
- [ ] Check for exposed secrets
- [ ] Update dependencies
- [ ] Scan for vulnerabilities

### Incident Response (Security)

1. **Identify incident**
   - Unauthorized access attempt
   - Data breach
   - DDoS attack

2. **Contain**
   - Block malicious IPs
   - Rotate compromised credentials
   - Enable additional rate limiting

3. **Investigate**
   - Review access logs
   - Identify scope of breach
   - Determine attack vector

4. **Remediate**
   - Fix vulnerabilities
   - Update security controls
   - Deploy patches

5. **Document**
   - Create incident report
   - Update security procedures
   - Train team

---

## Scaling Operations

### Horizontal Scaling

**Workers:** Automatically scale
**Databases:** Plan for sharding at 200MB

### Add Database Replica

```bash
# 1. Create replica database
wrangler d1 create blaze-db-replica

# 2. Restore from primary backup
wrangler d1 backup create blaze-db --name "replica-source"
wrangler d1 backup restore blaze-db-replica --backup-id [id]

# 3. Update worker bindings for read replicas
# Add to wrangler.toml:
[[d1_databases]]
binding = "DB_READ"
database_name = "blaze-db-replica"

# 4. Update worker code for read/write split
# Use DB for writes, DB_READ for reads
```

### KV Namespace Optimization

```bash
# 1. Monitor KV usage
wrangler kv:key list --namespace-id [id] | wc -l

# 2. Set appropriate TTLs
# Short-lived data: 300-3600 seconds
# Long-lived data: 86400+ seconds

# 3. Implement cache warming for hot data
# Pre-populate KV with frequently accessed data
```

---

## Common Tasks Quick Reference

### Deploy Worker
```bash
wrangler deploy --env production
```

### Check Worker Logs
```bash
wrangler tail [worker-name] --env production
```

### Rollback Worker
```bash
wrangler rollback [worker-name]
```

### Backup Database
```bash
wrangler d1 backup create blaze-db --name "backup-$(date +%Y%m%d)"
```

### Execute SQL
```bash
wrangler d1 execute blaze-db --command "SELECT * FROM games LIMIT 5"
```

### Check Worker Health
```bash
curl https://[worker-name].workers.dev/health
```

### View Database Metrics
```bash
curl https://blaze-db-monitor-production.workers.dev/metrics
```

---

## Emergency Contacts

**On-Call Engineer:** [Phone/Slack]
**Infrastructure Lead:** [Phone/Slack]
**Database Admin:** [Phone/Slack]
**Security Team:** [Phone/Slack]

**Escalation Path:**
1. On-Call Engineer (0-15 min)
2. Infrastructure Lead (15-30 min)
3. CTO (30+ min)

---

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [Infrastructure Diagram](./INFRASTRUCTURE.md)
- [Deployment Guide](../DEPLOYMENT.md)

---

**Last Updated:** November 8, 2025
**Maintained By:** Infrastructure Team
**Review Schedule:** Monthly
