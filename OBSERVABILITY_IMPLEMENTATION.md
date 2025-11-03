# Observability Implementation

This document outlines the complete observability implementation for the QR Generator application, including centralized logging, error tracking, performance monitoring, metrics collection, and admin system health dashboard.

## ✅ Implemented Features

### 1. Centralized Logging with Correlation IDs

**Location**: `src/lib/logging.ts`

**Features**:
- **Correlation IDs**: Every request gets a unique correlation ID for tracking across services
- **PII Masking**: Automatically masks sensitive data (emails, credit cards, phone numbers, names)
- **Structured Logging**: JSON-formatted logs with consistent structure
- **Context Preservation**: Maintains request context throughout the request lifecycle
- **Database Integration**: Critical logs (error/fatal) are stored in `SystemLog` table

**Usage**:
```typescript
import { createLoggerFromRequest } from '@/lib/logging'

const logger = createLoggerFromRequest(request, {
  userId: session.user.id,
  ipAddress: request.headers.get('x-forwarded-for'),
})

logger.info('Request processed', { qrCodeId: id })
logger.error('Failed to process request', error, { qrCodeId: id })
```

**Database Table**: `SystemLog`
- Stores error and fatal level logs
- Includes correlation IDs for tracing
- 90-day retention policy

### 2. Error Tracking (Sentry)

**Location**: 
- `sentry.client.config.ts` (client-side)
- `sentry.server.config.ts` (server-side)
- `sentry.edge.config.ts` (edge runtime)
- `src/instrumentation.ts` (Next.js instrumentation)

**Features**:
- **Automatic Error Capture**: Unhandled errors and promise rejections
- **PII Masking**: Filters sensitive data before sending to Sentry
- **Session Replay**: Records user sessions for debugging (configurable)
- **Performance Tracking**: Browser and server-side performance monitoring
- **Environment-aware**: Different configurations for development and production

**Configuration**:
- Set `NEXT_PUBLIC_SENTRY_DSN` for client-side
- Set `SENTRY_DSN` for server-side
- Traces sample rate: 10% in production, 100% in development
- Session replay: 10% in production, 100% in development

### 3. Performance Monitoring (Web Vitals)

**Location**: 
- `src/lib/web-vitals.ts` (tracking logic)
- `src/components/web-vitals.tsx` (React component)
- Integrated in `src/app/layout.tsx`

**Features**:
- **Core Web Vitals**: CLS, FID, LCP, FCP, TTFB, INP
- **Automatic Tracking**: Runs automatically on page load
- **Database Storage**: Metrics stored in `Metric` table
- **External Analytics**: Supports Google Analytics integration

**Metrics Tracked**:
- **CLS** (Cumulative Layout Shift): Visual stability
- **FID** (First Input Delay): Interactivity
- **LCP** (Largest Contentful Paint): Loading performance
- **FCP** (First Contentful Paint): Initial load
- **TTFB** (Time to First Byte): Server response time
- **INP** (Interaction to Next Paint): Responsiveness

### 4. Metrics Collection System

**Location**: `src/lib/metrics.ts`

**Features**:
- **Request Metrics**: Tracks API requests (rate, latency, error rate)
- **Business Metrics**: Payment conversion, churn rate, LTV
- **Database Storage**: All metrics stored in `Metric` and `RequestMetric` tables
- **Aggregation Support**: Built-in functions for time-based aggregation

**Metrics Tracked**:
- **Request Rate**: Requests per second (per endpoint)
- **Error Rate**: Error percentage (per endpoint)
- **Latency**: Average response time (per endpoint)
- **Payment Conversion**: Conversion rate from pricing page to payment
- **Churn Rate**: Subscription cancellation rate
- **LTV (Lifetime Value)**: Average lifetime value per user

**Database Tables**:
- `Metric`: General metrics with labels
- `RequestMetric`: Detailed request metrics with correlation IDs
- 90-day retention for logs, 30-day retention for metrics

### 5. API Route Wrapper

**Location**: `src/lib/api-wrapper.ts`

**Features**:
- **Automatic Logging**: Logs all API requests with correlation IDs
- **Metrics Tracking**: Records request metrics automatically
- **Error Handling**: Captures and logs errors with Sentry integration
- **Correlation ID Headers**: Adds correlation IDs to response headers

**Usage**:
```typescript
import { withObservability } from '@/lib/api-wrapper'

export const POST = withObservability(async (request, context, logger) => {
  logger.info('Processing request')
  // Your handler logic
  return NextResponse.json({ success: true })
})
```

### 6. Middleware Integration

**Location**: `src/middleware.ts`

**Features**:
- **Correlation ID Generation**: Creates correlation IDs for all requests
- **Header Injection**: Adds correlation IDs to response headers
- **Request Tracking**: All requests tracked with correlation IDs

### 7. Admin System Health Dashboard

