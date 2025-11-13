# Contributing to BSI-NextGen

Thank you for your interest in contributing to BSI-NextGen! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git** for version control

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/BSI-NextGen.git
   cd BSI-NextGen
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ahump20/BSI-NextGen.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

6. **Build all packages**:
   ```bash
   pnpm build
   ```

7. **Start development server**:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Creating a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in the appropriate package(s)
2. Write or update tests as needed
3. Ensure code follows our standards (see below)
4. Test your changes locally

### Package Structure

```
packages/
├── shared/          # Shared types and utilities
├── api/             # Sports data adapters
└── web/             # Next.js web application
```

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` or proper types

### Linting & Formatting

Run before committing:

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm type-check
```

### Code Style

- **Naming Conventions**:
  - Components: `PascalCase` (e.g., `GameCard.tsx`)
  - Functions/variables: `camelCase` (e.g., `fetchGames`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
  - Files: `kebab-case` or `PascalCase` for components

- **Imports**:
  - Group imports: external → internal → relative
  - Use absolute imports where configured (`@bsi/shared`, `@/components`)

- **Comments**:
  - Use JSDoc for public APIs
  - Explain "why" not "what"
  - Keep comments up-to-date

### Logging

Use the centralized logger instead of `console.log`:

```typescript
import { createLogger } from '@bsi/shared';

const logger = createLogger('ComponentName');

// Use appropriate log levels
logger.debug('Detailed debug info');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Error Handling

```typescript
// Good
try {
  const data = await fetchData();
  return data;
} catch (error) {
  logger.error('Failed to fetch data:', error);
  throw new Error('Failed to fetch data');
}

// Avoid
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.log(error); // Don't use console.log
  // Don't swallow errors without handling
}
```

## Testing Guidelines

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run tests in headed mode (visible browser)
pnpm test:headed

# Debug tests
pnpm test:debug

# View test report
pnpm test:report
```

### Writing Tests

We use Playwright for E2E tests. Tests should:

- Be independent and isolated
- Test user-facing behavior, not implementation
- Use descriptive test names
- Include mobile viewport testing

Example:

```typescript
import { test, expect } from '@playwright/test';

test.describe('MLB Games Page', () => {
  test('should display games list', async ({ page }) => {
    await page.goto('/sports/mlb');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="games-list"]');
    
    // Verify games are displayed
    const games = page.locator('[data-testid="game-card"]');
    await expect(games).toHaveCount(await games.count());
  });
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/sports/mlb');
    
    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `ci`: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(api): add NHL adapter for game data"

# Bug fix
git commit -m "fix(web): resolve mobile overflow on standings page"

# Documentation
git commit -m "docs: update API endpoint documentation"

# Multiple changes
git commit -m "feat(shared): add logger utility

- Create centralized logging system
- Replace console.log across all packages
- Add environment-aware log levels"
```

## Pull Request Process

### Before Submitting

1. ✅ Code follows style guidelines
2. ✅ All tests pass (`pnpm test`)
3. ✅ Linting passes (`pnpm lint`)
4. ✅ Code is formatted (`pnpm format`)
5. ✅ Type checking passes (`pnpm type-check`)
6. ✅ Build succeeds (`pnpm build`)
7. ✅ Documentation is updated (if needed)

### Submitting a PR

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out the PR template**:
   - Describe your changes
   - Link related issues
   - Include screenshots for UI changes
   - List breaking changes (if any)

4. **Request review** from maintainers

### PR Review Process

- Maintainers will review your PR
- Address feedback and push updates
- Once approved, a maintainer will merge

### After Merge

1. **Sync your fork**:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

2. **Delete your feature branch**:
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

## Common Tasks

### Adding a New Sports Adapter

1. Create adapter in `packages/api/src/adapters/`
2. Implement required interface methods
3. Add tests for the adapter
4. Export from `packages/api/src/index.ts`
5. Update documentation

### Adding a New Page

1. Create page in `packages/web/app/`
2. Create API route if needed in `packages/web/app/api/`
3. Add navigation links
4. Add Playwright tests
5. Test mobile responsiveness

### Updating Shared Types

1. Update types in `packages/shared/src/types/`
2. Rebuild shared package: `pnpm --filter @bsi/shared build`
3. Update consuming packages as needed
4. Update documentation

## Getting Help

- 📖 Read the [README.md](./README.md)
- 📚 Check [documentation](./docs/)
- 💬 Ask in GitHub Discussions
- 🐛 Report bugs via GitHub Issues

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Thank you for contributing to BSI-NextGen!** 🎉

Your contributions help make this the best sports intelligence platform for everyone.
