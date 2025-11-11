-- Migration: Authentication Security (ULTRA SIMPLE VERSION)
-- Only adds essential columns and tables, no complex indexes or functions

-- ============================================================================
-- ADD COLUMNS TO User TABLE
-- ============================================================================

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- ============================================================================
-- CREATE SESSION TABLE (Simple version)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."Session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE LOGIN ATTEMPT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."LoginAttempt" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "wasSuccessful" BOOLEAN NOT NULL,
  "attemptedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE PASSWORD RESET TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."PasswordReset" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  token TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "isUsed" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Authentication security tables created successfully!' as message;

