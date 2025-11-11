# Standardized API Error Handling

## Overview

This document describes the standardized error handling system implemented across all API routes to ensure consistent, predictable error responses.

## Problem Statement

### Before Implementation

**Inconsistent Error Responses**:
```typescript
// Route 1
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// Route 2
return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

// Route 3
return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

// Route 4
return NextResponse.json({ 
  error: 'auth_required', 
  message: 'Please login' 
}, { status: 401 })
```

**Problems**:
- ❌ 4 different response formats for the same error
- ❌ Inconsistent error codes (`Unauthorized` vs `unauthorized` vs `auth_required`)
- ❌ Different field names (`error` vs `message`)
- ❌ Hard to handle errors on frontend
- ❌ No correlation IDs for debugging
- ❌ No timestamp information

## Solution: Standardized Error System

### Standard Error Response Structure

**All API errors now follow this structure**:

```typescript
{
  "error": {
    "code": "unauthorized",           // Machine-readable error code
    "message": "Authentication required", // Human-readable message
    "timestamp": "2025-01-11T12:00:00Z", // ISO timestamp
    "correlationId": "abc-123",       // Request correlation ID (optional)
    "details": { ... },                // Additional context (optional)
    "field": "email"                   // Field name for validation errors (optional)
  }
}
```

### Benefits ✅

- ✅ **Consistent**: Same structure across all API routes
- ✅ **Predictable**: Frontend knows exactly what to expect
- ✅ **Debuggable**: Correlation IDs for tracking requests
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Documented**: All error codes are defined and documented
- ✅ **Testable**: Easy to test error scenarios

## Error Codes

### Authentication & Authorization (401, 403)

| Code | Status | Description |
|------|--------|-------------|
| `unauthorized` | 401 | Authentication required |
| `invalid_credentials` | 401 | Invalid email or password |
| `token_expired` | 401 | Authentication token expired |
| `session_expired` | 401 | Session has expired |
| `forbidden` | 403 | Insufficient permissions |
| `account_deactivated` | 403 | Account is deactivated |
| `email_not_verified` | 403 | Email verification required |

### Resource Errors (404)

| Code | Status | Description |
|------|--------|-------------|
| `not_found` | 404 | Generic resource not found |
| `resource_not_found` | 404 | Specific resource not found |
| `user_not_found` | 404 | User not found |
| `qr_code_not_found` | 404 | QR code not found |

### Validation Errors (400)

| Code | Status | Description |
|------|--------|-------------|
| `validation_error` | 400 | General validation error |
| `invalid_input` | 400 | Invalid input for field |
| `missing_required_field` | 400 | Required field is missing |
| `invalid_format` | 400 | Invalid format for field |
| `invalid_file_type` | 400 | File type not allowed |
| `file_too_large` | 400 | File exceeds size limit |

### Business Logic Errors (402, 403)

| Code | Status | Description |
|------|--------|-------------|
| `no_credits` | 402 | Insufficient credits |
| `plan_limit` | 403 | Plan limit reached |
| `feature_not_allowed` | 403 | Feature not available on plan |
| `quota_exceeded` | 403 | Quota limit exceeded |

### Rate Limiting (429)

| Code | Status | Description |
|------|--------|-------------|
| `rate_limited` | 429 | Rate limit exceeded |
| `too_many_requests` | 429 | Too many requests |

### Server Errors (500, 503)

| Code | Status | Description |
|------|--------|-------------|
| `internal_error` | 500 | Internal server error |
| `database_error` | 500 | Database operation failed |
| `external_service_error` | 503 | External service unavailable |
| `timeout` | 503 | Operation timed out |

### Payment Errors (402)

| Code | Status | Description |
|------|--------|-------------|
| `payment_required` | 402 | Payment required |
| `payment_failed` | 402 | Payment processing failed |
| `invalid_payment_method` | 402 | Payment method invalid |

### Conflict Errors (409)

| Code | Status | Description |
|------|--------|-------------|
| `already_exists` | 409 | Resource already exists |
| `duplicate_entry` | 409 | Duplicate entry |
| `conflict` | 409 | Resource conflict |

## Usage Examples

### Basic Usage in API Routes

