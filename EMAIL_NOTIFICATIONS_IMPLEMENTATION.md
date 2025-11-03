# Email & Notifications Implementation Summary

## Overview

Comprehensive email and notification system has been implemented with transactional emails, in-app notifications, threshold monitoring, and email digests.

## Features Implemented

### ✅ 1. Email Service Abstraction
- **Multi-provider support**: Resend, SendGrid, AWS SES, SMTP, Console (dev)
- **Email queue**: Async email sending with retry logic
- **Email logging**: Track sent emails with status
- **Template system**: Dynamic email templates with variable replacement

**Implementation**: `src/lib/email.ts`

### ✅ 2. Transactional Emails
- **Email verification**: Sent on registration and resend option
- **Password reset**: Secure token-based password reset
- **Organization invitations**: Email with invitation link
- **Payment receipts**: Sent after successful payments
- **Dunning emails**: Sent on payment failures
- **Usage alerts**: Sent when thresholds are crossed

**Implementation**: `src/lib/transactional-emails.ts`

### ✅ 3. Email Templates
- **6 default templates**: Verification, reset, invite, receipt, dunning, usage alert
- **HTML and plain text**: Both formats supported
- **Variable substitution**: `{{variable}}` syntax
- **Customizable**: Templates stored in database

**Implementation**: `migrations/20250104_email_templates_seed.sql`

### ✅ 4. In-App Notifications
- **Notification system**: Real-time in-app notifications
- **Notification types**: Info, warning, error, success, usage alerts
- **Mark as read**: Individual and bulk read marking
- **Unread count**: Badge with unread count
- **Action links**: Notifications with clickable actions

**Implementation**: `src/lib/notifications.ts`, `src/components/notifications-dropdown.tsx`

### ✅ 5. Notification Preferences
- **Email settings**: Enable/disable email notifications
- **In-app settings**: Enable/disable in-app notifications
- **Email frequency**: Immediate, daily digest, weekly digest
- **Threshold configuration**: Customizable alert thresholds

**Implementation**: `src/app/api/notifications/preferences/route.ts`

### ✅ 6. Threshold Monitoring
- **Credits low**: Monitors and alerts when credits drop below threshold
- **Scan threshold**: Alerts when QR codes approach scan limits
- **Domain verification**: Notifies on domain verification status
- **Auto-resolution**: Alerts resolve when threshold conditions improve

**Implementation**: `src/lib/threshold-monitoring.ts`

### ✅ 7. Email Digests
- **Daily digest**: Summary of notifications from last 24 hours
- **Weekly digest**: Summary of notifications from last 7 days
- **Smart aggregation**: Only sends if there are items to digest
- **Cron endpoint**: `/api/cron/email-digest` for scheduled sending

**Implementation**: `src/lib/email-digest.ts`

## Database Schema

### New Tables

1. **EmailTemplate**: Email templates with HTML/text body
2. **EmailQueue**: Queued emails for async sending
3. **EmailLog**: Logs of sent emails with status
4. **NotificationPreference**: User notification preferences
5. **Notification**: In-app notifications
6. **EmailVerificationToken**: Email verification tokens
7. **PasswordResetToken**: Password reset tokens
8. **ThresholdAlert**: Threshold crossing alerts

See `migrations/20250104_emails_and_notifications.sql` for full schema.

## API Routes Created

### Email & Authentication
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/reset-password` - Request or confirm password reset
- `POST /api/auth/send-verification` - Resend verification email

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications` - Mark all as read
- `PATCH /api/notifications/[id]` - Mark notification as read
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences

### Cron Jobs
- `POST /api/cron/email-digest` - Send email digests (daily/weekly)

## UI Components

### Notifications Dropdown
- **Location**: Navigation bar (when logged in)
- **Features**: 
  - Unread count badge
  - List of recent notifications
  - Mark as read functionality
  - Link to full notifications page

**Implementation**: `src/components/notifications-dropdown.tsx`

### Notifications Page
- **Location**: `/dashboard/notifications`
- **Features**:
  - Full notification list
  - Notification preferences
  - Email frequency settings
  - Threshold configuration

