-- Observability Migration
-- This migration adds tables for centralized logging, metrics, and system health monitoring

-- System Logs table (for centralized logging with correlation IDs)
CREATE TABLE IF NOT EXISTS public."SystemLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  level TEXT NOT NULL, -- 'debug', 'info', 'warn', 'error', 'fatal'
  message TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  context JSONB,
  error JSONB, -- { name, message, stack }
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_log_level ON public."SystemLog"(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_log_correlation ON public."SystemLog"("correlationId");
CREATE INDEX IF NOT EXISTS idx_system_log_timestamp ON public."SystemLog"(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_log_level_timestamp ON public."SystemLog"(level, timestamp DESC);

-- Metrics table (for collecting application metrics)
CREATE TABLE IF NOT EXISTS public."Metric" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, -- 'request_rate', 'error_rate', 'latency', 'payment_conversion', 'churn', 'ltv'
  value NUMERIC NOT NULL,
  labels JSONB, -- Additional context (endpoint, status, etc.)
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metric_name ON public."Metric"(name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metric_timestamp ON public."Metric"(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metric_name_timestamp ON public."Metric"(name, timestamp DESC);

-- Request Metrics table (for tracking API requests)
CREATE TABLE IF NOT EXISTS public."RequestMetric" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "correlationId" TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "responseTime" INTEGER NOT NULL, -- milliseconds
  "requestSize" INTEGER DEFAULT 0, -- bytes
  "responseSize" INTEGER DEFAULT 0, -- bytes
  "userId" TEXT,
  "organizationId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_metric_endpoint ON public."RequestMetric"(endpoint, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_request_metric_status ON public."RequestMetric"("statusCode", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_request_metric_correlation ON public."RequestMetric"("correlationId");
CREATE INDEX IF NOT EXISTS idx_request_metric_timestamp ON public."RequestMetric"("createdAt" DESC);

-- Enable RLS
ALTER TABLE public."SystemLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Metric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RequestMetric" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin access only for SystemLog and Metric
CREATE POLICY "Admins can view system logs" ON public."SystemLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND "role" = 'admin'
    )
  );

CREATE POLICY "Admins can view metrics" ON public."Metric"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND "role" = 'admin'
    )
  );

CREATE POLICY "Admins can view request metrics" ON public."RequestMetric"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND "role" = 'admin'
    )
  );

-- Cleanup function for old logs (retention: 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public."SystemLog"
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  DELETE FROM public."RequestMetric"
  WHERE "createdAt" < NOW() - INTERVAL '90 days';
  
  -- Keep only last 30 days of metrics
  DELETE FROM public."Metric"
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

