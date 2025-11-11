-- Migration: Add Missing Columns to Existing Tables
-- This must be run BEFORE the performance indexes migration
-- Adds all columns that are referenced in the application but may not exist yet

-- ============================================================================
-- CREATE ORGANIZATION TABLE FIRST (needed for foreign keys)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."Organization" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  "ownerId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "brandKit" JSONB,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Organization
CREATE POLICY "Users can view organizations they are members of" ON public."Organization"
  FOR SELECT USING (
    "ownerId" = auth.uid()::text OR
    id IN (
      SELECT "organizationId" FROM public."OrganizationMember" 
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Owners can update their organizations" ON public."Organization"
  FOR UPDATE USING ("ownerId" = auth.uid()::text);

-- ============================================================================
-- CREATE ORGANIZATION MEMBER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."OrganizationMember" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  "isActive" BOOLEAN DEFAULT true,
  "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("organizationId", "userId")
);

-- Enable RLS
ALTER TABLE public."OrganizationMember" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for OrganizationMember
CREATE POLICY "Users can view their own memberships" ON public."OrganizationMember"
  FOR SELECT USING ("userId" = auth.uid()::text);

-- ============================================================================
-- NOW ADD MISSING COLUMNS TO QrCode TABLE
-- ============================================================================

-- Organization support (now Organization table exists!)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE SET NULL;

-- Dynamic QR features
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isDynamic" BOOLEAN DEFAULT false;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "dynamicContent" JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "maxScans" INTEGER;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "redirectUrl" TEXT;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "scanCount" INTEGER DEFAULT 0;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "lastScannedAt" TIMESTAMP WITH TIME ZONE;

-- Advanced QR features
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

-- Bulk management
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isBulkManaged" BOOLEAN DEFAULT false;

-- Advanced routing features
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

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "originalUrl" TEXT;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "customStyling" JSONB;

-- ============================================================================
-- ADD MISSING COLUMNS TO User TABLE
-- ============================================================================

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "credits" INTEGER DEFAULT 10;

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE';

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

-- ============================================================================
-- CREATE ORGANIZATION TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."Organization" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  "ownerId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "brandKit" JSONB,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Organization
CREATE POLICY "Users can view organizations they are members of" ON public."Organization"
  FOR SELECT USING (
    "ownerId" = auth.uid()::text OR
    id IN (
      SELECT "organizationId" FROM public."OrganizationMember" 
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Owners can update their organizations" ON public."Organization"
  FOR UPDATE USING ("ownerId" = auth.uid()::text);

-- ============================================================================
-- CREATE ORGANIZATION MEMBER TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."OrganizationMember" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  "isActive" BOOLEAN DEFAULT true,
  "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("organizationId", "userId")
);

-- Enable RLS
ALTER TABLE public."OrganizationMember" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for OrganizationMember
CREATE POLICY "Users can view their own memberships" ON public."OrganizationMember"
  FOR SELECT USING ("userId" = auth.uid()::text);

-- ============================================================================
-- CREATE API KEY TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."ApiKey" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "keyHash" TEXT NOT NULL UNIQUE,
  "lastUsedAt" TIMESTAMP WITH TIME ZONE,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."ApiKey" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE SCAN TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."Scan" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  device TEXT,
  country TEXT,
  city TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."Scan" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE PAYMENT TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."Payment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "subscriptionId" TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  "externalPaymentId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE AUDIT LOG TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."AuditLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  "resourceType" TEXT,
  "resourceId" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE NOTIFICATION TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE CUSTOM DOMAIN TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."CustomDomain" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  "isVerified" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."CustomDomain" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE API RATE LIMIT TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."ApiRateLimit" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL,
  route TEXT NOT NULL,
  "requestCount" INTEGER DEFAULT 0,
  "windowStart" TIMESTAMP WITH TIME ZONE NOT NULL,
  "lastRequestAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE METRIC TABLES IF NOT EXISTS
-- ============================================================================

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

-- ============================================================================
-- CREATE BULK GROUP TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."QrCodeBulkGroup" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "groupName" TEXT,
  "operationType" TEXT NOT NULL,
  "totalCount" INTEGER DEFAULT 0,
  "processedCount" INTEGER DEFAULT 0,
  "failedCount" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  results JSONB,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."QrCodeBulkGroup" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- UPDATE TABLE STATISTICS
-- ============================================================================

ANALYZE public."QrCode";
ANALYZE public."User";
ANALYZE public."Organization";

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All missing columns and tables have been added successfully!';
  RAISE NOTICE 'You can now apply the performance indexes migration.';
END $$;