**Implementation**: `src/app/dashboard/notifications/page.tsx`

## Integration Points

### Email Verification
- ✅ Integrated into registration flow (`src/app/api/auth/register/route.ts`)

### Password Reset
- ✅ New endpoint for password reset requests
- ✅ Token-based secure reset flow

### Organization Invitations
- ✅ Integrated into invitation flow (`src/app/api/organizations/[id]/members/route.ts`)

### Payment Receipts
- ✅ Integrated into billing webhook (`src/app/api/billing/webhook/route.ts`)
- ✅ Sent on `invoice.paid` event

### Dunning Emails
- ✅ Integrated into billing webhook
- ✅ Sent on `payment.failed` event

### Threshold Monitoring
- ✅ Credits monitoring integrated into credits API
- ✅ Scan threshold monitoring integrated into scan API
- ✅ Domain verification notifications integrated

## Email Provider Setup

### Environment Variables

Add to `.env`:

```bash
# Email Provider (choose one)
EMAIL_PROVIDER=resend  # or 'sendgrid', 'ses', 'smtp', 'console'

# Resend
RESEND_API_KEY=re_xxxxx

# SendGrid (if using)
SENDGRID_API_KEY=SG.xxxxx

# AWS SES (if using)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx

# SMTP (if using)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password

# Email From Address
EMAIL_FROM=noreply@your-domain.com

# Cron Secret (for scheduled jobs)
CRON_SECRET=your-secret-key

# App Configuration
APP_NAME=QR Generator
NEXTAUTH_URL=https://your-domain.com
```

## Usage Examples

### Send Email Verification

```typescript
import { sendEmailVerification } from '@/lib/transactional-emails'

await sendEmailVerification(userId, email, name)
```

### Send Password Reset

```typescript
import { sendPasswordReset } from '@/lib/transactional-emails'

await sendPasswordReset(userId, email, name)
```

### Create Notification

```typescript
import { createNotification } from '@/lib/notifications'

await createNotification({
  userId: 'user-id',
  type: 'credit_low',
  title: 'Low Credits',
  message: 'You have 5 credits remaining',
  actionUrl: '/dashboard/settings/billing',
  actionLabel: 'Top Up',
})
```

### Check Thresholds

```typescript
import { checkCreditsThreshold, checkScanThreshold } from '@/lib/threshold-monitoring'

await checkCreditsThreshold(userId)
await checkScanThreshold(qrCodeId, userId)
```

## Email Digest System

### Setup Cron Job

Configure a cron job to call the digest endpoint:

**Daily (e.g., at 9 AM UTC):**
```bash
0 9 * * * curl -X POST https://your-domain.com/api/cron/email-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"frequency":"daily"}'
```

**Weekly (e.g., Monday 9 AM UTC):**
```bash
0 9 * * 1 curl -X POST https://your-domain.com/api/cron/email-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"frequency":"weekly"}'
```

## Testing

### Development

In development, set `EMAIL_PROVIDER=console` to see emails in console instead of sending.

### Testing Email Templates

1. Templates are stored in `EmailTemplate` table
2. Update templates via database or create API endpoint
3. Variables are replaced: `{{name}}`, `{{verificationUrl}}`, etc.

## Next Steps

### Recommended Enhancements

1. **Email Templates UI**: Admin interface to edit email templates
2. **Email Queue Worker**: Background job processor for email queue
3. **Email Analytics**: Track open rates, click rates, bounce rates
4. **Push Notifications**: Browser push notifications support
5. **SMS Notifications**: SMS alerts for critical events
6. **Webhook Notifications**: Send notifications to external webhooks

### Monitoring

1. **Email Delivery**: Monitor email queue and logs
2. **Bounce Rates**: Track failed email deliveries
3. **Notification Engagement**: Track notification read rates
4. **Threshold Alerts**: Monitor threshold alert frequency

## Support

For email issues: support@your-domain.com
For notification questions: See documentation in dashboard

---

**Last Updated**: [Date]
**Version**: 1.0.0

