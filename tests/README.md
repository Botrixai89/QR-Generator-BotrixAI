# Testing Guide

This directory contains the testing infrastructure for the QR Generator application.

## Test Structure

```
tests/
├── unit/              # Unit tests (Vitest)
│   ├── entitlements.test.ts
│   ├── utils.test.ts
│   ├── url-shortener.test.ts
│   ├── validation.test.ts
│   └── api-routes.test.ts
├── e2e/               # End-to-end tests (Playwright)
│   └── auth-flow.spec.ts
├── smoke/             # Smoke tests (Playwright)
│   ├── webhooks.spec.ts
│   └── domain-verification.spec.ts
├── utils/             # Test utilities
│   ├── test-helpers.ts
│   └── mock-supabase.ts
├── setup.ts           # Test setup and mocks
└── README.md          # This file
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/auth-flow.spec.ts
```

### Smoke Tests

```bash
# Run smoke tests
npm run test:smoke
```

### All Tests

```bash
# Run typecheck, lint, and all tests
npm run test:all
```

## Writing Tests

### Unit Tests

Unit tests are written using Vitest and should be placed in `tests/unit/`. They test individual functions, utilities, and modules in isolation.

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { getEntitlements } from '@/lib/entitlements'

describe('getEntitlements', () => {
  it('should return FREE plan for null', () => {
    expect(getEntitlements(null)).toEqual(PLAN_MATRIX.FREE)
  })
})
```

### E2E Tests

E2E tests are written using Playwright and should be placed in `tests/e2e/`. They test the full user journey through the application.

Example:
```typescript
import { test, expect } from '@playwright/test'

test('should sign up and create QR code', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Sign Up')
  // ... test steps
})
```

### Smoke Tests

Smoke tests are quick validation tests that verify critical paths are accessible. They should be fast and reliable.

## Test Utilities

### Mock Helpers

- `createMockUser()` - Creates mock user data
- `createMockQrCode()` - Creates mock QR code data
- `createMockScan()` - Creates mock scan data

### Mock Supabase

The `MockSupabase` class provides a mock implementation of Supabase client for testing without a real database.

## Environment Variables for Testing

Create a `.env.test` file with:

```env
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
NEXTAUTH_SECRET=test-secret
NEXTAUTH_URL=http://localhost:3000
E2E_BASE_URL=http://localhost:3000
```

## CI/CD

Tests run automatically on:
- Pull requests
- Pushes to `main` and `develop` branches

The CI pipeline includes:
1. Lint checks
2. Type checking
3. Unit tests
4. Smoke tests
5. E2E tests
6. Migration safety checks
7. Build verification
8. Preview deployments (for PRs)

## Coverage

Coverage reports are generated with Vitest and can be viewed in the `coverage/` directory after running `npm run test:coverage`.

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Use mocks for external dependencies (database, APIs, etc.)
3. **Clear Names**: Use descriptive test names that explain what is being tested
4. **Fast Tests**: Keep unit tests fast; E2E tests can be slower
5. **Cleanup**: Always clean up test data and mocks after tests

## Debugging Tests

### Vitest (Unit Tests)

```bash
# Run with debugging
npm run test -- --inspect-brk

# Run specific test file
npm run test tests/unit/entitlements.test.ts
```

### Playwright (E2E Tests)

```bash
# Run with debug mode
npx playwright test --debug

# Run with headed browser
npx playwright test --headed

# Show Playwright inspector
npx playwright test --ui
```

## Troubleshooting

### Tests failing with database errors

Make sure you're using mocked Supabase client in tests. Check that `tests/setup.ts` is properly configuring mocks.

### E2E tests timing out

- Check that the dev server is running on `http://localhost:3000`
- Increase timeout in `playwright.config.ts` if needed
- Check network requests in Playwright trace viewer

### Mock gateways not working

Ensure `USE_MOCK_GATEWAYS=true` is set in your environment or that you're in development mode.

