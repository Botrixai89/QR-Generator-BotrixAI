-- Migration: Authentication Security Enhancements (SAFE VERSION)
-- Adds session management, token rotation, and account status tracking

-- ============================================================================
-- STEP 1: ADD COLUMNS TO User TABLE
-- ============================================================================

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- ============================================================================
-- STEP 2: CREATE SIMPLE INDEXES ON User TABLE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_is_active 
ON public."User"("isActive");

CREATE INDEX IF NOT EXISTS idx_user_last_login 
ON public."User"("lastLoginAt" DESC);

-- ============================================================================
-- STEP 3: CREATE SESSION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."Session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE SESSION INDEXES (After table creation)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_session_user_id 
ON public."Session"("userId");

CREATE INDEX IF NOT EXISTS idx_session_token 
ON public."Session"("sessionToken");

CREATE INDEX IF NOT EXISTS idx_session_expires_at 
ON public."Session"("expiresAt");

CREATE INDEX IF NOT EXISTS idx_session_last_activity 
ON public."Session"("lastActivityAt" DESC);

-- ============================================================================
-- STEP 5: CREATE LOGIN ATTEMPT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."LoginAttempt" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT,
  "wasSuccessful" BOOLEAN NOT NULL,
  "failureReason" TEXT,
  "attemptedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: CREATE LOGIN ATTEMPT INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_login_attempt_email 
ON public."LoginAttempt"(email, "attemptedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempt_ip 
ON public."LoginAttempt"("ipAddress", "attemptedAt" DESC);

-- ============================================================================
-- STEP 7: CREATE PASSWORD RESET TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."PasswordReset" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "isUsed" BOOLEAN DEFAULT false,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "usedAt" TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- STEP 8: CREATE PASSWORD RESET INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_password_reset_token 
ON public."PasswordReset"(token);

CREATE INDEX IF NOT EXISTS idx_password_reset_user 
ON public."PasswordReset"("userId", "createdAt" DESC);

-- ============================================================================
-- STEP 9: CREATE SECURITY FUNCTIONS
-- ============================================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public."Session"
  SET "isActive" = false,
      "updatedAt" = NOW()
  WHERE "expiresAt" < NOW()
    AND "isActive" = true;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all user sessions
CREATE OR REPLACE FUNCTION public.revoke_user_sessions(p_user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public."Session"
  SET "isActive" = false,
      "updatedAt" = NOW()
  WHERE "userId" = p_user_id
    AND "isActive" = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get active session count
CREATE OR REPLACE FUNCTION public.get_user_session_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public."Session"
  WHERE "userId" = p_user_id
    AND "isActive" = true
    AND "expiresAt" > NOW();
    
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(
  p_email TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_lockout_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  v_failed_attempts INTEGER;
  v_last_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT COUNT(*), MAX("attemptedAt")
  INTO v_failed_attempts, v_last_attempt
  FROM public."LoginAttempt"
  WHERE email = p_email
    AND "wasSuccessful" = false
    AND "attemptedAt" > NOW() - (p_lockout_minutes || ' minutes')::INTERVAL;
  
  IF v_failed_attempts >= p_max_attempts THEN
    IF v_last_attempt > NOW() - (p_lockout_minutes || ' minutes')::INTERVAL THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to log login attempt
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_was_successful BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public."LoginAttempt" (
    email,
    "ipAddress",
    "userAgent",
    "wasSuccessful",
    "failureReason"
  )
  VALUES (
    p_email,
    p_ip_address,
    p_user_agent,
    p_was_successful,
    p_failure_reason
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Authentication security enhancements applied successfully!' as message;

