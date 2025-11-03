-- Admin Console Migration
-- Adds feature flags, announcements, impersonation tracking, and admin enhancements

-- Feature Flags table
CREATE TABLE IF NOT EXISTS public."FeatureFlag" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  "targetUsers" JSONB, -- Array of user IDs or user segments
  "targetPlans" TEXT[], -- Array of plan names
  "targetPercentage" INTEGER DEFAULT 100, -- Percentage of users (for gradual rollout)
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" TEXT REFERENCES public."User"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_name ON public."FeatureFlag"(name);
CREATE INDEX IF NOT EXISTS idx_feature_flag_enabled ON public."FeatureFlag"(enabled);

-- Announcements table
CREATE TABLE IF NOT EXISTS public."Announcement" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  "targetAudience" TEXT DEFAULT 'all', -- 'all', 'free', 'paid', 'admin', or JSON array of user IDs
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "isActive" BOOLEAN DEFAULT true,
  "isDismissible" BOOLEAN DEFAULT true,
  "actionUrl" TEXT,
  "actionText" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" TEXT REFERENCES public."User"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_announcement_active ON public."Announcement"("isActive", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_announcement_target ON public."Announcement"("targetAudience");

-- Announcement Dismissals (track which users have dismissed announcements)
CREATE TABLE IF NOT EXISTS public."AnnouncementDismissal" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "announcementId" TEXT NOT NULL REFERENCES public."Announcement"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "dismissedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("announcementId", "userId")
);

CREATE INDEX IF NOT EXISTS idx_announcement_dismissal_user ON public."AnnouncementDismissal"("userId");

-- Impersonation Sessions table (for audit trail)
CREATE TABLE IF NOT EXISTS public."ImpersonationSession" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminUserId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "targetUserId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  reason TEXT,
  "startedAt" TIMESTAMPTZ DEFAULT NOW(),
  "endedAt" TIMESTAMPTZ,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON public."ImpersonationSession"("adminUserId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_target ON public."ImpersonationSession"("targetUserId");
CREATE INDEX IF NOT EXISTS idx_impersonation_active ON public."ImpersonationSession"("endedAt") WHERE "endedAt" IS NULL;

-- Add metadata column to User table if not exists (for lockouts, etc.)
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for user role if not exists
CREATE INDEX IF NOT EXISTS idx_user_role ON public."User"(role);

-- Enable RLS
ALTER TABLE public."FeatureFlag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AnnouncementDismissal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ImpersonationSession" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for FeatureFlag (admin access only)
CREATE POLICY "Admins can view feature flags" ON public."FeatureFlag"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage feature flags" ON public."FeatureFlag"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Announcement
CREATE POLICY "Anyone can view active announcements" ON public."Announcement"
  FOR SELECT USING ("isActive" = true);

CREATE POLICY "Admins can manage announcements" ON public."Announcement"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for AnnouncementDismissal
CREATE POLICY "Users can manage their own dismissals" ON public."AnnouncementDismissal"
  FOR ALL USING (auth.uid()::text = "userId");

-- RLS Policies for ImpersonationSession (admin access only)
CREATE POLICY "Admins can view impersonation sessions" ON public."ImpersonationSession"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create impersonation sessions" ON public."ImpersonationSession"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update impersonation sessions" ON public."ImpersonationSession"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

