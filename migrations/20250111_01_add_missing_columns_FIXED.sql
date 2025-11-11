-- Migration: Add Missing Columns to Existing Tables
-- This must be run BEFORE the performance indexes migration
-- SIMPLIFIED VERSION - Adds only essential columns

-- ============================================================================
-- STEP 1: ADD MISSING COLUMNS TO User TABLE
-- ============================================================================

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "credits" INTEGER DEFAULT 10;

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE';

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;

-- ============================================================================
-- STEP 2: CREATE ORGANIZATION TABLE (without complex RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."Organization" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  "ownerId" TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  "brandKit" JSONB,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE ORGANIZATION MEMBER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."OrganizationMember" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  "isActive" BOOLEAN DEFAULT true,
  "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("organizationId", "userId")
);

-- ============================================================================
-- STEP 4: ADD COLUMNS TO QrCode TABLE (in order of dependencies)
-- ============================================================================

-- Basic columns (no dependencies)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isDynamic" BOOLEAN DEFAULT false;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "scanCount" INTEGER DEFAULT 0;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "dynamicContent" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "maxScans" INTEGER;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "redirectUrl" TEXT;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "lastScannedAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "originalUrl" TEXT;

-- Advanced features
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "shape" TEXT;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "template" TEXT;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "eyePattern" TEXT;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "gradient" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "sticker" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "effects" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "customStyling" JSONB;

-- Bulk management
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isBulkManaged" BOOLEAN DEFAULT false;

-- Advanced routing
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "deviceRedirection" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "geoRedirection" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "marketingPixels" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "abTestConfig" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "customDomain" TEXT;

-- Organization reference (NOW Organization table exists)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add foreign key constraint separately (safer)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'qrcode_organizationid_fkey'
  ) THEN
    ALTER TABLE public."QrCode" 
    ADD CONSTRAINT qrcode_organizationid_fkey 
    FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE OTHER ESSENTIAL TABLES
-- ============================================================================

-- API Key Table
CREATE TABLE IF NOT EXISTS public."ApiKey" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "keyHash" TEXT NOT NULL UNIQUE,
  "lastUsedAt" TIMESTAMP WITH TIME ZONE,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan Table
CREATE TABLE IF NOT EXISTS public."Scan" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "qrCodeId" TEXT REFERENCES public."QrCode"(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  device TEXT,
  country TEXT,
  city TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Table
CREATE TABLE IF NOT EXISTS public."Payment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  "subscriptionId" TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  "externalPaymentId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS public."AuditLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  "resourceType" TEXT,
  "resourceId" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Table
CREATE TABLE IF NOT EXISTS public."Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom Domain Table
CREATE TABLE IF NOT EXISTS public."CustomDomain" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  "isVerified" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Rate Limit Table
CREATE TABLE IF NOT EXISTS public."ApiRateLimit" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL,
  route TEXT NOT NULL,
  "requestCount" INTEGER DEFAULT 0,
  "windowStart" TIMESTAMP WITH TIME ZONE NOT NULL,
  "lastRequestAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metric Tables
CREATE TABLE IF NOT EXISTS public."Metric" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  labels JSONB,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."RequestMetric" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "correlationId" TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "responseTime" INTEGER NOT NULL,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk Group Table
CREATE TABLE IF NOT EXISTS public."QrCodeBulkGroup" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  "groupName" TEXT,
  "operationType" TEXT NOT NULL,
  "totalCount" INTEGER DEFAULT 0,
  "processedCount" INTEGER DEFAULT 0,
  "failedCount" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  results JSONB,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DONE - All columns and tables created!
-- ============================================================================

SELECT 'Migration completed successfully! You can now apply the performance indexes migration.' as message;

