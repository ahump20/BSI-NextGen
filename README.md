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