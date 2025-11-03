-- API Keys and Usage Metering Schema
-- This migration adds API key management, scopes, rotation, and usage metering

-- API Keys table
CREATE TABLE IF NOT EXISTS public."ApiKey" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL, -- First 8 chars of key for display (e.g., "sk_live_")
  "keyHash" TEXT NOT NULL, -- Hashed full key
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- Array of permissions: 'qr:read', 'qr:write', 'qr:delete', 'scan:read', 'webhook:read', 'webhook:write', 'webhook:delete'
  "lastUsedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "rotatedFromId" TEXT REFERENCES public."ApiKey"(id), -- For key rotation tracking
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    ("userId" IS NOT NULL AND "organizationId" IS NULL) OR
    ("userId" IS NULL AND "organizationId" IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_apikey_user ON public."ApiKey"("userId");
CREATE INDEX IF NOT EXISTS idx_apikey_org ON public."ApiKey"("organizationId");
CREATE INDEX IF NOT EXISTS idx_apikey_key_hash ON public."ApiKey"("keyHash");
CREATE INDEX IF NOT EXISTS idx_apikey_active ON public."ApiKey"("isActive") WHERE "isActive" = true;

-- API Usage Logs table
CREATE TABLE IF NOT EXISTS public."ApiUsageLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "apiKeyId" TEXT NOT NULL REFERENCES public."ApiKey"(id) ON DELETE CASCADE,
  "userId" TEXT, -- Denormalized for faster queries
  "organizationId" TEXT, -- Denormalized for faster queries
  endpoint TEXT NOT NULL, -- e.g., '/api/v1/qr-codes', '/api/v1/scans'
  method TEXT NOT NULL, -- 'GET', 'POST', 'PUT', 'DELETE'
  "statusCode" INTEGER NOT NULL,
  "requestSize" INTEGER DEFAULT 0, -- Bytes
  "responseSize" INTEGER DEFAULT 0, -- Bytes
  "responseTime" INTEGER DEFAULT 0, -- Milliseconds
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_log_key ON public."ApiUsageLog"("apiKeyId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_user ON public."ApiUsageLog"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_org ON public."ApiUsageLog"("organizationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_endpoint ON public."ApiUsageLog"("endpoint", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created ON public."ApiUsageLog"("createdAt" DESC);

-- API Usage Aggregates table (for faster queries)
CREATE TABLE IF NOT EXISTS public."ApiUsageAggregate" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "apiKeyId" TEXT NOT NULL REFERENCES public."ApiKey"(id) ON DELETE CASCADE,
  "userId" TEXT,
  "organizationId" TEXT,
  "periodDate" DATE NOT NULL, -- YYYY-MM-DD
  "requestCount" INTEGER DEFAULT 0,
  "errorCount" INTEGER DEFAULT 0,
  "totalResponseTime" BIGINT DEFAULT 0, -- Sum of response times in ms
  "totalRequestSize" BIGINT DEFAULT 0, -- Sum of request sizes in bytes
  "totalResponseSize" BIGINT DEFAULT 0, -- Sum of response sizes in bytes
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("apiKeyId", "periodDate")
);

CREATE INDEX IF NOT EXISTS idx_api_usage_agg_key ON public."ApiUsageAggregate"("apiKeyId", "periodDate" DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_agg_user ON public."ApiUsageAggregate"("userId", "periodDate" DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_agg_org ON public."ApiUsageAggregate"("organizationId", "periodDate" DESC);

-- Enable Row Level Security
ALTER TABLE public."ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ApiUsageLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ApiUsageAggregate" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ApiKey
CREATE POLICY "Users can view their own API keys" ON public."ApiKey"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can create their own API keys" ON public."ApiKey"
  FOR INSERT WITH CHECK (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text AND "role" IN ('Owner', 'Admin')
    )
  );

CREATE POLICY "Users can update their own API keys" ON public."ApiKey"
  FOR UPDATE USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text AND "role" IN ('Owner', 'Admin')
    )
  );

CREATE POLICY "Users can delete their own API keys" ON public."ApiKey"
  FOR DELETE USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text AND "role" IN ('Owner', 'Admin')
    )
  );

-- RLS Policies for ApiUsageLog
CREATE POLICY "Users can view their own API usage logs" ON public."ApiUsageLog"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text
    )
  );

-- RLS Policies for ApiUsageAggregate
CREATE POLICY "Users can view their own API usage aggregates" ON public."ApiUsageAggregate"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text
    )
  );

-- Function to aggregate usage logs (runs daily)
CREATE OR REPLACE FUNCTION public.aggregate_api_usage()
RETURNS void AS $$
BEGIN
  INSERT INTO public."ApiUsageAggregate" (
    "apiKeyId",
    "userId",
    "organizationId",
    "periodDate",
    "requestCount",
    "errorCount",
    "totalResponseTime",
    "totalRequestSize",
    "totalResponseSize"
  )
  SELECT
    "apiKeyId",
    "userId",
    "organizationId",
    DATE("createdAt") AS "periodDate",
    COUNT(*) AS "requestCount",
    COUNT(*) FILTER (WHERE "statusCode" >= 400) AS "errorCount",
    SUM("responseTime") AS "totalResponseTime",
    SUM("requestSize") AS "totalRequestSize",
    SUM("responseSize") AS "totalResponseSize"
  FROM public."ApiUsageLog"
  WHERE DATE("createdAt") < CURRENT_DATE -- Only aggregate past days
  AND DATE("createdAt") NOT IN (
    SELECT "periodDate" FROM public."ApiUsageAggregate"
    WHERE "apiKeyId" = "ApiUsageLog"."apiKeyId"
  )
  GROUP BY "apiKeyId", "userId", "organizationId", DATE("createdAt")
  ON CONFLICT ("apiKeyId", "periodDate") DO UPDATE SET
    "requestCount" = EXCLUDED."requestCount",
    "errorCount" = EXCLUDED."errorCount",
    "totalResponseTime" = EXCLUDED."totalResponseTime",
    "totalRequestSize" = EXCLUDED."totalRequestSize",
    "totalResponseSize" = EXCLUDED."totalResponseSize",
    "updatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old usage logs (keep last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_api_usage_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public."ApiUsageLog"
  WHERE "createdAt" < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

