# API Versioning Strategy

## Overview

Comprehensive API versioning strategy to support backwards compatibility and smooth API evolution.

## Versioning Scheme

### URL-Based Versioning (Recommended)
```
/api/v1/qr-codes  → v1
/api/v2/qr-codes  → v2
```

### Header-Based Versioning
```http
Accept-Version: v2
```

### Query Parameter
```
/api/qr-codes?api-version=v2
```

### Content Negotiation
```http
Accept: application/vnd.qrgen.v2+json
```

## Current Versions

| Version | Status | Introduced | Deprecated | Sunset |
|---------|--------|------------|------------|--------|
| v1 | ⚠️ Deprecated | 2024-01-01 | 2025-06-01 | 2026-01-01 |
| v2 | ✅ Current | 2025-01-11 | - | - |

## Version Differences

### v1 API (Legacy)
- Basic error responses
- No atomic transactions
- Simple authentication
- No caching

### v2 API (Current)
- ✅ Standardized error responses
- ✅ Atomic transactions
- ✅ Enhanced authentication
- ✅ Caching layer
- ✅ Better performance
- ✅ Improved rate limiting

## Usage Examples

### Client Making API Calls

```typescript
// Option 1: URL-based (recommended)
const response = await fetch('/api/v2/qr-codes')

// Option 2: Header-based
const response = await fetch('/api/qr-codes', {
  headers: {
    'Accept-Version': 'v2'
  }
})

// Option 3: Query parameter
const response = await fetch('/api/qr-codes?api-version=v2')
```

### Response Headers

```http
HTTP/1.1 200 OK
X-API-Version: v2
X-API-Current-Version: v2
Content-Type: application/json
```

For deprecated versions:
```http
HTTP/1.1 200 OK
X-API-Version: v1
X-API-Current-Version: v2
Warning: 299 - "API version v1 is deprecated. Please migrate to v2"
Sunset: 2026-01-01
Link: </api/v2>; rel="successor-version"
```

## Implementation

### Versioned API Route

```typescript
import { versionedAPI } from '@/lib/api-versioning'

export const GET = versionedAPI({
  v1: async (request) => {
    // v1 implementation (deprecated)
    return NextResponse.json({ message: 'v1 response' })
  },
  
  v2: async (request) => {
    // v2 implementation (current)
    return NextResponse.json({
      data: { message: 'v2 response' },
      version: 'v2'
    })
  },
})
```

### Version Detection

```typescript
import { getAPIVersion } from '@/lib/api-versioning'

export async function GET(request: NextRequest) {
  const version = getAPIVersion(request)
  
  if (version === 'v1') {
    return handleV1Request(request)
  } else if (version === 'v2') {
    return handleV2Request(request)
  }
}
```

### Middleware Integration

```typescript
// src/middleware.ts
import { getAPIVersion, redirectToVersioned } from '@/lib/api-versioning'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Redirect unversioned API calls to current version
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/v')) {
    const versionedPath = redirectToVersioned(pathname, 'v2')
    return NextResponse.redirect(new URL(versionedPath, request.url))
  }
  
  return NextResponse.next()
}
```

## Migration Guide

### For API Consumers

**Step 1**: Update base URL
```typescript
// Old
const API_BASE = '/api'

// New
const API_BASE = '/api/v2'
```

**Step 2**: Handle deprecation warnings
```typescript
const response = await fetch('/api/v1/qr-codes')

// Check for deprecation warning
const warning = response.headers.get('Warning')
if (warning?.includes('deprecated')) {
  console.warn('API version is deprecated:', warning)
  // Log to analytics, show migration notice
}
```

**Step 3**: Update error handling
```typescript
// v2 uses standardized error responses
const error = await response.json()

if (error.error) {
  // Handle standardized error
  console.error(`Error ${error.error.code}: ${error.error.message}`)
}
```

### For API Developers

**Step 1**: Create versioned endpoints
```
src/app/api/v2/
├── qr-codes/
│   └── route.ts
├── users/
│   └── route.ts
└── auth/
    └── route.ts
```

