# Production Monitoring Setup

## Overview

Basic production monitoring for BSI-NextGen to ensure service health and rapid incident detection.

## Health Check Endpoint

**Endpoint**: `GET /api/health`

**Response Format**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T18:30:00.000Z",
  "timezone": "America/Chicago",
  "uptime_seconds": 12345,
  "response_time_ms": 45,
  "checks": {
    "database": "not_configured",
    "external_apis": "healthy",
    "environment": "healthy"
  },
  "version": "1.0.0"
}
```

**Status Codes**:
- `200`: All systems operational
- `503`: Service degraded or unavailable

## Monitoring Script

**Location**: `scripts/monitor-production.sh`

**Usage**:
```bash
# Basic check
./scripts/monitor-production.sh

# With email alerts
ALERT_EMAIL="alerts@blazesportsintel.com" ./scripts/monitor-production.sh

# With Slack webhook
SLACK_WEBHOOK_URL="https://hooks.slack.com/..." ./scripts/monitor-production.sh

# Custom production URL (for testing)
PRODUCTION_URL="https://staging.blazesportsintel.com" ./scripts/monitor-production.sh
```

**Monitored Endpoints**:
1. `/api/health` - Main health check
2. `/api/sports/mlb/mmi/health` - MMI service health (expects 503)
3. `/` - Homepage availability
4. `/sports/mlb` - Sample sports page

## Automated Monitoring Setup

### Option 1: Cron Job (Server)

Add to crontab for hourly checks:

```bash
# Edit crontab
crontab -e

# Add this line (runs every hour)
0 * * * * cd /path/to/BSI-NextGen && ./scripts/monitor-production.sh >> /var/log/bsi-monitor.log 2>&1
```

### Option 2: GitHub Actions (Free Tier)

Create `.github/workflows/monitor.yml`:

```yaml
name: Production Health Check

on:
  schedule:
    # Run every hour
    - cron: '0 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run health check
        env:
          ALERT_EMAIL: ${{ secrets.ALERT_EMAIL }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: ./scripts/monitor-production.sh

      - name: Notify on failure
        if: failure()
        run: echo "Health check failed! Check logs above."
```

### Option 3: Cloudflare Workers Cron (Recommended)

Create a Cloudflare Worker with cron trigger:

```typescript
// cloudflare-workers/monitor/src/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const endpoints = [
      '/api/health',
      '/api/sports/mlb/mmi/health',
      '/',
      '/sports/mlb'
    ];

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        const url = `https://blazesportsintel.com${endpoint}`;
        const start = Date.now();

        try {
          const response = await fetch(url, {
            signal: AbortSignal.timeout(10000)
          });

          return {
            endpoint,
            status: response.status,
            ok: response.ok,
            responseTime: Date.now() - start
          };
        } catch (error) {
          return {
            endpoint,
            error: error.message,
            ok: false
          };
        }
      })
    );

    // Check if any endpoints failed
    const failures = results.filter(r => !r.ok);

    if (failures.length > 0) {
      // Send alert (email, Slack, PagerDuty, etc.)
      await sendAlert(env, failures);
    }

    // Log results
    console.log('Health check results:', results);
  }
};
```

**wrangler.toml**:
```toml
name = "bsi-monitor"
main = "src/index.ts"

[triggers]
# Run every 15 minutes
crons = ["*/15 * * * *"]
```

## Alert Integrations

### Email Alerts

Requires `mail` command (install with `apt-get install mailutils` or `brew install mailutils`)

```bash
ALERT_EMAIL="alerts@blazesportsintel.com" ./scripts/monitor-production.sh
```

### Slack Alerts

1. Create a Slack Incoming Webhook: https://api.slack.com/messaging/webhooks
2. Use the webhook URL:

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL" ./scripts/monitor-production.sh
```

### PagerDuty Integration

For critical production alerts, integrate with PagerDuty:

```bash
# In Cloudflare Worker
async function sendAlert(env: Env, failures: any[]) {
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token token=${env.PAGERDUTY_TOKEN}`
    },
    body: JSON.stringify({
      routing_key: env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      payload: {
        summary: `BSI-NextGen Production Alert: ${failures.length} endpoints failing`,
        severity: 'error',
        source: 'blazesportsintel.com',
        custom_details: {
          failures
        }
      }
    })
  });
}
```

## Metrics to Track

### P0 - Critical
- [ ] Main health endpoint availability (`/api/health`)
- [ ] Homepage loads (`/`)
- [ ] API response times < 2 seconds

### P1 - Important
- [ ] Sports pages load (`/sports/*`)
- [ ] External API health (MLB Stats API)
- [ ] Error rates < 1%

### P2 - Nice to Have
- [ ] Average response time trends
- [ ] Geographic latency (Cloudflare Analytics)
- [ ] Cache hit rates

## Dashboards

### Cloudflare Analytics

Built-in monitoring available at:
- **URL**: https://dash.cloudflare.com/
- **Navigate**: Pages → blazesportsintel → Analytics

**Metrics Available**:
- Requests per second
- Data transfer
- Response status codes
- Geographic distribution
- Bandwidth saved by caching

### Future: Grafana Dashboard

For advanced monitoring, set up Grafana with Cloudflare Analytics API:

```yaml
# docker-compose.yml
version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - ./grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
```

## Incident Response

### When Alerts Fire

1. **Check Alert Details**: Review which endpoints are failing
2. **Verify Issue**: Manually test the failing endpoint in a browser
3. **Check Cloudflare Status**: https://www.cloudflarestatus.com/
4. **Review Recent Deployments**: Check if a recent deployment caused the issue
5. **Rollback if Necessary**: Revert to previous deployment if needed
6. **Document Incident**: Log issue, root cause, and resolution

### Escalation Path

- **P0 (Critical Outage)**: Immediate action required
  - Alert: PagerDuty + Slack
  - Response time: < 15 minutes

- **P1 (Degraded Service)**: Address within 1 hour
  - Alert: Slack + Email
  - Response time: < 1 hour

- **P2 (Minor Issue)**: Address next business day
  - Alert: Email only
  - Response time: < 24 hours

## Deployment Checklist

Before deploying monitoring:

- [ ] Health check endpoint deployed (`/api/health`)
- [ ] Monitoring script tested locally
- [ ] Alerts configured (email/Slack)
- [ ] Cron job or Worker scheduled
- [ ] Documentation reviewed
- [ ] Incident response plan understood

## Troubleshooting

### Health Check Returns 404

**Cause**: Endpoint not deployed
**Fix**: Rebuild and deploy with the new health endpoint

### Monitoring Script Fails with Connection Error

**Cause**: Network issues or service down
**Fix**: Check production URL and network connectivity

### False Positives

**Cause**: Overly aggressive timeout or incorrect expected status codes
**Fix**: Adjust timeout values in monitoring script or expected status codes

## Maintenance

### Monthly Tasks

- Review alert history and adjust thresholds
- Update monitoring script dependencies
- Test failover and recovery procedures

### Quarterly Tasks

- Review and update incident response plan
- Audit monitoring coverage (are we checking the right things?)
- Performance optimization based on trends

---

**Last Updated**: 2025-11-20
**Owner**: Austin Humphrey
**Contact**: ahump20@outlook.com
