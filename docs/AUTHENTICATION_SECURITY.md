# Authentication Security Enhancements

## Overview

This document outlines the comprehensive authentication security improvements implemented to prevent session hijacking, token theft, and unauthorized access.

## Problems Fixed

### 1. No Session Expiry ⚠️
**Before**: Sessions never expired, JWT tokens valid indefinitely
**Risk**: Stolen tokens remain valid forever
**Fixed**: ✅ Sessions expire after 30 days, tokens rotate every 7 days

### 2. No Token Rotation ⚠️
**Before**: Same JWT token used for entire session lifetime
**Risk**: Long-lived tokens easier to steal and abuse
**Fixed**: ✅ Tokens automatically rotate every 7 days

### 3. No Account Status Checks ⚠️
**Before**: Deactivated accounts could still access the system
**Risk**: Unable to revoke access for compromised accounts
**Fixed**: ✅ Account status checked on every auth request

### 4. No Login Activity Tracking ⚠️
**Before**: No visibility into user login patterns
**Risk**: Suspicious activity undetected
**Fixed**: ✅ Last login timestamp tracked for all users

### 5. No Rate Limiting on Auth ⚠️
**Before**: Unlimited login attempts possible
**Risk**: Brute force attacks feasible
**Fixed**: ✅ Login attempts logged and rate-limited

## Implemented Features

### Session Management

#### Session Expiration
```typescript
session: {
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,   // Refresh every 24 hours
}
```

**Benefits:**
- Sessions automatically expire after 30 days
- Session extended on activity (every 24 hours)
- Inactive accounts automatically logged out

#### Token Rotation
```typescript
// Token rotates every 7 days
if (tokenAge > 7 * dayInMs) {
  token.createdAt = Date.now()
  token.rotatedAt = Date.now()
}
```

**Benefits:**
- Reduces window of opportunity for stolen tokens
- Limits damage from token leakage
- Automatic rotation without user intervention

### Account Security

#### Account Status Validation
```typescript
// Check if account is active on login
if (user.isActive === false) {
  throw new Error('Account is deactivated')
}
```

**Use Cases:**
- Suspend compromised accounts
- Deactivate users who violated terms
- Temporarily lock accounts for security reasons

#### Last Login Tracking
```typescript
// Update last login timestamp
await supabaseAdmin
  .from('User')
  .update({ lastLoginAt: new Date().toISOString() })
  .eq('id', user.id)
```

**Benefits:**
- Detect unusual login patterns
- Identify inactive accounts
- Audit trail for security investigations

### Rate Limiting & Brute Force Protection

#### Login Attempt Logging
```sql
CREATE TABLE "LoginAttempt" (
  email TEXT,
  ipAddress TEXT,
  wasSuccessful BOOLEAN,
  attemptedAt TIMESTAMP
)
```

#### Account Lockout
```sql
-- Lock account after 5 failed attempts in 15 minutes
SELECT is_account_locked('user@example.com', 5, 15);
```

**Protection:**
- Max 5 failed attempts per 15 minutes
- Automatic lockout after threshold
- Separate tracking per IP and email
- Admin visibility into login attempts

### Session Tracking

#### Session Table
```sql
CREATE TABLE "Session" (
  userId TEXT,
  sessionToken TEXT UNIQUE,
  expiresAt TIMESTAMP,
  lastActivityAt TIMESTAMP,
  ipAddress TEXT,
  userAgent TEXT,
  deviceInfo JSONB,
  isActive BOOLEAN
)
```

**Features:**
- Track all active sessions per user
- View session details (IP, device, etc.)
- Revoke sessions remotely
- Auto-cleanup expired sessions

#### Session Management Functions
```sql
-- Revoke all user sessions (e.g., password change)
SELECT revoke_user_sessions('user-id');

-- Count active sessions
SELECT get_user_session_count('user-id');

-- Clean up expired sessions
SELECT cleanup_expired_sessions();
```

### Password Reset Security

#### Secure Password Reset Flow
```sql
CREATE TABLE "PasswordReset" (
  userId TEXT,
  token TEXT UNIQUE,
  expiresAt TIMESTAMP,
  isUsed BOOLEAN
)
```

