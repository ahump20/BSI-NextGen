# BlazeSportsIntel Cloud Architecture Overview

This document summarizes the current deployment stack for **BlazeSportsIntel.com**,
including the Cloudflare worker topology, data persistence layers, and delivery
pipeline integrations that support the production site hosted at
`https://blazesportsintel.com`.

## Frontend Delivery
- **Netlify** serves the primary frontend (`blazesportsintel.com`), with the
  `blazesportsintel.netlify.app` domain acting as the underlying deployment
  endpoint.

## Cloudflare Worker Layers
Cloudflare provides ten specialized worker groupings (72 workers total) that
handle routing, authentication, data processing, and auxiliary workloads:

1. **Gateway Layer** – `blaze-gateway-production`, `blaze-api-gateway`,
   `blaze-intelligence-unified-production`.
2. **Authentication** – `blaze-auth-api`, `blaze-auth-production`,
   `blaze-connector-api`.
3. **Data Ingestion & Processing** – `blazesports-ingest`, `blaze-data-pipeline`,
   `blaze-storage`, `blaze-sports-data`, `bsi-baseball-rankings`.
4. **Real-time Systems** – `blazesports-live`, `blaze-realtime`,
   `blazesports-game-monitor`, `blaze-websocket-production`.
5. **Analytics & Reporting** – `blaze-analytics-production`,
   `blaze-realtime-analytics-production`, `blaze-automated-reports-production`,
   `blaze-executive-dashboard-production`, `blaze-report-worker`.
6. **AI & Vision** – `blaze-vision-ai-production`, `blaze-vision-ai-gateway`,
   `bsi-embedding-generator`.
7. **Monitoring & Health** – `blaze-health-monitor-production`,
   `blaze-uptime-monitor-production`, `blaze-monitoring-production`,
   `blaze-performance-production`.
8. **Support Services** – `blazesports-alert`, `blaze-notifications-production`,
   `blaze-search-production`, `blaze-security-production`,
   `blaze-ratelimit-production`, `blaze-logging-production`,
   `blaze-backup-production`.
9. **Business Operations** – `blaze-billing`, `blaze-onboarding`,
   `blaze-lead-capture`, `blaze-contact-api`, `blaze-stripe-api`.
10. **Infrastructure Gaps** – Cloudflare R2 storage is currently disabled,
    indicating a potential improvement area for media and large asset delivery.

## Data Persistence
- **D1 Databases (18 total)**: include `blazesports-db` (1.15 MB),
  `blazesports-historical` (1.02 MB), `blazesports-models` (290 KB),
  `college-sports-data` (69 KB), `blaze-intelligence-db` (540 KB),
  `blaze-db` (primary, 81.5 MB), `blaze-analytics` (122 KB),
  `blaze-vision-analytics` (81 KB), and additional domain-specific stores.
- **KV Stores (20+)**: e.g., `ANALYTICS_KV`, `BLAZE_KV`, `blaze-mcp-cache`,
  `SESSIONS`, `VISION_CACHE`, `SCHEDULES`, `REPORTS`, `BACKUP_KV`,
  `production-PERFORMANCE_KV`.

## Operational Notes
- Real-time and analytics workers push processed data into the D1 primary
  (`blaze-db`) and auxiliary databases for historical and model-driven insights.
- KV caches ensure sub-200 ms read performance for high-traffic endpoints.
- The baseball rankings worker is deployed and writes to `blazesports-models`.
- No Hyperdrive connection pooling is configured; workers currently access D1
  databases directly.

## Recommended Next Steps
1. **Enable Cloudflare R2** for media and large file storage to offload assets
   from the worker runtime and Netlify origin.
2. **Evaluate Hyperdrive** for pooled D1 connectivity to improve scalability for
   concurrent read/write loads.
3. **Document failover paths** across Netlify and Cloudflare to ensure rapid
   recovery in the event of regional service degradation.

