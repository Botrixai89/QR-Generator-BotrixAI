-- Audit Logs and Security Schema
-- This migration adds audit logging for sensitive actions and security enhancements

-- Audit Logs table
CREATE TABLE IF NOT EXISTS public."AuditLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'api_key_create', 'api_key_delete', 'api_key_rotate', 'billing_update', 'domain_change', 'user_delete', 'data_export', 'password_change'
  resourceType TEXT NOT NULL, -- 'user', 'api_key', 'billing', 'domain', 'qr_code', 'organization'
  "resourceId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "requestMethod" TEXT, -- 'GET', 'POST', 'PUT', 'DELETE', etc.
  "requestPath" TEXT,
  "metadata" JSONB, -- Additional context data
  "success" BOOLEAN DEFAULT true,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public."AuditLog"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON public."AuditLog"("organizationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public."AuditLog"("action", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON public."AuditLog"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public."AuditLog"("createdAt" DESC);

-- Data Export Requests table (for GDPR compliance)
CREATE TABLE IF NOT EXISTS public."DataExportRequest" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "format" TEXT NOT NULL DEFAULT 'json', -- 'json', 'csv'
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  "fileUrl" TEXT, -- URL to download the export file
  "expiresAt" TIMESTAMPTZ NOT NULL, -- Expires after 7 days
  "requestedAt" TIMESTAMPTZ DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  "errorMessage" TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_export_user ON public."DataExportRequest"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_data_export_status ON public."DataExportRequest"("status");

-- Data Deletion Requests table (for GDPR compliance)
CREATE TABLE IF NOT EXISTS public."DataDeletionRequest" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  "confirmationToken" TEXT UNIQUE NOT NULL, -- Token to confirm deletion
  "requestedAt" TIMESTAMPTZ DEFAULT NOW(),
  "confirmedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "errorMessage" TEXT,
  "metadata" JSONB -- Store what was deleted for audit
);

CREATE INDEX IF NOT EXISTS idx_data_deletion_user ON public."DataDeletionRequest"("userId");
CREATE INDEX IF NOT EXISTS idx_data_deletion_status ON public."DataDeletionRequest"("status");
CREATE INDEX IF NOT EXISTS idx_data_deletion_token ON public."DataDeletionRequest"("confirmationToken");

-- Secrets table (encrypted at application level)
CREATE TABLE IF NOT EXISTS public."Secret" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE, -- e.g., 'razorpay_key', 'webhook_secret_123'
  "encryptedValue" TEXT NOT NULL, -- Encrypted secret value
  "keyVersion" INTEGER DEFAULT 1, -- For rotation tracking
  "rotatedAt" TIMESTAMPTZ,
  "rotatedFromId" TEXT REFERENCES public."Secret"(id), -- For rotation tracking
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secret_name ON public."Secret"("name");
CREATE INDEX IF NOT EXISTS idx_secret_active ON public."Secret"("isActive") WHERE "isActive" = true;

-- Enable Row Level Security
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DataExportRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DataDeletionRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Secret" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AuditLog (users can only see their own logs, admins see all)
CREATE POLICY "Users can view their own audit logs" ON public."AuditLog"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text AND "role" IN ('Owner', 'Admin')
    )
  );

-- RLS Policies for DataExportRequest
CREATE POLICY "Users can view their own export requests" ON public."DataExportRequest"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create their own export requests" ON public."DataExportRequest"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- RLS Policies for DataDeletionRequest
CREATE POLICY "Users can view their own deletion requests" ON public."DataDeletionRequest"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create their own deletion requests" ON public."DataDeletionRequest"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- Function to cleanup old audit logs (retention policy: 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public."AuditLog"
  WHERE "createdAt" < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired export requests
CREATE OR REPLACE FUNCTION public.cleanup_expired_export_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM public."DataExportRequest"
  WHERE "expiresAt" < NOW() AND "status" = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Function to auto-anonymize old audit logs (for PII retention compliance)
CREATE OR REPLACE FUNCTION public.anonymize_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Anonymize IP addresses and user agents older than 1 year
  UPDATE public."AuditLog"
  SET 
    "ipAddress" = 'anonymized',
    "userAgent" = 'anonymized'
  WHERE "createdAt" < NOW() - INTERVAL '1 year'
  AND ("ipAddress" != 'anonymized' OR "userAgent" != 'anonymized');
END;
$$ LANGUAGE plpgsql;

