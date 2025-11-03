-- Organizations and multi-tenant support

-- Organizations table
CREATE TABLE IF NOT EXISTS public."Organization" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  ownerId TEXT NOT NULL,
  subscriptionId TEXT, -- References Subscription table for org-level billing
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_owner ON public."Organization"(ownerId);
CREATE INDEX IF NOT EXISTS idx_organization_slug ON public."Organization"(slug);

-- Organization members with roles
CREATE TABLE IF NOT EXISTS public."OrganizationMember" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organizationId TEXT NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  userId TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Member', -- Owner, Admin, Member
  invitedBy TEXT,
  invitedAt TIMESTAMPTZ DEFAULT NOW(),
  joinedAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organizationId, userId)
);

CREATE INDEX IF NOT EXISTS idx_orgmember_org ON public."OrganizationMember"(organizationId);
CREATE INDEX IF NOT EXISTS idx_orgmember_user ON public."OrganizationMember"(userId);

-- Organization invitations
CREATE TABLE IF NOT EXISTS public."OrganizationInvitation" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organizationId TEXT NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Member',
  invitedBy TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt TIMESTAMPTZ NOT NULL,
  acceptedAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organizationId, email, token)
);

CREATE INDEX IF NOT EXISTS idx_orginv_org ON public."OrganizationInvitation"(organizationId);
CREATE INDEX IF NOT EXISTS idx_orginv_token ON public."OrganizationInvitation"(token);
CREATE INDEX IF NOT EXISTS idx_orginv_email ON public."OrganizationInvitation"(email);

-- Add organizationId to QrCode table (nullable for backward compatibility)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS organizationId TEXT REFERENCES public."Organization"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_qrcode_org ON public."QrCode"(organizationId);

-- Add organizationId to Subscription for org-level billing
ALTER TABLE public."Subscription"
ADD COLUMN IF NOT EXISTS organizationId TEXT REFERENCES public."Organization"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_org ON public."Subscription"(organizationId);

