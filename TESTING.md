# Testing Guide - BSI-NextGen

This document defines testing standards, best practices, and procedures for the BSI-NextGen codebase.

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Test Requirements](#test-requirements)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Test Organization](#test-organization)
7. [Coverage Requirements](#coverage-requirements)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

---

## Overview

BSI-NextGen uses a comprehensive testing strategy to ensure code quality, prevent regressions, and maintain reliability in production.

### Testing Stack

- **Unit Tests:** Jest (TypeScript)
- **Component Tests:** React Testing Library + Jest
- **E2E Tests:** Playwright
- **Python Tests:** pytest (for mmi-baseball package)

### Current Coverage Status

| Package | Coverage | Status |
|---------|----------|--------|
| @bsi/shared | ~85% | ✅ Good |
| @bsi/api | ~50%+ | 🟡 Improving |
| @bsi/web | ~30%+ | 🟡 Improving |
| mmi-baseball | ~70% | ✅ Good |

**Goal:** Achieve and maintain 70%+ coverage across all packages.

---

## Testing Pyramid

Follow the testing pyramid for balanced, efficient test coverage:

```
        /\
       /  \
      / E2E \ (10%)
     /------\
    /        \
   /Integration\ (20%)
  /------------\
 /              \
/   Unit Tests   \ (70%)
------------------
```

### Distribution Guidelines

- **70% Unit Tests:** Fast, isolated tests for functions, classes, and utilities
- **20% Integration Tests:** Tests for API routes, service interactions, adapters
- **10% E2E Tests:** Full user flow tests with Playwright

---

## Test Requirements

### ✅ Required Tests (Must Have)

All new code must include tests for:

1. **New API Adapters:** 80%+ coverage mandatory
2. **New API Routes:** Integration tests required
3. **New React Components:** Unit tests required
4. **Auth/Security Code:** Comprehensive security tests
5. **Utility Functions:** Edge cases and error handling

### 🟡 Recommended Tests (Should Have)

- Service layer tests
- Cache logic tests
- Observability helpers
- Complex business logic

### ⚪ Optional Tests (Nice to Have)

- Cloudflare Workers (until production-ready)
- Analytics engines (non-critical)
- Experimental features

---

## Running Tests

### Quick Commands

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui

# Run all tests (unit + E2E)
pnpm test:all
```

### Package-Specific Tests

```bash
# Test specific package
pnpm --filter @bsi/api test
pnpm --filter @bsi/web test
pnpm --filter @bsi/shared test

# Test with coverage for specific package
pnpm --filter @bsi/api test:coverage
```

### E2E Tests

```bash
# Install browsers (first time only)
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/mobile-visual-regression.spec.ts

# Debug mode
npx playwright test --debug

# UI mode (interactive)
npx playwright test --ui

# Show report
npx playwright show-report
```

---

## Writing Tests

### Unit Test Template

```typescript
/**
 * Tests for [Component/Function Name]
 * [Brief description of what's being tested]
 */

import { functionToTest } from '../module';

// Mock dependencies
jest.mock('@bsi/shared', () => ({
  ...jest.requireActual('@bsi/shared'),
  externalDependency: jest.fn(),
}));

describe('functionToTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should perform expected behavior', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input', () => {
      expect(() => functionToTest(null)).toThrow('Expected error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = functionToTest('');
      expect(result).toBe('default');
    });
  });
});
```

### Component Test Template

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render with required props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const onClickMock = jest.fn();
    render(<MyComponent onClick={onClickMock} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should handle error states', () => {
    render(<MyComponent error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

### API Route Integration Test Template

```typescript
import { GET } from '../route';
import { NextRequest } from 'next/server';

global.fetch = jest.fn();

describe('/api/endpoint', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  });

  it('should return data successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response);

    const request = new NextRequest('http://localhost:3000/api/endpoint');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ data: 'test' });
  });

  it('should handle errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/endpoint');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
