-- Performance and Reliability Migration
-- Adds background jobs, webhook queue, and performance optimizations

-- Background Jobs table
CREATE TABLE IF NOT EXISTS public."BackgroundJob" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobType" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  "priority" INTEGER DEFAULT 0,
  "payload" JSONB NOT NULL,
  "result" JSONB,
  "error" TEXT,
  "retries" INTEGER DEFAULT 0,
  "maxRetries" INTEGER DEFAULT 3,
  "runAfter" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "startedAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Outbox table (Queue Outbox Pattern)
CREATE TABLE IF NOT EXISTS public."WebhookOutbox" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
  "webhookUrl" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "secret" TEXT,
  "status" TEXT DEFAULT 'pending', -- pending, processing, delivered, failed
  "attempts" INTEGER DEFAULT 0,
  "maxAttempts" INTEGER DEFAULT 5,
  "nextRetryAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastAttemptAt" TIMESTAMP WITH TIME ZONE,
  "lastError" TEXT,
  "deliveredAt" TIMESTAMP WITH TIME ZONE,
  "responseStatus" INTEGER,
  "responseBody" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_background_job_status ON public."BackgroundJob"("status", "runAfter");
CREATE INDEX IF NOT EXISTS idx_background_job_type ON public."BackgroundJob"("jobType");
CREATE INDEX IF NOT EXISTS idx_background_job_priority ON public."BackgroundJob"("priority", "runAfter");
CREATE INDEX IF NOT EXISTS idx_webhook_outbox_status ON public."WebhookOutbox"("status", "nextRetryAt");
CREATE INDEX IF NOT EXISTS idx_webhook_outbox_qrcode_id ON public."WebhookOutbox"("qrCodeId");
CREATE INDEX IF NOT EXISTS idx_webhook_outbox_created_at ON public."WebhookOutbox"("createdAt");

-- Enable Row Level Security
ALTER TABLE public."BackgroundJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebhookOutbox" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own background jobs" ON public."BackgroundJob"
  FOR SELECT USING (
    ("payload"->>'userId')::text = auth.uid()::text
  );

CREATE POLICY "Users can view their own webhook outbox" ON public."WebhookOutbox"
  FOR SELECT USING (
    "qrCodeId" IN (
      SELECT id FROM public."QrCode" WHERE "userId" = auth.uid()
    )
  );

-- Function to get next job to process
CREATE OR REPLACE FUNCTION public.get_next_background_job()
RETURNS TABLE (
  id TEXT,
  "jobType" TEXT,
  payload JSONB,
  "maxRetries" INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bj.id,
    bj."jobType",
    bj.payload,
    bj."maxRetries"
  FROM public."BackgroundJob" bj
  WHERE bj."status" = 'pending'
    AND bj."runAfter" <= NOW()
  ORDER BY bj."priority" DESC, bj."createdAt" ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Function to get next webhook to retry
CREATE OR REPLACE FUNCTION public.get_next_webhook_retry()
RETURNS TABLE (
  id TEXT,
  "qrCodeId" TEXT,
  "webhookUrl" TEXT,
  payload JSONB,
  secret TEXT,
  attempts INTEGER,
  "maxAttempts" INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wo.id,
    wo."qrCodeId",
    wo."webhookUrl",
    wo.payload,
    wo.secret,
    wo.attempts,
    wo."maxAttempts"
  FROM public."WebhookOutbox" wo
  WHERE wo."status" IN ('pending', 'failed')
    AND wo."nextRetryAt" <= NOW()
    AND wo.attempts < wo."maxAttempts"
  ORDER BY wo."createdAt" ASC
  LIMIT 10
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Function to update webhook outbox status
CREATE OR REPLACE FUNCTION public.update_webhook_outbox_status(
  outbox_id TEXT,
  new_status TEXT,
  response_status INTEGER DEFAULT NULL,
  response_body TEXT DEFAULT NULL,
  error_message TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  current_attempts INTEGER;
  current_max_attempts INTEGER;
BEGIN
  -- Get current attempts and max attempts
  SELECT attempts, "maxAttempts" INTO current_attempts, current_max_attempts
  FROM public."WebhookOutbox"
  WHERE id = outbox_id;
  
  UPDATE public."WebhookOutbox"
  SET
    "status" = new_status,
    "attempts" = current_attempts + 1,
    "lastAttemptAt" = NOW(),
    "updatedAt" = NOW(),
    "responseStatus" = COALESCE(response_status, "responseStatus"),
    "responseBody" = COALESCE(response_body, "responseBody"),
    "lastError" = COALESCE(error_message, "lastError"),
    "deliveredAt" = CASE WHEN new_status = 'delivered' THEN NOW() ELSE "deliveredAt" END,
    "nextRetryAt" = CASE
      WHEN new_status = 'failed' AND (current_attempts + 1) < current_max_attempts THEN
        NOW() + (INTERVAL '1 minute' * POWER(2, current_attempts + 1))
      ELSE "nextRetryAt"
    END
  WHERE id = outbox_id;
END;
$$ LANGUAGE plpgsql;