**Step 2**: Maintain backwards compatibility
```typescript
// v1 endpoint (deprecated but supported)
export async function GET_v1(request: NextRequest) {
  // Legacy implementation
  return NextResponse.json({ data })
}

// v2 endpoint (current)
export async function GET_v2(request: NextRequest) {
  // New implementation with improvements
  return createdResponse({ data, meta })
}
```

## Breaking Changes Policy

### When to Create New Version

Create a new API version when making:
- **Breaking changes** to request/response format
- **Removed fields** from responses
- **Changed authentication** methods
- **Different error** response structure

### Non-Breaking Changes (Same Version)

These don't require a new version:
- **Adding** new endpoints
- **Adding** optional fields to requests
- **Adding** fields to responses
- **Improving** performance
- **Fixing** bugs

## Version Lifecycle

### 1. Introduction Phase
- ✅ v2 announced
- ✅ Documentation published
- ✅ Migration guide released
- ✅ Both versions supported

### 2. Deprecation Phase (6 months)
- ⚠️ v1 marked as deprecated
- ⚠️ Deprecation warnings in responses
- ⚠️ Migration reminders sent
- ✅ Both versions still work

### 3. Sunset Phase (12 months)
- ❌ v1 completely removed
- ❌ 410 Gone responses for v1
- ✅ Only v2 supported

### Timeline Example
- **2025-01-11**: v2 introduced, v1 deprecated
- **2025-06-01**: v1 deprecation warnings active
- **2026-01-01**: v1 sunset (removed)

## Client SDKs

### JavaScript SDK
```typescript
import QRGeneratorSDK from '@qr-generator/sdk'

const client = new QRGeneratorSDK({
  apiKey: 'your-api-key',
  version: 'v2', // Specify version
})

// Automatically uses versioned endpoints
const qrCode = await client.qrCodes.create({
  url: 'https://example.com',
  title: 'My QR'
})
```

### Version Auto-Detection
```typescript
const client = new QRGeneratorSDK({
  apiKey: 'your-api-key',
  // Automatically uses latest version
})
```

## Monitoring

### Track Version Usage

```sql
-- Query API usage by version
SELECT
  CASE 
    WHEN endpoint LIKE '/api/v1/%' THEN 'v1'
    WHEN endpoint LIKE '/api/v2/%' THEN 'v2'
    ELSE 'unversioned'
  END as version,
  COUNT(*) as request_count,
  AVG("responseTime") as avg_response_time
FROM "RequestMetric"
WHERE "timestamp" > NOW() - INTERVAL '7 days'
GROUP BY version
ORDER BY request_count DESC;
```

### Deprecation Analytics

```typescript
// Track deprecation warning views
if (response.headers.get('Warning')?.includes('deprecated')) {
  analytics.track('api_deprecation_warning', {
    version: 'v1',
    endpoint: request.url,
    userId: user.id,
  })
}
```

## Best Practices

### 1. Version All New APIs ✅
```typescript
// Good
/api/v2/qr-codes

// Bad
/api/qr-codes
```

### 2. Support 2 Versions Max ✅
- Current version (v2)
- Previous version (v1) - deprecated

### 3. Clear Communication ✅
- Document breaking changes
- Announce deprecations 6 months ahead
- Send email notifications to API users

### 4. Gradual Migration ✅
- Support old version for 12 months
- Provide migration tools
- Offer migration support

## Related Files

- Versioning utilities: `src/lib/api-versioning.ts`
- v1 endpoints: `src/app/api/v1/`
- v2 endpoints: To be created
- Documentation: This file

## References

- [API Versioning Best Practices](https://restfulapi.net/versioning/)
- [RFC 8594 - Sunset Header](https://tools.ietf.org/html/rfc8594)
- [Stripe API Versioning](https://stripe.com/docs/api/versioning)

---

**Status**: ✅ Implemented
**Priority**: 📝 LOW
**Impact**: Medium (better API evolution)
**Complexity**: Medium
**Maintenance**: Medium