```

---

## Test Organization

### Directory Structure

```
packages/
├── api/
│   └── src/
│       ├── adapters/
│       │   ├── __tests__/
│       │   │   ├── mlb.test.ts
│       │   │   ├── nfl.test.ts
│       │   │   └── nba.test.ts
│       │   ├── mlb.ts
│       │   └── nfl.ts
│       └── auth/
│           ├── __tests__/
│           │   ├── auth0.test.ts
│           │   └── jwt.test.ts
│           └── auth0.ts
├── web/
│   ├── app/
│   │   ├── api/
│   │   │   └── health/
│   │   │       ├── __tests__/
│   │   │       │   └── route.test.ts
│   │   │       └── route.ts
│   │   └── components/
│   │       ├── __tests__/
│   │       │   └── GameCard.test.tsx
│   │       └── GameCard.tsx
│   └── src/
│       └── components/
│           ├── __tests__/
│           │   └── Avatar.test.tsx
│           └── Avatar.tsx
└── shared/
    └── src/
        └── utils/
            ├── __tests__/
            │   └── utils.test.ts
            └── index.ts
```

### File Naming Conventions

- Unit tests: `[module-name].test.ts` or `[module-name].spec.ts`
- Component tests: `[ComponentName].test.tsx`
- E2E tests: `[feature-name].spec.ts`
- Place tests in `__tests__` directory next to source files

---

## Coverage Requirements

### Minimum Coverage Thresholds

Set in `jest.config.js`:

```javascript
coverageThresholds: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### Coverage Goals by Module Type

| Module Type | Target Coverage |
|-------------|-----------------|
| Adapters | 80%+ |
| API Routes | 70%+ |
| Auth/Security | 90%+ |
| Utilities | 85%+ |
| Components | 70%+ |
| Services | 75%+ |