**Security Features:**
- One-time use tokens
- Expire after 1 hour
- Logged for audit trail
- Cannot be reused once consumed

## Security Improvements

### Before vs After

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| Session expiry | ❌ Never | ✅ 30 days | Prevents indefinite access |
| Token rotation | ❌ No | ✅ Every 7 days | Limits stolen token lifetime |
| Account status check | ❌ No | ✅ Yes | Enable account suspension |
| Login tracking | ❌ No | ✅ Yes | Detect suspicious activity |
| Rate limiting | ❌ No | ✅ 5 attempts/15min | Prevents brute force |
| Session management | ❌ No | ✅ Full tracking | View/revoke sessions |
| Password reset | ❌ Basic | ✅ Secure tokens | Prevent token reuse |

### Attack Mitigation

#### 1. Stolen Token Attack
**Before**: Token valid forever ⚠️
**After**: Token expires after 30 days, rotates every 7 days ✅

**Scenario**: Attacker steals JWT token from XSS or network sniffing
**Mitigation**: 
- Token automatically expires
- Rotation creates new token regularly
- Original token becomes invalid

#### 2. Brute Force Attack
**Before**: Unlimited login attempts ⚠️
**After**: 5 attempts per 15 minutes, account lockout ✅

**Scenario**: Attacker tries multiple passwords
**Mitigation**:
- Account locked after 5 failed attempts
- Must wait 15 minutes to try again
- All attempts logged for investigation

#### 3. Session Hijacking
**Before**: No way to revoke sessions ⚠️
**After**: Can view and revoke all sessions ✅

**Scenario**: User's session compromised
**Mitigation**:
- User can view all active sessions
- Revoke suspicious sessions
- Forced logout on password change

#### 4. Compromised Account
**Before**: No way to disable access ⚠️
**After**: Account can be deactivated ✅

**Scenario**: Account suspected of fraud or abuse
**Mitigation**:
- Admin can deactivate account
- All sessions immediately invalid
- User cannot log in until reactivated

## Implementation Details

### Cookie Security

```typescript
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token', // Secure prefix in production
    options: {
      httpOnly: true,        // Prevents JavaScript access
      sameSite: 'lax',       // CSRF protection
      secure: true,          // HTTPS only in production
      path: '/',             // Available site-wide
    },
  },
}
```

**Security Features:**
- `httpOnly`: Prevents XSS attacks from stealing tokens
- `sameSite`: Prevents CSRF attacks
- `secure`: Only sent over HTTPS
- `__Secure-` prefix: Additional browser security

### Token Structure

```typescript
{
  id: 'user-123',
  email: 'user@example.com',
  createdAt: 1704067200000,      // Token creation timestamp
  rotatedAt: 1704672000000,      // Last rotation timestamp
  emailVerified: '2024-01-01...' // Email verification status
}
```

### Error Handling

Custom error page (`/auth/error`) with specific messages:
- `TokenExpired`: Session has expired
- `CredentialsSignin`: Invalid email/password
- `AccountDeactivated`: Account is suspended
- `OAuthAccountNotLinked`: Email already registered
- And more...

## Usage Examples

### Check Account Status
```typescript
// In API route or middleware
const { data: user } = await supabase
  .from('User')
  .select('isActive')
  .eq('id', userId)
  .single()

if (!user.isActive) {
  throw new Error('Account deactivated')
}
```

### Log Login Attempt
```typescript
await supabase.rpc('log_login_attempt', {
  p_email: email,
  p_ip_address: req.ip,
  p_user_agent: req.headers['user-agent'],
  p_was_successful: true,
  p_failure_reason: null
})
```

### Revoke User Sessions
```typescript
// On password change or security event
await supabase.rpc('revoke_user_sessions', {
  p_user_id: userId
})
```

### Check Account Lockout
```typescript
const { data: isLocked } = await supabase.rpc('is_account_locked', {
  p_email: email,
  p_max_attempts: 5,
  p_lockout_minutes: 15
})

if (isLocked) {
  return res.status(429).json({ 
    error: 'Account temporarily locked due to failed login attempts' 
  })
}
```

## Monitoring & Auditing

### Login Activity Dashboard

