# Security and Compliance Documentation

## Overview

This document outlines the security and compliance measures implemented in the QR Generator platform.

## Input Validation

### Centralized Validation with Zod

All API routes use centralized Zod schemas for input validation:

- **Location**: `src/lib/validation.ts`
- **Usage**: Import validation schemas and use `validateRequest()`, `validateJsonBody()`, or `validateQuery()`
- **Benefits**: Consistent error responses, type safety, automatic validation

Example:
```typescript
import { validateJsonBody, qrCodeCreateSchema } from '@/lib/validation'

const validation = await validateJsonBody(qrCodeCreateSchema, request)
if (!validation.success) {
  return validation.response
}
```

### Input Sanitization

- XSS prevention through `sanitizeInput()`
- URL validation with `validateAndSanitizeUrl()`
- Prevents malicious input from reaching the database

## Security Headers

### Implementation

Security headers are automatically added via middleware (`src/middleware.ts`):

- **Content-Security-Policy (CSP)**: Restricts resource loading
- **Strict-Transport-Security (HSTS)**: Forces HTTPS in production
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking (set to DENY)
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### Configuration

Headers are configured in `src/lib/security-headers.ts` and automatically applied to all responses via middleware.

## CSRF Protection

### Implementation

CSRF protection is implemented for all state-changing operations:

- **Token Generation**: `/api/security/csrf-token` endpoint
- **Validation**: Automatic validation on POST/PUT/PATCH/DELETE requests
- **Cookie Settings**: HttpOnly, Secure (production), SameSite=strict

### Usage

1. Frontend fetches CSRF token: `GET /api/security/csrf-token`
2. Include token in request header: `X-CSRF-Token: <token>`
3. Server validates token matches cookie value

## Secure Cookies

### Authentication Cookies

NextAuth cookies are configured with:

- **HttpOnly**: Prevents JavaScript access
- **Secure**: Only sent over HTTPS in production
- **SameSite**: Set to 'lax' for authentication flow
- **Max Age**: 30 days with 24-hour update interval

Configuration in `src/lib/auth.ts`:

```typescript
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: true, // Production only
      maxAge: 30 * 24 * 60 * 60,
    },
  },
}
```

## Secrets Management

### Storage

Secrets are encrypted and stored in the database:

- **Encryption**: AES-256-GCM with random IV and auth tag
- **Storage**: `Secret` table with encrypted values
- **Rotation**: Version tracking and rotation support

### API

- `storeSecret(name, value, rotate)`: Store or rotate a secret
- `getSecret(name)`: Retrieve decrypted secret
- `rotateSecret(name, newValue)`: Rotate existing secret
- `listSecrets()`: List all active secrets
- `deactivateSecret(name)`: Deactivate a secret

### Rotation Procedures

1. Generate new secret value
2. Encrypt and store with incremented version
3. Deactivate old secret
4. Update application configuration
5. Verify new secret works
6. Remove old secret after grace period

## Audit Logging

### Logged Actions

All sensitive actions are logged to `AuditLog` table:

- Authentication: login, logout, failed login attempts
- API Keys: create, delete, rotate, update
- Billing: subscription create/update/cancel, payment changes
- Domains: create, update, delete
- Data: export requests, deletion requests
- Organizations: create, delete, transfer
- User: password change, account deletion

### Audit Log Fields

- User ID and Organization ID
- Action type and resource type
- IP address and user agent
- Request method and path
- Success/failure status
- Metadata (JSON)

### Access

- Users can view their own audit logs
- Organization admins can view org audit logs
- Retention: 90 days (automatically cleaned up)

### Anonymization

IP addresses and user agents are anonymized after 1 year for PII compliance.

## Data Export (GDPR)

### Request Export

`GET /api/user/export?format=json|csv`

Creates an export request containing:
- User profile
- QR codes
- Scan analytics
- Organizations
- API keys (metadata only, no keys)
- Billing history

### Export Process

1. User requests export
2. Request queued for processing
3. Data gathered and formatted
4. File generated (JSON or CSV)
5. Uploaded to secure storage
6. Download URL provided (expires in 7 days)

### Export Request Status

- `pending`: Request created, waiting to process
- `processing`: Currently generating file
- `completed`: File ready for download
- `failed`: Error occurred

## Data Deletion (GDPR)

### Request Deletion

`POST /api/user/delete`

Requires email confirmation to prevent accidental deletion.

### Deletion Process

1. User requests deletion with email confirmation
2. Confirmation token generated (48 hour expiry)
3. Token sent via email
4. User confirms deletion with token
5. 30-day grace period begins
6. Account permanently deleted after grace period

### Data Deletion Steps

- API keys deleted
- QR codes and scans deleted (cascading)
- User record anonymized (email set to `deleted_<id>@deleted.local`)
- All PII removed
- Audit trail retained (with anonymized data)

### Grace Period

30-day grace period allows users to:
- Cancel deletion request
- Export data before deletion
- Contact support for assistance

## Backups and Disaster Recovery

### Database Backups

**Frequency**: Daily automated backups
**Retention**: 
- Daily: 7 days
- Weekly: 4 weeks
- Monthly: 12 months

**Storage**: Encrypted backups stored in separate region

**Verification**: Monthly restore tests

### Application Backups

- Code: Git repository with branching strategy
- Environment variables: Stored in secure vault
- Configuration: Version controlled

### Disaster Recovery Runbook

See `docs/DISASTER_RECOVERY.md` for detailed procedures.

## Retention Policies

### Audit Logs

- **Retention**: 90 days
- **Anonymization**: IP addresses and user agents after 1 year
- **Cleanup**: Automated daily cleanup of expired logs

### API Usage Logs

- **Retention**: 90 days
- **Aggregation**: Daily aggregates stored indefinitely
- **Cleanup**: Automated monthly cleanup

### Data Export Requests

- **Retention**: 7 days after expiration
- **Cleanup**: Automated daily cleanup

### Data Deletion Requests

- **Retention**: 90 days after completion
- **Metadata**: Retained for audit compliance

### PII Data

- **User Data**: Deleted per GDPR deletion requests
- **Email Addresses**: Anonymized after account deletion
- **IP Addresses**: Anonymized after 1 year
- **User Agents**: Anonymized after 1 year

## Compliance

### GDPR Compliance

- Right to access (data export)
- Right to erasure (account deletion)
- Data portability (JSON/CSV export)
- PII anonymization policies
- Data retention limits

### Security Best Practices

- Input validation on all routes
- Output encoding to prevent XSS
- SQL injection prevention (parameterized queries)
- CSRF protection for state changes
- Rate limiting on sensitive endpoints
- Secure password storage (bcrypt)
- API key encryption (bcrypt hashing)

## Security Monitoring

### Audit Log Review

- Daily review of failed authentication attempts
- Weekly review of sensitive actions
- Monthly security audit report

### Incident Response

1. Detect security incident
2. Isolate affected systems
3. Investigate and document
4. Remediate vulnerabilities
5. Notify affected users if required
6. Post-incident review

## Security Contacts

For security issues, contact: security@your-domain.com

For compliance questions, contact: compliance@your-domain.com