```typescript
import { ApiErrors, handleApiError } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!session) {
      return ApiErrors.unauthorized().toResponse()
    }

    // Validate input
    if (!url) {
      return ApiErrors.missingField('url').toResponse()
    }

    // Check business rules
    if (credits < 1) {
      return ApiErrors.insufficientCredits(1, credits).toResponse()
    }

    // Success
    return createdResponse(data)

  } catch (error) {
    // Catch-all error handler
    return handleApiError(error, correlationId)
  }
}
```

### Custom Error Details

```typescript
// With additional context
return ApiErrors.validationError(
  'Multiple fields invalid',
  { 
    fields: ['email', 'password'],
    errors: ['Invalid format', 'Too short']
  }
).toResponse()

// Response:
{
  "error": {
    "code": "validation_error",
    "message": "Multiple fields invalid",
    "details": {
      "fields": ["email", "password"],
      "errors": ["Invalid format", "Too short"]
    },
    "timestamp": "2025-01-11T12:00:00Z"
  }
}
```

### Rate Limiting with Retry After

```typescript
if (!rateLimit.allowed) {
  return ApiErrors.rateLimited(rateLimit.retryAfter).toResponse()
}

// Response:
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Please try again in 60 seconds",
    "details": {
      "retryAfter": 60
    },
    "timestamp": "2025-01-11T12:00:00Z"
  }
}
```

### Resource Not Found

```typescript
const qrCode = await getQRCode(id)

if (!qrCode) {
  return ApiErrors.qrCodeNotFound(id).toResponse()
}

// Response:
{
  "error": {
    "code": "qr_code_not_found",
    "message": "QR code 'qr-123' not found",
    "timestamp": "2025-01-11T12:00:00Z"
  }
}
```

### Plan Limits

```typescript
if (qrCodeCount >= planLimit) {
  return ApiErrors.planLimitReached('QR codes', planLimit).toResponse()
}

// Response:
{
  "error": {
    "code": "plan_limit",
    "message": "Plan limit reached for 'QR codes'. Maximum: 100",
    "details": {
      "feature": "QR codes",
      "limit": 100
    },
    "timestamp": "2025-01-11T12:00:00Z"
  }
}
```

## Frontend Integration

### React/TypeScript Example

```typescript
// Define error response type
interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
    field?: string
    timestamp: string
    correlationId?: string
  }
}

// API call with error handling
async function createQRCode(data: QRCodeData) {
  try {
    const response = await fetch('/api/qr-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiErrorResponse = await response.json()
      
      // Handle specific error codes
      switch (error.error.code) {
        case 'no_credits':
          toast.error('You have no credits. Please purchase more.')
          router.push('/pricing')
          break
          
        case 'plan_limit':
          toast.error(error.error.message)
          router.push('/settings/billing')
          break
          
        case 'rate_limited':
          const retryAfter = error.error.details?.retryAfter
          toast.error(`Too many requests. Try again in ${retryAfter} seconds`)
          break
          
        case 'validation_error':
          // Show field-specific errors
          if (error.error.field) {
            setFieldError(error.error.field, error.error.message)
          }
          break
          
        default:
          toast.error(error.error.message)
      }
      
      // Log correlation ID for debugging
      if (error.error.correlationId) {
        console.error('Error correlation ID:', error.error.correlationId)
      }
      
      return null
    }

    return await response.json()
  } catch (error) {
    // Network or parsing error
    toast.error('Connection error. Please try again.')
    return null
  }
}
```

### Error Toast Helper

```typescript
// Helper to display appropriate error toasts
function handleApiError(error: ApiErrorResponse) {
  const { code, message, details } = error.error

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    unauthorized: 'Please sign in to continue',
    forbidden: 'You don\'t have permission for this action',
    not_found: 'The requested resource was not found',
    rate_limited: `Too many requests. Try again in ${details?.retryAfter || 'a few'} seconds`,
    no_credits: 'You have no credits remaining',
    plan_limit: 'You\'ve reached your plan limit',
  }

  const userMessage = errorMessages[code] || message

  toast.error(userMessage, {
    description: code,
    action: getErrorAction(code),
  })
}

function getErrorAction(code: string) {
  switch (code) {
    case 'no_credits':
      return {
        label: 'Buy Credits',
        onClick: () => router.push('/pricing'),
      }
    case 'plan_limit':
      return {
        label: 'Upgrade Plan',
        onClick: () => router.push('/settings/billing'),
      }
    default:
      return undefined
  }
}
```

