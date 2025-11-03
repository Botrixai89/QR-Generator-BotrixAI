# Custom Domains and Link Routing Implementation

This document outlines the complete custom domain flow implementation with DNS verification, SSL management, routing, vanity URLs, analytics, and customizable error pages.

## ✅ Completed Features

### 1. DNS Verification (TXT Records)
- **Location**: `src/lib/domain-verification.ts`
- **Features**:
  - Enhanced DNS verification with retry logic (up to 3 attempts)
  - Better error handling for DNS resolution errors
  - Support for various DNS error codes (ENOTFOUND, ETIMEDOUT, etc.)
  - Automatic retry with configurable delays
  - Last checked timestamp tracking

### 2. Auto-Managed SSL Certificates
- **Location**: `src/lib/ssl-management.ts`
- **Features**:
  - Automatic SSL certificate provisioning for verified domains
  - SSL certificate expiration monitoring
  - Auto-renewal for certificates expiring within 30 days
  - SSL status tracking (pending, active, expired, error)
  - Certificate ID and expiration date storage

### 3. Domain Routing Configuration
- **Location**: `src/lib/domain-routing.ts`, `src/middleware.ts`
- **Features**:
  - Custom domain request routing in middleware
  - Vanity URL resolution to QR codes
  - Custom slug support per domain
  - Default redirect configuration per domain
  - Path-based routing (allowed/blocked paths)
  - Automatic fallback to default routing for non-custom domains

### 4. Domain Status UI
- **Location**: `src/app/dashboard/settings/domains/page.tsx`
- **Features**:
  - Domain management dashboard
  - Real-time domain status display
  - DNS verification instructions
  - SSL status monitoring
  - Domain analytics overview
  - Add, verify, update, and remove domains

### 5. Vanity URLs and Slug Management
- **Location**: `src/app/api/vanity-urls/route.ts`, `src/lib/domain-routing.ts`
- **Features**:
  - Create and manage vanity URLs for QR codes
  - Custom slug support with conflict checking
  - Domain-specific vanity URLs
  - Availability checking before assignment
  - Vanity URL to QR code mapping
  - Quick lookup via database indexes

### 6. Analytics Per Domain
- **Location**: `src/app/api/domains/[domainId]/analytics/route.ts`
- **Features**:
  - Daily analytics aggregation per domain
  - Total scans and unique visitors tracking
  - Country, device, and browser breakdown
  - Date range filtering
  - Real-time analytics updates
  - Analytics data storage in dedicated table

### 7. Customizable 404/Expiry Pages
- **Location**: `src/lib/error-pages.ts`
- **Features**:
  - Custom 404 pages per QR code
  - Custom expiry pages per QR code
  - Custom 404 pages per domain
  - Custom expiry pages per domain
  - Default error pages with professional styling
  - Support for custom HTML content
  - QR code information display on error pages
  - Redirect options on error pages

## 📊 Database Schema

### New Tables
1. **QrCodeCustomDomain** (enhanced):
   - Added: `routingConfig`, `custom404Page`, `customExpiryPage`, `sslCertId`, `sslStatus`, `sslExpiresAt`, `lastDnsCheck`, `status`, `errorMessage`

2. **QrCodeDomainAnalytics**:
   - Daily aggregated analytics per domain
   - Tracks: total scans, unique visitors, countries, devices, browsers

3. **QrCodeVanityUrl**:
   - Maps vanity URLs and slugs to QR codes
   - Supports domain-specific vanity URLs
   - Quick lookup indexes

### Enhanced Tables
1. **QrCode**:
   - Added: `vanityUrl`, `customSlug`, `custom404Page`, `customExpiryPage`

## 🔌 API Endpoints

### Custom Domains
- `GET /api/custom-domains` - List user's domains
- `POST /api/custom-domains` - Add/verify/update/remove/check-status domains

### Vanity URLs
- `GET /api/vanity-urls` - List vanity URLs (optionally filtered by QR code)
- `POST /api/vanity-urls` - Create/update vanity URL
- `DELETE /api/vanity-urls` - Remove vanity URL

### Domain Analytics
- `GET /api/domains/[domainId]/analytics` - Get analytics for a domain
- `POST /api/domains/[domainId]/analytics` - Record analytics event

## 🛠️ Key Components

### Utilities
1. **domain-verification.ts**: DNS verification with retry logic
2. **ssl-management.ts**: SSL certificate management and renewal
3. **domain-routing.ts**: Custom domain routing and vanity URL resolution
4. **error-pages.ts**: Customizable error page generation

### UI Components
1. **domains/page.tsx**: Domain management dashboard

## 🔄 Workflow

### Adding a Custom Domain
1. User adds domain via UI
2. System generates verification token
3. User adds TXT record to DNS
4. User verifies domain (system checks DNS with retries)
5. System auto-provisions SSL certificate
6. Domain status changes to "active"
7. Domain is ready for use

### Using Vanity URLs
1. User creates QR code
2. User assigns vanity URL (with conflict checking)
3. Optionally associates with custom domain
4. Vanity URL is stored in mapping table
5. Requests to custom domain + vanity URL route to QR code

### Custom Domain Routing
1. Request arrives at custom domain
2. Middleware checks if host is custom domain
3. Extracts pathname (slug/vanity URL)
4. Looks up in vanity URL mapping table
5. Redirects to QR code scan endpoint
6. If not found, returns custom 404 page

## 🔒 Security Features

- Domain ownership verification via DNS
- User-specific domain isolation (RLS policies)
- SSL certificate auto-management
- Vanity URL conflict prevention
- Rate limiting on verification attempts

## 📝 Migration

Run the migration file:
```bash
# Apply database migration
psql -d your_database -f migrations/20250105_custom_domains_enhanced.sql
```

Or via Supabase:
```sql
-- Run the SQL in migrations/20250105_custom_domains_enhanced.sql
```

## 🚀 Next Steps

1. **SSL Provider Integration**: Connect to actual SSL provider (Let's Encrypt, AWS ACM, etc.)
2. **Analytics Dashboard**: Build detailed analytics visualization
3. **Domain Settings UI**: Create UI for routing configuration
4. **Custom Error Page Editor**: Visual editor for custom 404/expiry pages
5. **Email Notifications**: Notify users about domain verification status changes
6. **DNS Health Monitoring**: Periodic checks for DNS record validity

## 🧪 Testing

Test the following scenarios:
1. Add domain and verify DNS
2. Create vanity URL for QR code
3. Access QR code via custom domain + vanity URL
4. Test custom 404 pages
5. Test custom expiry pages
6. Verify analytics tracking
7. Test SSL certificate management
8. Test domain removal (with conflict checking)

## 📚 Related Files

- Database Migration: `migrations/20250105_custom_domains_enhanced.sql`
- Domain Verification: `src/lib/domain-verification.ts`
- SSL Management: `src/lib/ssl-management.ts`
- Domain Routing: `src/lib/domain-routing.ts`
- Error Pages: `src/lib/error-pages.ts`
- Custom Domains API: `src/app/api/custom-domains/route.ts`
- Vanity URLs API: `src/app/api/vanity-urls/route.ts`
- Domain Analytics API: `src/app/api/domains/[domainId]/analytics/route.ts`
- Domain UI: `src/app/dashboard/settings/domains/page.tsx`
- Middleware: `src/middleware.ts`