### Checking Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open packages/api/coverage/lcov-report/index.html
open packages/web/coverage/lcov-report/index.html
```

### Coverage Reports

Coverage reports are:
- Generated locally in `coverage/` directories
- Uploaded to Codecov in CI (optional)
- Displayed in PR comments (when configured)

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- ✅ Push to `main` branch
- ✅ Push to `claude/**` branches
- ✅ Pull requests to `main`

### CI Pipeline Stages

```yaml
1. Lint and Format Check
2. Unit Tests (parallel)
   ├── @bsi/api tests
   └── @bsi/web tests
3. Build Project
4. E2E Tests (Playwright)
5. Deploy (if all pass)
```

### Test Execution in CI

```yaml
- name: Run unit tests
  run: pnpm test

- name: Run E2E tests
  run: npx playwright test
```

### Failure Policy

- ❌ **Tests fail:** Pipeline stops, no deployment
- ⚠️ **Coverage below threshold:** Warning logged
- ✅ **All pass:** Proceed to deployment

---

## Best Practices

### General Testing Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Avoid testing private methods directly

2. **Arrange-Act-Assert (AAA) Pattern**
   ```typescript
   it('should calculate total', () => {
     // Arrange
     const items = [1, 2, 3];

     // Act
     const result = calculateTotal(items);

     // Assert
     expect(result).toBe(6);
   });
   ```

3. **One Assertion Per Test (When Possible)**
   - Makes failures easier to diagnose
   - Improves test readability

4. **Clear Test Names**
   ```typescript
   // ✅ Good
   it('should return 401 when user is not authenticated', () => {});

   // ❌ Bad
   it('test auth', () => {});
   ```

5. **Mock External Dependencies**
   - Don't make real API calls in unit tests
   - Mock database connections
   - Mock third-party services

6. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

7. **Test Error Paths**
   ```typescript
   it('should handle API errors gracefully', async () => {
     mockFetch.mockRejectedValue(new Error('Network error'));
     await expect(fetchData()).rejects.toThrow('Network error');
   });
   ```

---

## Common Patterns

### Mocking Fetch

```typescript
global.fetch = jest.fn();

beforeEach(() => {
  mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
});

mockFetch.mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
} as Response);
```

### Mocking Shared Utilities

```typescript
jest.mock('@bsi/shared', () => ({
  ...jest.requireActual('@bsi/shared'),
  validateApiKey: jest.fn((key) => key || 'mock-key'),
  retryWithBackoff: jest.fn((fn) => fn()),
  getChicagoTimestamp: jest.fn(() => '2025-01-13T12:00:00-06:00'),
}));
```

### Testing Async Functions

```typescript
it('should fetch data successfully', async () => {
  const data = await adapter.getData();
  expect(data).toBeDefined();
});
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';

it('should render component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Testing User Interactions

```typescript
import { fireEvent } from '@testing-library/react';

it('should handle click', () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick} />);

  fireEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalled();
});
```

### Testing API Routes (Next.js)

```typescript
import { NextRequest } from 'next/server';

it('should handle GET request', async () => {
  const request = new NextRequest('http://localhost:3000/api/test');
  const response = await GET(request);

  expect(response.status).toBe(200);
});
```

### Testing Error States

```typescript
it('should log errors to console', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  functionThatLogsError();

  expect(consoleSpy).toHaveBeenCalled();
  consoleSpy.mockRestore();
});
```

---

## Examples from Codebase

### Example 1: Adapter Test

See: `packages/api/src/adapters/__tests__/mlb.test.ts`

- ✅ Mocks external dependencies
- ✅ Tests happy path and error cases
- ✅ Validates API call parameters
- ✅ Checks response transformation
- ✅ ~95% coverage

### Example 2: Component Test

See: `packages/web/app/components/__tests__/GameCard.test.tsx`

- ✅ Tests all game states (scheduled, live, final)
- ✅ Tests conditional rendering
- ✅ Tests edge cases (missing data)
- ✅ Tests accessibility
- ✅ Clear test organization

### Example 3: API Route Test

See: `packages/web/app/api/health/__tests__/route.test.ts`

- ✅ Tests all response codes (200, 503)
- ✅ Tests external API checks
- ✅ Tests environment configuration
- ✅ Tests error handling
- ✅ Validates response structure

### Example 4: Security Test

See: `packages/api/src/auth/__tests__/auth0.test.ts`

- ✅ Tests OAuth flow
- ✅ Tests token exchange
- ✅ Tests security headers
- ✅ Tests error scenarios
- ✅ Validates sensitive data handling

---

## Troubleshooting

### Common Issues

#### Tests Failing Locally But Passing in CI

```bash
# Clear Jest cache
jest --clearCache

# Reinstall dependencies
pnpm clean
pnpm install
```

#### Type Errors in Tests

```bash
# Rebuild shared package
pnpm --filter @bsi/shared build
```

#### Playwright Tests Timing Out

```bash
# Increase timeout in playwright.config.ts
timeout: 30000  // 30 seconds
```

#### Coverage Not Updating

```bash
# Delete coverage directory
rm -rf coverage/

# Re-run tests
pnpm test:coverage
```

---

## Pre-Commit Checklist

Before committing code:

- [ ] All tests pass locally (`pnpm test`)
- [ ] New code has tests
- [ ] Coverage meets threshold (70%+)
- [ ] Tests follow naming conventions
- [ ] No `console.log` in tests (unless mocked)
- [ ] Mocks are properly cleaned up
- [ ] Tests are deterministic (no random data)

---

## Resources

- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **React Testing Library:** https://testing-library.com/react
- **Playwright Documentation:** https://playwright.dev/
- **Testing Best Practices:** https://testingjavascript.com/

---

## Questions?

For questions about testing:
1. Check this document first
2. Look at existing test examples in the codebase
3. Ask the team in #testing channel
4. Open an issue on GitHub

---

**Last Updated:** January 13, 2025
**Maintained By:** Development Team
