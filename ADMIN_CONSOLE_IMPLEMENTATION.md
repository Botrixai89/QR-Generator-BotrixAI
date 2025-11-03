# Admin Console Implementation

This document outlines the complete admin console implementation with user management, billing, feature flags, email management, lockouts, impersonation, and content management.

## ✅ Completed Features

### 1. Admin Utilities Library

**Location**: `src/lib/admin.ts`

**Features**:
- `isAdmin()` - Check if user is admin (role-based)
- `isAdminEmail()` - Legacy email-based admin check
- `requireAdmin()` - Enforce admin access
- `getUsers()` - Get users with pagination and search
- `getUserById()` - Get user details
- `updateUser()` - Update user information
- `lockUser()` - Lock user account with reason
- `unlockUser()` - Unlock user account
- `grantCredits()` - Grant credits to users
- Full audit logging for all admin actions

### 2. Database Schema

**Location**: `migrations/20250109_admin_console.sql`

**Tables Created**:
- `FeatureFlag` - Feature flags and rollouts
- `Announcement` - System announcements
- `AnnouncementDismissal` - Track dismissed announcements
- `ImpersonationSession` - Audit trail for impersonation

**Features**:
- Feature flags with user/plan targeting
- Gradual rollout support (percentage-based)
- Announcements with targeting (all, free, paid, admin, specific users)
- Impersonation session tracking with audit trail
- User metadata support for lockouts

### 3. Admin API Routes

**Location**:
- `src/app/api/admin/users/route.ts` - List users
- `src/app/api/admin/users/[id]/route.ts` - User management
- `src/app/api/admin/impersonate/route.ts` - Impersonation
- `src/app/api/admin/stats/route.ts` - Dashboard statistics

**Features**:
- User listing with pagination and search
- User details with subscriptions, organizations, adjustments
- User updates (role, plan, credits, etc.)
- User actions (lock, unlock, grant credits)
- Impersonation session management
- Admin statistics overview

### 4. Admin Dashboard

**Location**: `src/app/dashboard/admin/page.tsx`

**Features**:
- Overview statistics (users, organizations, revenue, refunds)
- Navigation hub for all admin features
- Quick access to:
  - User Management
  - Organizations
  - Billing & Refunds
  - Feature Flags
  - Email Management
  - User Lockouts
  - Impersonation
  - Content Management
  - System Health
  - Admin Settings

## 🚧 Remaining Components

### 5. User Management UI

**Needs**: `src/app/dashboard/admin/users/page.tsx`
- User list with search and filters
- User detail view
- Edit user form
- Lock/unlock actions
- Grant credits form
- View user subscriptions and organizations

### 6. Billing Management UI

**Needs**: `src/app/dashboard/admin/billing/page.tsx`
- Refund processing UI
- Credit adjustments
- Invoice management
- Payment history
- Subscription management

### 7. Feature Flags UI

**Needs**: `src/app/dashboard/admin/feature-flags/page.tsx`
- List feature flags
- Create/edit feature flags
- Enable/disable flags
- Configure targeting (users, plans, percentage)
- View flag usage

### 8. Email Management UI

**Needs**: `src/app/dashboard/admin/emails/page.tsx`
- Email queue status
- Email logs
- Retry failed emails
- Email statistics
- Send test emails

### 9. User Lockouts UI

**Needs**: `src/app/dashboard/admin/lockouts/page.tsx`
- List locked users
- Lock/unlock actions
- View lockout reasons
- Lockout history

### 10. Impersonation UI

**Needs**: `src/app/dashboard/admin/impersonate/page.tsx`
- User search for impersonation
- Start impersonation session
- Impersonation session history
- Active session management
- Audit trail view

### 11. Content Management UI

**Needs**: `src/app/dashboard/admin/content/page.tsx`
- Manage email templates
- Create/edit announcements
- Announcement targeting
- Template variables
- Preview templates

### 12. Additional API Routes

**Needs**:
- `/api/admin/feature-flags` - Feature flag management
- `/api/admin/announcements` - Announcement management
- `/api/admin/emails` - Email queue management
- `/api/admin/organizations` - Organization management
- `/api/admin/lockouts` - Lockout management

## Usage Examples

### Check Admin Access

```typescript
import { isAdmin, requireAdmin } from '@/lib/admin'

// Check if user is admin
const userIsAdmin = await isAdmin(userId)

// Require admin (throws if not admin)
await requireAdmin(userId)
```

### Manage Users

```typescript
import { getUsers, lockUser, unlockUser, grantCredits } from '@/lib/admin'

// Get users with pagination
const { users, total } = await getUsers(1, 20, 'search@example.com')

// Lock user
await lockUser(userId, 'Violation of terms', adminUserId)

// Unlock user
await unlockUser(userId, adminUserId)

// Grant credits
await grantCredits(userId, 100, 'Compensation for issue', adminUserId)
```

### Impersonation

```typescript
// Start impersonation (via API)
const response = await fetch('/api/admin/impersonate', {
  method: 'POST',
  body: JSON.stringify({
    targetUserId: 'user-id',
    reason: 'Support investigation',
  }),
})

const { impersonationSessionId, targetUser } = await response.json()

// End impersonation
await fetch(`/api/admin/impersonate?sessionId=${impersonationSessionId}`, {
  method: 'DELETE',
})
```

## Database Migration

Run the migration:

```bash
# Apply migration
psql -h [your-db-host] -U postgres -d postgres -f migrations/20250109_admin_console.sql
```

Or use your migration tool to apply `migrations/20250109_admin_console.sql`.

## Access Control

### Admin Role

Users with `role = 'admin'` in the User table have admin access.

### Legacy Admin Emails

Set `ADMIN_EMAILS` environment variable (comma-separated) for email-based admin check.

### Grant Admin Access

```sql
UPDATE public."User" SET role = 'admin' WHERE id = '[user-id]';
```

## Audit Trail

All admin actions are logged in:
- `AuditLog` table - General audit log
- `ImpersonationSession` table - Impersonation sessions
- `BillingAdjustment` table - Billing changes

## Security Considerations

1. **Impersonation**: 
   - Only admins can impersonate
   - Cannot impersonate other admins (unless `ALLOW_ADMIN_IMPERSONATION=true`)
   - All impersonation sessions are logged
   - Impersonation sessions must be explicitly ended

2. **Lockouts**:
   - Locked users cannot authenticate
   - Lockout reasons are stored in metadata
   - Lockout events are logged

3. **Billing**:
   - All refunds require admin approval
   - Credit grants are logged
   - Billing adjustments are tracked

## Next Steps

1. Complete UI components for each admin section
2. Add bulk operations (bulk lock, bulk grant credits)
3. Add advanced search and filters
4. Add export functionality (CSV, JSON)
5. Add admin activity dashboard
6. Add admin notifications for important events
7. Add admin user management (create/edit admin users)