**Location**: 
- API: `src/app/api/admin/system-health/route.ts`
- UI: `src/app/dashboard/admin/system-health/page.tsx`

**Features**:
- **Queue Depths**: Real-time queue depths for BackgroundJob, EmailQueue, WebhookOutbox
- **Queue Status**: Breakdown by status (pending, processing, completed, failed)
- **Webhook Failures**: 24-hour webhook failure count
- **Domain Verification Status**: Overview of custom domain verification status
- **System Metrics**: Request count, error count, average response time (last hour)
- **Recent Errors**: Last 10 errors/fatal logs from the past 24 hours
- **Auto-refresh**: Automatically refreshes every 30 seconds

**Access Control**:
- Requires admin role (`role = 'admin'` in User table)
- Returns 403 if user is not admin

**Dashboard Sections**:
1. **Queue Depths**: Three cards showing queue depths and status breakdowns
2. **Domain Verification**: Summary of domain verification status
3. **System Metrics**: Request, error, and latency metrics
4. **Recent Errors**: List of recent errors with timestamps and messages

## Database Schema

### SystemLog Table
```sql
CREATE TABLE public."SystemLog" (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL, -- 'debug', 'info', 'warn', 'error', 'fatal'
  message TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  context JSONB,
  error JSONB,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Metric Table
```sql
CREATE TABLE public."Metric" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  labels JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### RequestMetric Table
```sql
CREATE TABLE public."RequestMetric" (
  id TEXT PRIMARY KEY,
  "correlationId" TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "responseTime" INTEGER NOT NULL,
  "requestSize" INTEGER DEFAULT 0,
  "responseSize" INTEGER DEFAULT 0,
  "userId" TEXT,
  "organizationId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

## Environment Variables

Add these to your `.env.local`:

```env
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN="https://[your-sentry-dsn]@[your-org].ingest.sentry.io/[project-id]"
SENTRY_DSN="https://[your-sentry-dsn]@[your-org].ingest.sentry.io/[project-id]"
```

## Migration

Run the observability migration:

```bash
# Apply migration
psql -h [your-db-host] -U postgres -d postgres -f migrations/20250108_observability.sql
```

Or use your migration tool to apply `migrations/20250108_observability.sql`.

## Usage Examples

### Using Logging in API Routes

```typescript
import { createLoggerFromRequest } from '@/lib/logging'

export async function POST(request: NextRequest) {
  const logger = createLoggerFromRequest(request)
  
  logger.info('Starting request processing')
  
  try {
    // Your logic here
    logger.info('Request processed successfully', { qrCodeId: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to process request', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}
```

### Recording Custom Metrics

```typescript
import { recordMetric } from '@/lib/metrics'

await recordMetric('qr_code_created', 1, {
  userId: user.id,
  plan: user.plan,
})
```

### Getting Metrics

```typescript
import { getRequestRate, getErrorRate, getAverageLatency } from '@/lib/metrics'

const startDate = new Date()
startDate.setHours(startDate.getHours() - 1)
const endDate = new Date()

const requestRate = await getRequestRate(startDate, endDate, '/api/qr-codes')
const errorRate = await getErrorRate(startDate, endDate, '/api/qr-codes')
const avgLatency = await getAverageLatency(startDate, endDate, '/api/qr-codes')
```

## Accessing Admin System Health Page

1. Ensure you have admin role in the User table:
   ```sql
   UPDATE public."User" SET role = 'admin' WHERE id = '[your-user-id]';
   ```

2. Navigate to `/dashboard/admin/system-health`

3. The page will automatically refresh every 30 seconds and show:
   - Queue depths and statuses
   - Webhook failures (24h)
   - Domain verification status
   - System metrics (last hour)
   - Recent errors (last 24 hours)

## Cleanup and Maintenance

### Log Retention

The migration includes a cleanup function that can be run periodically:

```sql
SELECT public.cleanup_old_logs();
```

This removes:
- SystemLog entries older than 90 days
- RequestMetric entries older than 90 days
- Metric entries older than 30 days

### Recommended Cron Job

Set up a cron job to run cleanup:

```bash
# Daily cleanup at 2 AM
0 2 * * * psql -h [your-db-host] -U postgres -d postgres -c "SELECT public.cleanup_old_logs();"
```

## Best Practices

1. **Use Correlation IDs**: Always include correlation IDs in error messages and logs for easier tracing
2. **Mask PII**: Never log sensitive data directly - use the logging utility which automatically masks PII
3. **Monitor Queue Depths**: Keep an eye on queue depths in the admin dashboard to prevent backlog
4. **Track Business Metrics**: Use the metrics system to track important business KPIs
5. **Review Sentry Regularly**: Check Sentry for error trends and fix critical issues promptly

## Future Enhancements

- Integration with external logging services (e.g., Logtail, Datadog)
- Real-time alerting for critical errors
- Custom metric dashboards
- Alert rules and notifications
- Distributed tracing across services

