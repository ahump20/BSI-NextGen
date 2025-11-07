# BSI-NextGen

A modern monorepo project built with pnpm workspaces.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Run linter
pnpm run lint

# Format code
pnpm run format
```

## Deployment

For deployment instructions and troubleshooting guide for Netlify and Vercel, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Project Structure

```
BSI-NextGen/
├── packages/           # Monorepo packages
├── .env.example        # Environment variable template
├── netlify.toml        # Netlify deployment configuration
├── vercel.json         # Vercel deployment configuration
├── package.json        # Root package configuration
├── pnpm-workspace.yaml # pnpm workspace configuration
└── DEPLOYMENT.md       # Deployment guide
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add license information here]
