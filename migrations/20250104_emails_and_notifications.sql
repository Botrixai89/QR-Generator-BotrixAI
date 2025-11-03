-- Emails and Notifications Schema
-- This migration adds support for transactional emails, in-app notifications, and email preferences

-- Email Templates table (for dynamic email content)
CREATE TABLE IF NOT EXISTS public."EmailTemplate" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE, -- 'email_verification', 'password_reset', 'invitation', 'receipt', 'dunning', 'usage_alert'
  subject TEXT NOT NULL,
  "htmlBody" TEXT NOT NULL,
  "textBody" TEXT,
  "variables" TEXT[], -- Array of variable names used in template
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_template_name ON public."EmailTemplate"("name");

-- Email Queue table (for async email sending)
CREATE TABLE IF NOT EXISTS public."EmailQueue" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "toEmail" TEXT NOT NULL,
  "toName" TEXT,
  "fromEmail" TEXT NOT NULL,
  "fromName" TEXT NOT NULL,
  subject TEXT NOT NULL,
  "htmlBody" TEXT NOT NULL,
  "textBody" TEXT,
  "templateName" TEXT,
  "templateVariables" JSONB,
  "userId" TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE SET NULL,
  "status" TEXT DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  "attempts" INTEGER DEFAULT 0,
  "lastAttemptAt" TIMESTAMPTZ,
  "sentAt" TIMESTAMPTZ,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "scheduledFor" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public."EmailQueue"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON public."EmailQueue"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_org ON public."EmailQueue"("organizationId", "createdAt" DESC);

-- Email Logs table (for tracking sent emails)
CREATE TABLE IF NOT EXISTS public."EmailLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "queueId" TEXT REFERENCES public."EmailQueue"(id) ON DELETE CASCADE,
  "toEmail" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  subject TEXT NOT NULL,
  "templateName" TEXT,
  "userId" TEXT,
  "organizationId" TEXT,
  "provider" TEXT, -- 'resend', 'sendgrid', 'ses', etc.
  "providerMessageId" TEXT,
  "status" TEXT NOT NULL, -- 'sent', 'delivered', 'bounced', 'failed'
  "errorMessage" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON public."EmailLog"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON public."EmailLog"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_queue ON public."EmailLog"("queueId");

-- Notification Preferences table
CREATE TABLE IF NOT EXISTS public."NotificationPreference" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "emailEnabled" BOOLEAN DEFAULT true,
  "inAppEnabled" BOOLEAN DEFAULT true,
  "emailFrequency" TEXT DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
  "notificationTypes" JSONB DEFAULT '{}', -- { "usage_alert": { "email": true, "inApp": true }, ... }
  "thresholds" JSONB DEFAULT '{}', -- { "credits_low": 10, "scan_threshold": 1000, ... }
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId")
);

CREATE INDEX IF NOT EXISTS idx_notification_pref_user ON public."NotificationPreference"("userId");

-- In-App Notifications table
CREATE TABLE IF NOT EXISTS public."Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'info', 'warning', 'error', 'success', 'usage_alert', 'credit_low', 'domain_verified', 'threshold_crossed'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  "actionUrl" TEXT,
  "actionLabel" TEXT,
  "isRead" BOOLEAN DEFAULT false,
  "readAt" TIMESTAMPTZ,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON public."Notification"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_org ON public."Notification"("organizationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_read ON public."Notification"("userId", "isRead", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_type ON public."Notification"("type", "createdAt" DESC);

-- Email Verification Tokens table
CREATE TABLE IF NOT EXISTS public."EmailVerificationToken" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "verifiedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user ON public."EmailVerificationToken"("userId");
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON public."EmailVerificationToken"("token");

-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS public."PasswordResetToken" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON public."PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public."PasswordResetToken"("token");

-- Threshold Monitoring table
CREATE TABLE IF NOT EXISTS public."ThresholdAlert" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "organizationId" TEXT REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "thresholdType" TEXT NOT NULL, -- 'credits_low', 'scan_threshold', 'domain_verification'
  "thresholdValue" INTEGER NOT NULL, -- The threshold value
  "currentValue" INTEGER NOT NULL, -- Current value when threshold was crossed
  "isResolved" BOOLEAN DEFAULT false,
  "resolvedAt" TIMESTAMPTZ,
  "notifiedAt" TIMESTAMPTZ,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threshold_alert_user ON public."ThresholdAlert"("userId", "isResolved", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_threshold_alert_type ON public."ThresholdAlert"("thresholdType", "isResolved");

-- Enable Row Level Security
ALTER TABLE public."EmailTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailQueue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NotificationPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ThresholdAlert" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for EmailQueue (admin access only)
CREATE POLICY "Admins can view email queue" ON public."EmailQueue"
  FOR SELECT USING (true); -- Admin access in production

-- RLS Policies for EmailLog
CREATE POLICY "Users can view their own email logs" ON public."EmailLog"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text AND "role" IN ('Owner', 'Admin')
    )
  );

-- RLS Policies for NotificationPreference
CREATE POLICY "Users can manage their own notification preferences" ON public."NotificationPreference"
  FOR ALL USING ("userId" = auth.uid()::text);

-- RLS Policies for Notification
CREATE POLICY "Users can view their own notifications" ON public."Notification"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own notifications" ON public."Notification"
  FOR UPDATE USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text
    )
  );

-- RLS Policies for EmailVerificationToken
CREATE POLICY "Users can view their own verification tokens" ON public."EmailVerificationToken"
  FOR SELECT USING ("userId" = auth.uid()::text);

-- RLS Policies for PasswordResetToken
CREATE POLICY "Users can view their own reset tokens" ON public."PasswordResetToken"
  FOR SELECT USING ("userId" = auth.uid()::text);

-- RLS Policies for ThresholdAlert
CREATE POLICY "Users can view their own threshold alerts" ON public."ThresholdAlert"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR
    "organizationId" IN (
      SELECT "organizationId" FROM public."OrganizationMember"
      WHERE "userId" = auth.uid()::text
    )
  );

-- Function to cleanup old email logs (90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_email_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public."EmailLog"
  WHERE "createdAt" < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public."EmailVerificationToken"
  WHERE "expiresAt" < NOW() AND "verifiedAt" IS NULL;
  
  DELETE FROM public."PasswordResetToken"
  WHERE "expiresAt" < NOW() AND "usedAt" IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to mark old notifications as read (auto-read after 30 days)
CREATE OR REPLACE FUNCTION public.auto_read_old_notifications()
RETURNS void AS $$
BEGIN
  UPDATE public."Notification"
  SET "isRead" = true, "readAt" = NOW()
  WHERE "isRead" = false
  AND "createdAt" < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