Query for admin dashboard:
```sql
SELECT
  email,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN "wasSuccessful" THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT "wasSuccessful" THEN 1 ELSE 0 END) as failed,
  MAX("attemptedAt") as last_attempt
FROM "LoginAttempt"
WHERE "attemptedAt" > NOW() - INTERVAL '24 hours'
GROUP BY email
ORDER BY failed DESC;
```

### Active Sessions Per User
```sql
SELECT
  u.email,
  COUNT(s.id) as active_sessions,
  MAX(s."lastActivityAt") as last_activity
FROM "User" u
LEFT JOIN "Session" s ON s."userId" = u.id AND s."isActive" = true
GROUP BY u.id, u.email
HAVING COUNT(s.id) > 0
ORDER BY active_sessions DESC;
```

### Suspicious Activity Detection
```sql
-- Multiple failed logins from different IPs
SELECT
  email,
  COUNT(DISTINCT "ipAddress") as unique_ips,
  COUNT(*) as attempts
FROM "LoginAttempt"
WHERE "wasSuccessful" = false
  AND "attemptedAt" > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(DISTINCT "ipAddress") > 3;
```

## Best Practices

### 1. Always Rotate Tokens on Password Change
```typescript
// After password update
await supabase.rpc('revoke_user_sessions', { p_user_id: userId })
// User will need to log in again with new password
```

### 2. Log All Security-Relevant Events
```typescript
// Login success/failure
// Password changes
// Email changes
// Account deactivations
await logSecurityEvent('password_change', { userId, ipAddress })
```

### 3. Monitor Failed Login Attempts
Set up alerts for:
- More than 10 failed attempts per hour
- Failed attempts from multiple IPs
- Unusual geographic patterns

### 4. Implement Multi-Factor Authentication (Future)
- TOTP (Time-based One-Time Password)
- SMS verification codes
- Email verification codes
- Hardware keys (WebAuthn)

### 5. Regular Security Audits
- Review active sessions monthly
- Check for dormant accounts
- Analyze login patterns
- Test password reset flow

## Testing

### Unit Tests
```bash
npm run test tests/unit/authentication.test.ts
```

### Manual Testing Checklist
- [ ] Session expires after 30 days
- [ ] Token rotates every 7 days
- [ ] Deactivated account cannot log in
- [ ] Account locks after 5 failed attempts
- [ ] Last login timestamp updates on login
- [ ] Password reset token expires after 1 hour
- [ ] Sessions can be revoked
- [ ] Error page shows correct messages

## Migration

### Apply Migration
```bash
psql $DATABASE_URL -f migrations/20250111_auth_security_enhancements.sql
```

### Verify
```bash
# Check new columns exist
psql $DATABASE_URL -c "\d+ \"User\""

# Check tables created
psql $DATABASE_URL -c "\dt \"Session\""
psql $DATABASE_URL -c "\dt \"LoginAttempt\""
psql $DATABASE_URL -c "\dt \"PasswordReset\""
```

## Troubleshooting

### Users Logged Out Unexpectedly
- Check `maxAge` configuration
- Verify `updateAge` is refreshing sessions
- Check if sessions are being revoked

### "Token Expired" Error
- Normal after 30 days of inactivity
- User just needs to log in again
- Consider sending email reminder before expiry

### Account Locked
- Check failed login attempts in last 15 minutes
- Wait for lockout period to expire
- Or manually reset in database if legitimate user

## Future Enhancements

- [ ] Multi-factor authentication (MFA)
- [ ] OAuth provider support (Google, GitHub)
- [ ] Magic link authentication
- [ ] Biometric authentication
- [ ] Device fingerprinting
- [ ] Anomaly detection with ML
- [ ] Session activity timeline
- [ ] Trusted device management

## Related Files

- Auth configuration: `src/lib/auth.ts`
- Error page: `src/app/auth/error/page.tsx`
- Migration: `migrations/20250111_auth_security_enhancements.sql`
- Documentation: This file

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Status**: ✅ Implemented
**Priority**: 🚨 Critical
**Impact**: High (prevents account takeover)
**Complexity**: Medium
**Maintenance**: Low (automatic)

