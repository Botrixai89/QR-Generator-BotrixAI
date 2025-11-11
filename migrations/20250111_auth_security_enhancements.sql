-- Migration: Authentication Security Enhancements
-- Adds session management, token rotation, and account status tracking

-- Add lastLoginAt column to track user login activity
ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP WITH TIME ZONE;

-- Add isActive column for account deactivation
ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Create index for active users
CREATE INDEX IF NOT EXISTS idx_user_is_active 
ON public."User"("isActive") 
WHERE "isActive" = true;

-- Create index for last login tracking
CREATE INDEX IF NOT EXISTS idx_user_last_login 
ON public."User"("lastLoginAt" DESC) 
WHERE "lastLoginAt" IS NOT NULL;

-- Create Session table for tracking active sessions (optional enhancement)
CREATE TABLE IF NOT EXISTS public."Session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceInfo" JSONB,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for session management
CREATE INDEX IF NOT EXISTS idx_session_user_id 
ON public."Session"("userId", "isActive") 
WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_session_token 
ON public."Session"("sessionToken") 
WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_session_expires_at 
ON public."Session"("expiresAt") 
WHERE "isActive" = true AND "expiresAt" > NOW();

CREATE INDEX IF NOT EXISTS idx_session_last_activity 
ON public."Session"("lastActivityAt" DESC);

-- Enable Row Level Security on Session table
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Session table
CREATE POLICY "Users can view own sessions" ON public."Session"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own sessions" ON public."Session"
  FOR DELETE USING ("userId" = auth.uid()::text);

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

-- Function to revoke all user sessions (for security)
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

-- Function to get active session count per user
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

-- Create LoginAttempt table for rate limiting and security
CREATE TABLE IF NOT EXISTS public."LoginAttempt" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT,
  "wasSuccessful" BOOLEAN NOT NULL,
  "failureReason" TEXT,
  "attemptedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for login attempt tracking
CREATE INDEX IF NOT EXISTS idx_login_attempt_email 
ON public."LoginAttempt"(email, "attemptedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempt_ip 
ON public."LoginAttempt"("ipAddress", "attemptedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempt_failed 
ON public."LoginAttempt"(email, "wasSuccessful", "attemptedAt" DESC) 
WHERE "wasSuccessful" = false;

-- Enable Row Level Security on LoginAttempt table
ALTER TABLE public."LoginAttempt" ENABLE ROW LEVEL SECURITY;

-- Admin only access to login attempts
CREATE POLICY "Only admins can view login attempts" ON public."LoginAttempt"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()::text
      AND "plan" IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Function to check if account is locked due to failed login attempts
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
  -- Count failed attempts in the last N minutes
  SELECT COUNT(*), MAX("attemptedAt")
  INTO v_failed_attempts, v_last_attempt
  FROM public."LoginAttempt"
  WHERE email = p_email
    AND "wasSuccessful" = false
    AND "attemptedAt" > NOW() - (p_lockout_minutes || ' minutes')::INTERVAL;
  
  -- If we have max or more failed attempts, check if still within lockout window
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

-- Create PasswordReset table for secure password reset
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

-- Create indexes for password reset
CREATE INDEX IF NOT EXISTS idx_password_reset_token 
ON public."PasswordReset"(token) 
WHERE "isUsed" = false AND "expiresAt" > NOW();

CREATE INDEX IF NOT EXISTS idx_password_reset_user 
ON public."PasswordReset"("userId", "createdAt" DESC);

-- Enable Row Level Security
ALTER TABLE public."PasswordReset" ENABLE ROW LEVEL SECURITY;

-- Users can only view their own password reset tokens
CREATE POLICY "Users can view own password resets" ON public."PasswordReset"
  FOR SELECT USING ("userId" = auth.uid()::text);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_user_sessions TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_session_count TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_session_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_account_locked TO service_role;
GRANT EXECUTE ON FUNCTION public.log_login_attempt TO service_role;

-- Add comments
COMMENT ON TABLE public."Session" IS 'Tracks active user sessions for security and auditing';
COMMENT ON TABLE public."LoginAttempt" IS 'Logs all login attempts for security monitoring and rate limiting';
COMMENT ON TABLE public."PasswordReset" IS 'Manages secure password reset tokens';
COMMENT ON FUNCTION public.cleanup_expired_sessions IS 'Marks expired sessions as inactive';
COMMENT ON FUNCTION public.revoke_user_sessions IS 'Revokes all active sessions for a user';
COMMENT ON FUNCTION public.is_account_locked IS 'Checks if account is locked due to failed login attempts';
COMMENT ON FUNCTION public.log_login_attempt IS 'Logs a login attempt for security monitoring';

-- Update statistics
ANALYZE public."User";
ANALYZE public."Session";
ANALYZE public."LoginAttempt";
ANALYZE public."PasswordReset";