## Testing

### Unit Tests

```bash
npm run test tests/unit/api-errors.test.ts
```

### Test Coverage

- ✅ All error factory functions
- ✅ Error response structure
- ✅ HTTP status codes
- ✅ Error code consistency
- ✅ Correlation ID handling
- ✅ Optional fields handling

### Example Test

```typescript
import { ApiErrors } from '@/lib/api-errors'

it('should create insufficient credits error', () => {
  const error = ApiErrors.insufficientCredits(5, 2)

  expect(error.code).toBe('no_credits')
  expect(error.statusCode).toBe(402)
  expect(error.details).toEqual({ required: 5, available: 2 })
})
```

## Migration Guide

### Step 1: Import Error Utilities

```typescript
// Add to API route
import { ApiErrors, handleApiError, createdResponse } from '@/lib/api-errors'
```

### Step 2: Replace Error Responses

**Before**:
```typescript
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**After**:
```typescript
return ApiErrors.unauthorized().toResponse()
```

### Step 3: Use Success Helpers

**Before**:
```typescript
return NextResponse.json(data, { status: 201 })
```

**After**:
```typescript
return createdResponse(data)
```

### Step 4: Add Catch-All Handler

**Before**:
```typescript
} catch (error) {
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
```

**After**:
```typescript
} catch (error) {
  return handleApiError(error, correlationId)
}
```

## Best Practices

### 1. Use Specific Error Codes ✅

```typescript
// Good
return ApiErrors.qrCodeNotFound(id).toResponse()

// Bad
return ApiErrors.notFound('Resource').toResponse()
```

### 2. Include Helpful Details ✅

```typescript
// Good
return ApiErrors.insufficientCredits(required, available).toResponse()

// Bad
return ApiErrors.paymentRequired().toResponse()
```

### 3. Use Correlation IDs ✅

```typescript
// Good
return ApiErrors.databaseError('Query failed', details).toResponse(correlationId)

// Bad
return ApiErrors.databaseError('Query failed').toResponse()
```

### 4. Don't Expose Internal Details ⚠️

```typescript
// Good (production)
if (process.env.NODE_ENV !== 'production') {
  error.details = { stack: err.stack }
}

// Bad
error.details = { stack: err.stack, query: dbQuery }
```

### 5. Validate Early ✅

```typescript
// Good - validate at start of function
if (!url) {
  return ApiErrors.missingField('url').toResponse()
}

// Bad - deep in nested logic
if (someCondition) {
  if (anotherCondition) {
    if (!url) {
      return error...
    }
  }
}
```

## Error Monitoring

### Sentry Integration

Errors are automatically sent to Sentry with correlation IDs:

```typescript
Sentry.captureException(error, {
  tags: {
    correlationId: correlationId,
    errorCode: apiError.code,
  },
  extra: {
    details: apiError.details,
  },
})
```

### Logging

All errors are logged with full context:

```typescript
logger.error('API error', error, {
  correlationId,
  errorCode: error.code,
  statusCode: error.statusCode,
  userId: session?.user?.id,
})
```

## Performance Impact

✅ **Negligible** - Error object creation is very fast
✅ **Response Size** - Consistent size, ~100-200 bytes per error
✅ **Type Safety** - Zero runtime overhead, compile-time checks only

## Related Files

- Error utilities: `src/lib/api-errors.ts`
- Tests: `tests/unit/api-errors.test.ts`
- Updated API route: `src/app/api/qr-codes/route.ts`
- Documentation: This file

## References

- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [REST API Best Practices](https://restfulapi.net/http-status-codes/)
- [Error Handling Patterns](https://blog.restcase.com/rest-api-error-codes-101/)

---

**Status**: ✅ Implemented
**Priority**: 🚨 Critical
**Impact**: High (better error handling and debugging)
**Complexity**: Medium
**Maintenance**: Low

