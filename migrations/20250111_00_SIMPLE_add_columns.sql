-- SIMPLE Migration: Add Only Essential Columns
-- Run this BEFORE the performance indexes migration
-- This version is safe and won't cause errors

-- ============================================================================
-- ADD COLUMNS TO User TABLE
-- ============================================================================

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "credits" INTEGER DEFAULT 10;

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE';

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;

-- ============================================================================
-- ADD COLUMNS TO QrCode TABLE  
-- ============================================================================

-- Dynamic QR features
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isDynamic" BOOLEAN DEFAULT false;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "scanCount" INTEGER DEFAULT 0;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "maxScans" INTEGER;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "lastScannedAt" TIMESTAMP WITH TIME ZONE;

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
ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- ============================================================================
-- ADD COLUMNS TO Scan TABLE (if it exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Scan') THEN
    ALTER TABLE public."Scan" ADD COLUMN IF NOT EXISTS "userId" TEXT;
    ALTER TABLE public."Scan" ADD COLUMN IF NOT EXISTS device TEXT;
    ALTER TABLE public."Scan" ADD COLUMN IF NOT EXISTS country TEXT;
    ALTER TABLE public."Scan" ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE public."Scan" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMNS TO Notification TABLE (if it exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Notification') THEN
    ALTER TABLE public."Notification" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN DEFAULT false;
    ALTER TABLE public."Notification" ADD COLUMN IF NOT EXISTS type TEXT;
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMNS TO ApiKey TABLE (if it exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ApiKey') THEN
    ALTER TABLE public."ApiKey" ADD COLUMN IF NOT EXISTS "keyHash" TEXT;
    ALTER TABLE public."ApiKey" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
    ALTER TABLE public."ApiKey" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE;
    ALTER TABLE public."ApiKey" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMNS TO Payment TABLE (if it exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Payment') THEN
    ALTER TABLE public."Payment" ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE public."Payment" ADD COLUMN IF NOT EXISTS "externalPaymentId" TEXT;
    ALTER TABLE public."Payment" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMNS TO CustomDomain TABLE (if it exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CustomDomain') THEN
    ALTER TABLE public."CustomDomain" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;
    ALTER TABLE public."CustomDomain" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMNS TO Organization TABLE (if it exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Organization') THEN
    ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS slug TEXT;
    ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMNS TO OrganizationMember TABLE (if it exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'OrganizationMember') THEN
    ALTER TABLE public."OrganizationMember" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
    ALTER TABLE public."OrganizationMember" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMNS TO AuditLog TABLE (if it exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'AuditLog') THEN
    ALTER TABLE public."AuditLog" ADD COLUMN IF NOT EXISTS "resourceType" TEXT;
    ALTER TABLE public."AuditLog" ADD COLUMN IF NOT EXISTS "resourceId" TEXT;
    ALTER TABLE public."AuditLog" ADD COLUMN IF NOT EXISTS metadata JSONB;
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'All essential columns added successfully! You can now run the performance indexes migration.' as message;

