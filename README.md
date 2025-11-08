# BSI-NextGen

A modern monorepo for the BSI-NextGen project.

## Getting Started

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format
```

## Documentation

### Quick Start
- [IMPLEMENTATION_SUMMARY.md](./docs/IMPLEMENTATION_SUMMARY.md) - **START HERE** - Overview of all implementation guides and roadmap

### Infrastructure & Architecture
- [INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) - Complete infrastructure mapping of BlazeSportsIntel.com
  - 72 Cloudflare Workers across 10 functional layers
  - 18 D1 databases (81.5MB primary)
  - 20+ KV stores for caching
  - Architecture diagrams and data flows

### Implementation Guides
- [R2_STORAGE_SETUP.md](./docs/R2_STORAGE_SETUP.md) - **HIGH PRIORITY** - Enable R2 storage for media/file assets
- [HYPERDRIVE_SETUP.md](./docs/HYPERDRIVE_SETUP.md) - **MEDIUM PRIORITY** - Configure database connection pooling
- [DATABASE_MONITORING.md](./docs/DATABASE_MONITORING.md) - Implement database growth monitoring and alerting

### Operations
- [OPERATIONAL_RUNBOOKS.md](./docs/OPERATIONAL_RUNBOOKS.md) - Standard operating procedures
  - Worker deployment procedures
  - Database operations and migrations
  - Incident response playbooks
  - Performance troubleshooting
  - Backup and recovery procedures
  - Security protocols

### Deployment
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Netlify/Vercel deployment procedures and troubleshooting

## Deployment

This project is configured for deployment on Netlify and Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting and best practices.

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Important:** Ensure variable names in `.env` match **exactly** what you set in Netlify/Vercel dashboard.

## Monorepo Structure

This is a pnpm monorepo. Individual packages are located in the `packages/` directory.

## Requirements

- Node.js >= 18.0.0
- pnpm >= 8.0.0