-- Custom Domains Enhanced Features Migration
-- Adds routing config, vanity URLs, analytics, and customizable error pages

-- Add new columns to QrCodeCustomDomain table
ALTER TABLE public."QrCodeCustomDomain" 
ADD COLUMN IF NOT EXISTS "routingConfig" JSONB,
ADD COLUMN IF NOT EXISTS "custom404Page" TEXT,
ADD COLUMN IF NOT EXISTS "customExpiryPage" TEXT,
ADD COLUMN IF NOT EXISTS "sslCertId" TEXT,
ADD COLUMN IF NOT EXISTS "sslStatus" TEXT DEFAULT 'pending', -- pending, active, expired, error
ADD COLUMN IF NOT EXISTS "sslExpiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "lastDnsCheck" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending', -- pending, verified, active, error
ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

-- Add vanity URL and slug support to QrCode table
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "vanityUrl" TEXT,
ADD COLUMN IF NOT EXISTS "customSlug" TEXT,
ADD COLUMN IF NOT EXISTS "custom404Page" TEXT,
ADD COLUMN IF NOT EXISTS "customExpiryPage" TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_qrcode_vanity_url ON public."QrCode"("vanityUrl");
CREATE INDEX IF NOT EXISTS idx_qrcode_custom_slug ON public."QrCode"("customSlug");
CREATE INDEX IF NOT EXISTS idx_qrcode_custom_domain_status ON public."QrCodeCustomDomain"("status");
CREATE INDEX IF NOT EXISTS idx_qrcode_custom_domain_ssl_status ON public."QrCodeCustomDomain"("sslStatus");

-- Create Domain Analytics table
CREATE TABLE IF NOT EXISTS public."QrCodeDomainAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "domainId" TEXT NOT NULL REFERENCES public."QrCodeCustomDomain"(id) ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "totalScans" INTEGER DEFAULT 0,
    "uniqueVisitors" INTEGER DEFAULT 0,
    "countries" JSONB,
    "devices" JSONB,
    "browsers" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("domainId", "date")
);

-- Create index for domain analytics
CREATE INDEX IF NOT EXISTS idx_domain_analytics_domain_id ON public."QrCodeDomainAnalytics"("domainId");
CREATE INDEX IF NOT EXISTS idx_domain_analytics_date ON public."QrCodeDomainAnalytics"("date");

-- Create Vanity URL Mapping table for quick lookups
CREATE TABLE IF NOT EXISTS public."QrCodeVanityUrl" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
    "vanityUrl" TEXT NOT NULL UNIQUE,
    "customSlug" TEXT,
    "domainId" TEXT REFERENCES public."QrCodeCustomDomain"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vanity URLs
CREATE INDEX IF NOT EXISTS idx_vanity_url_qrcode_id ON public."QrCodeVanityUrl"("qrCodeId");
CREATE INDEX IF NOT EXISTS idx_vanity_url_vanity_url ON public."QrCodeVanityUrl"("vanityUrl");
CREATE INDEX IF NOT EXISTS idx_vanity_url_custom_slug ON public."QrCodeVanityUrl"("customSlug");
CREATE INDEX IF NOT EXISTS idx_vanity_url_domain_id ON public."QrCodeVanityUrl"("domainId");

-- Enable Row Level Security for new tables
ALTER TABLE public."QrCodeDomainAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QrCodeVanityUrl" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own domain analytics" ON public."QrCodeDomainAnalytics"
    FOR SELECT USING (
        "domainId" IN (
            SELECT id FROM public."QrCodeCustomDomain" WHERE "userId" = auth.uid()
        )
    );

CREATE POLICY "Users can view their own vanity URLs" ON public."QrCodeVanityUrl"
    FOR ALL USING (
        "qrCodeId" IN (
            SELECT id FROM public."QrCode" WHERE "userId" = auth.uid()
        )
    );

-- Create function to check vanity URL availability
CREATE OR REPLACE FUNCTION public.check_vanity_url_availability(
    vanity_url TEXT,
    qr_code_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if vanity URL exists for a different QR code
    IF qr_code_id IS NOT NULL THEN
        RETURN NOT EXISTS (
            SELECT 1 FROM public."QrCodeVanityUrl"
            WHERE "vanityUrl" = vanity_url
            AND "qrCodeId" != qr_code_id
        );
    ELSE
        RETURN NOT EXISTS (
            SELECT 1 FROM public."QrCodeVanityUrl"
            WHERE "vanityUrl" = vanity_url
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update domain analytics
CREATE OR REPLACE FUNCTION public.update_domain_analytics(
    domain_id TEXT,
    scan_data JSONB
) RETURNS void AS $$
BEGIN
    INSERT INTO public."QrCodeDomainAnalytics" (
        "domainId",
        "date",
        "totalScans",
        "uniqueVisitors",
        "countries",
        "devices",
        "browsers"
    )
    VALUES (
        domain_id,
        CURRENT_DATE,
        1,
        1,
        COALESCE(scan_data->'country', '{}'),
        COALESCE(scan_data->'device', '{}'),
        COALESCE(scan_data->'browser', '{}')
    )
    ON CONFLICT ("domainId", "date") DO UPDATE
    SET
        "totalScans" = public."QrCodeDomainAnalytics"."totalScans" + 1,
        "countries" = public."QrCodeDomainAnalytics"."countries" || (scan_data->'country'),
        "devices" = public."QrCodeDomainAnalytics"."devices" || (scan_data->'device'),
        "browsers" = public."QrCodeDomainAnalytics"."browsers" || (scan_data->'browser'),
        "updatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

