-- Migration: Performance Indexes (MINIMAL SAFE VERSION)
-- Only creates indexes on columns that exist in base tables
-- Safe to run without any prerequisites

-- ============================================================================
-- USER TABLE INDEXES (Base table - always exists)
-- ============================================================================

-- Index for email lookups (probably already exists, but safe to try)
CREATE INDEX IF NOT EXISTS idx_user_email 
ON public."User"(email);

-- Index for created at
CREATE INDEX IF NOT EXISTS idx_user_created_at 
ON public."User"("createdAt" DESC);

-- ============================================================================
-- QRCODE TABLE INDEXES (Base table - always exists)
-- ============================================================================

-- Index for user's QR codes (most common query)
CREATE INDEX IF NOT EXISTS idx_qrcode_user_id 
ON public."QrCode"("userId");

-- Composite index for user + creation date (dashboard query)
CREATE INDEX IF NOT EXISTS idx_qrcode_user_created 
ON public."QrCode"("userId", "createdAt" DESC);

-- Index for creation date (sorting)
CREATE INDEX IF NOT EXISTS idx_qrcode_created_at 
ON public."QrCode"("createdAt" DESC);

-- Index for URL lookups (duplicate detection)
CREATE INDEX IF NOT EXISTS idx_qrcode_url 
ON public."QrCode"(url);

-- Index for title searches
CREATE INDEX IF NOT EXISTS idx_qrcode_title 
ON public."QrCode"(title);

-- ============================================================================
-- CONDITIONAL INDEXES (only if columns exist)
-- ============================================================================

-- Index for organizationId (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'QrCode' AND column_name = 'organizationId'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_qrcode_organization_id 
    ON public."QrCode"("organizationId") 
    WHERE "organizationId" IS NOT NULL;
  END IF;
END $$;

-- Index for isDynamic (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'QrCode' AND column_name = 'isDynamic'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_qrcode_is_dynamic 
    ON public."QrCode"("isDynamic") 
    WHERE "isDynamic" = true;
  END IF;
END $$;

-- Index for expiresAt (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'QrCode' AND column_name = 'expiresAt'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_qrcode_expires_at 
    ON public."QrCode"("expiresAt") 
    WHERE "expiresAt" IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- SCAN TABLE INDEXES (if table exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Scan') THEN
    -- Composite index for scan analytics
    CREATE INDEX IF NOT EXISTS idx_scan_qrcode_created 
    ON public."Scan"("qrCodeId", "createdAt" DESC);
    
    -- Index for created at
    CREATE INDEX IF NOT EXISTS idx_scan_created_at 
    ON public."Scan"("createdAt" DESC);
  END IF;
END $$;

-- Index for country (if column exists in Scan table)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Scan' AND column_name = 'country'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_scan_country 
    ON public."Scan"("country") 
    WHERE "country" IS NOT NULL;
  END IF;
END $$;

-- Index for device (if column exists in Scan table)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Scan' AND column_name = 'device'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_scan_device 
    ON public."Scan"("device") 
    WHERE "device" IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- UPDATE STATISTICS
-- ============================================================================

ANALYZE public."User";
ANALYZE public."QrCode";

-- Analyze other tables if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Scan') THEN
    EXECUTE 'ANALYZE public."Scan"';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Organization') THEN
    EXECUTE 'ANALYZE public."Organization"';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Essential performance indexes created successfully!' as message;
SELECT COUNT(*) || ' indexes created' as summary 
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

