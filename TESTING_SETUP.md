# Testing, QA, and CI/CD Setup

This document outlines the complete testing, QA, and CI/CD setup for the QR Generator application.

## ✅ Completed Implementation

### 1. Testing Infrastructure

#### Unit Tests (Vitest)
- **Framework**: Vitest
- **Location**: `tests/unit/`
- **Coverage**: Configurable with v8 provider
- **Tests Created**:
  - ✅ Entitlement checks (`entitlements.test.ts`)
  - ✅ Utility functions (`utils.test.ts`)
  - ✅ URL shortener (`url-shortener.test.ts`)
  - ✅ Validation (`validation.test.ts`)
  - ✅ API routes (`api-routes.test.ts`)

#### E2E Tests (Playwright)
- **Framework**: Playwright
- **Location**: `tests/e2e/`
- **Browsers**: Chromium, Firefox, WebKit
- **Tests Created**:
  - ✅ Sign-up → purchase → usage → downgrade flow (`auth-flow.spec.ts`)

#### Smoke Tests (Playwright)
- **Location**: `tests/smoke/`
- **Tests Created**:
  - ✅ Webhook flows (`webhooks.spec.ts`)
  - ✅ Domain verification flows (`domain-verification.spec.ts`)

### 2. Test Utilities

- **Test Helpers**: `tests/utils/test-helpers.ts`
  - Mock user, QR code, and scan data generators
  - Utility functions for test setup

- **Mock Supabase**: `tests/utils/mock-supabase.ts`
  - Mock Supabase client implementation
  - Simulates database queries without real database

- **Test Setup**: `tests/setup.ts`
  - Global test configuration
  - Mock Next.js modules
  - Environment variable setup

### 3. CI/CD Pipeline

**Location**: `.github/workflows/ci.yml`

#### Pipeline Stages:
1. **Lint** - ESLint checks
2. **Type Check** - TypeScript type checking
3. **Unit Tests** - Vitest unit tests with coverage
4. **E2E Tests** - Playwright end-to-end tests
5. **Smoke Tests** - Playwright smoke tests
6. **Migration Safety Check** - Validates SQL migrations
7. **Build** - Next.js production build
8. **Preview Deployment** - Automatic preview for PRs

#### Features:
- ✅ Parallel test execution
- ✅ Coverage reporting (Codecov)
- ✅ Test result artifacts
- ✅ Migration validation
- ✅ Preview deployments for PRs
- ✅ Automatic retries on CI

### 4. Development Tools

#### Seed Scripts
- **Production Seed**: `scripts/seed.ts`
  - Creates test users, QR codes, organizations, API keys
  - Configurable via options
  
- **Development Seed**: `scripts/seed-dev.ts`
  - Minimal seed data for local development

**Usage**:
```bash
# Seed with default data
npm run seed

# Seed minimal dev data
npm run seed:dev
```

#### Mock Gateways
- **Location**: `scripts/mock-gateways.ts`
- **API Endpoint**: `/api/mock-gateways` (development only)
- **Mock Services**:
  - ✅ Razorpay Gateway (payments, orders)
  - ✅ Email Gateway (sent emails tracking)
  - ✅ Webhook Gateway (webhook delivery tracking)

**Features**:
- Console logging in development
- View sent emails, webhooks, payments
- Clear mock data
- Automatic activation in development mode

## 📋 Test Coverage

### Unit Tests
- ✅ Entitlement checks (plan limits, features)
- ✅ Utility functions (class name merging, etc.)
- ✅ URL shortener
- ✅ Validation schemas
- ✅ API route handlers (basic)

### E2E Tests
- ✅ User sign-up flow
- ✅ User sign-in flow
- ✅ QR code creation
- ✅ Dashboard access
- ✅ Pricing page navigation
- ✅ Settings navigation
- ✅ Authorization checks

### Smoke Tests
- ✅ Webhook endpoints accessibility
- ✅ Webhook signature validation
- ✅ Razorpay webhook handling
- ✅ Domain verification endpoints
- ✅ Domain format validation
- ✅ DNS record verification

## 🚀 Running Tests

### All Tests
```bash
npm run test:all  # typecheck + lint + unit + e2e
```

### Unit Tests
```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # With Playwright UI
npx playwright test tests/e2e/auth-flow.spec.ts  # Specific test
```

### Smoke Tests
```bash
npm run test:smoke
```

### Individual Checks
```bash
npm run typecheck         # TypeScript check
npm run lint              # ESLint check
npm run build             # Production build
```

## 📊 Coverage

Coverage reports are generated in the `coverage/` directory:
- HTML report: `coverage/index.html`
- JSON report: `coverage/coverage-final.json`
- LCOV report: `coverage/lcov.info`

## 🔧 Configuration Files

- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `tests/setup.ts` - Global test setup
- `.github/workflows/ci.yml` - CI/CD pipeline

## 📝 Environment Variables

Create `.env.test` for testing:
```env
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
NEXTAUTH_SECRET=test-secret
NEXTAUTH_URL=http://localhost:3000
E2E_BASE_URL=http://localhost:3000
USE_MOCK_GATEWAYS=true
```

## 🎯 Migration Safety

The CI/CD pipeline includes migration safety checks:
- ✅ Validates migration file naming (YYYYMMDD_description.sql)
- ✅ Checks for SQL syntax patterns
- ✅ Ensures migrations directory exists
- ✅ Reports migration count

## 🐛 Mock Gateways Usage

In development, mock gateways are automatically used. View mock data:

```bash
# View sent emails
curl http://localhost:3000/api/mock-gateways?type=emails

# View webhooks
curl http://localhost:3000/api/mock-gateways?type=webhooks

# View payments
curl http://localhost:3000/api/mock-gateways?type=payments

# Clear emails
curl http://localhost:3000/api/mock-gateways?type=emails&action=clear
```

## 📚 Documentation

- `tests/README.md` - Comprehensive testing guide
- `TESTING_SETUP.md` - This file

## 🔄 CI/CD Workflow

1. **On Push/PR**:
   - Lint → TypeCheck → Unit Tests → Smoke Tests
   - E2E Tests (if unit tests pass)
   - Migration Check
   - Build
   - Preview Deployment (PR only)

2. **On Merge to Main**:
   - All checks above
   - Production deployment (if configured)

## ✨ Best Practices

1. **Test Isolation**: Each test is independent
2. **Mock External Services**: Use mock gateways in development
3. **Fast Unit Tests**: Keep unit tests fast (< 1s each)
4. **E2E Tests**: Test critical user journeys
5. **Smoke Tests**: Verify endpoints are accessible
6. **Coverage**: Aim for >80% coverage on critical paths
7. **CI/CD**: All tests must pass before merge

## 🚨 Troubleshooting

### Tests failing with database errors
- Ensure mocks are properly configured in `tests/setup.ts`
- Check that Supabase client is mocked

### E2E tests timing out
- Verify dev server is running on `http://localhost:3000`
- Check Playwright timeout settings
- Review network requests in trace viewer

### Mock gateways not working
- Set `USE_MOCK_GATEWAYS=true` in environment
- Ensure you're in development mode (`NODE_ENV=development`)

### CI/CD failures
- Check GitHub Actions logs
- Verify environment variables are set
- Ensure migration files follow naming convention

## 📈 Next Steps

Potential improvements:
- [ ] Add more E2E test scenarios
- [ ] Increase unit test coverage
- [ ] Add performance tests
- [ ] Add visual regression tests
- [ ] Add API contract tests
- [ ] Add load testing
- [ ] Add security testing

