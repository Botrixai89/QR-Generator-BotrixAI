-- Enhanced Dynamic QR Code Schema
-- This migration adds advanced features for 100% dynamic QR code functionality

-- Add new columns to QrCode table for advanced features
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "deviceRedirection" JSONB,
ADD COLUMN IF NOT EXISTS "geoRedirection" JSONB,
ADD COLUMN IF NOT EXISTS "marketingPixels" JSONB,
ADD COLUMN IF NOT EXISTS "abTestConfig" JSONB,
ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT,
ADD COLUMN IF NOT EXISTS "webhookSecret" TEXT,
ADD COLUMN IF NOT EXISTS "customDomain" TEXT,
ADD COLUMN IF NOT EXISTS "isBulkManaged" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "bulkGroupId" TEXT,
ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "rateLimitConfig" JSONB;

-- Create indexes for new features
CREATE INDEX IF NOT EXISTS idx_qrcode_bulk_group ON public."QrCode"("bulkGroupId");
CREATE INDEX IF NOT EXISTS idx_qrcode_custom_domain ON public."QrCode"("customDomain");
CREATE INDEX IF NOT EXISTS idx_qrcode_version ON public."QrCode"("version");

-- Create AB Test Results table
CREATE TABLE IF NOT EXISTS public."QrCodeABTest" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
    "testName" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "conversionCount" INTEGER DEFAULT 0,
    "scanCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Webhook Logs table
CREATE TABLE IF NOT EXISTS public."QrCodeWebhookLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
    "webhookUrl" TEXT NOT NULL,
    "payload" JSONB,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "attempts" INTEGER DEFAULT 1,
    "lastAttemptAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "isSuccessful" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Bulk Operations table
CREATE TABLE IF NOT EXISTS public."QrCodeBulkGroup" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    "groupName" TEXT NOT NULL,
    "operationType" TEXT NOT NULL, -- 'create', 'update', 'delete', 'export'
    "status" TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    "totalCount" INTEGER DEFAULT 0,
    "processedCount" INTEGER DEFAULT 0,
    "failedCount" INTEGER DEFAULT 0,
    "results" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE
);

-- Create Rate Limiting table
CREATE TABLE IF NOT EXISTS public."QrCodeRateLimit" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
    "ipAddress" TEXT,
    "userId" TEXT,
    "requestCount" INTEGER DEFAULT 1,
    "windowStart" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "lastRequestAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "isBlocked" BOOLEAN DEFAULT false
);

-- Create Custom Domains table
CREATE TABLE IF NOT EXISTS public."QrCodeCustomDomain" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    "domain" TEXT NOT NULL UNIQUE,
    "isVerified" BOOLEAN DEFAULT false,
    "verificationToken" TEXT,
    "sslEnabled" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "verifiedAt" TIMESTAMP WITH TIME ZONE
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_qrcode_abtest_qrcode_id ON public."QrCodeABTest"("qrCodeId");
CREATE INDEX IF NOT EXISTS idx_qrcode_webhook_log_qrcode_id ON public."QrCodeWebhookLog"("qrCodeId");
CREATE INDEX IF NOT EXISTS idx_qrcode_bulk_group_user_id ON public."QrCodeBulkGroup"("userId");
CREATE INDEX IF NOT EXISTS idx_qrcode_rate_limit_qrcode_id ON public."QrCodeRateLimit"("qrCodeId");
CREATE INDEX IF NOT EXISTS idx_qrcode_rate_limit_ip ON public."QrCodeRateLimit"("ipAddress");
CREATE INDEX IF NOT EXISTS idx_qrcode_custom_domain_user_id ON public."QrCodeCustomDomain"("userId");

-- Enable Row Level Security for new tables
ALTER TABLE public."QrCodeABTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QrCodeWebhookLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QrCodeBulkGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QrCodeRateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QrCodeCustomDomain" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Users can view their own QR code AB tests" ON public."QrCodeABTest"
    FOR SELECT USING (
        "qrCodeId" IN (
            SELECT id FROM public."QrCode" WHERE "userId" = auth.uid()
        )
    );

CREATE POLICY "Users can view their own webhook logs" ON public."QrCodeWebhookLog"
    FOR SELECT USING (
        "qrCodeId" IN (
            SELECT id FROM public."QrCode" WHERE "userId" = auth.uid()
        )
    );

CREATE POLICY "Users can view their own bulk groups" ON public."QrCodeBulkGroup"
    FOR ALL USING ("userId" = auth.uid());

CREATE POLICY "Users can view their own rate limits" ON public."QrCodeRateLimit"
    FOR SELECT USING (
        "qrCodeId" IN (
            SELECT id FROM public."QrCode" WHERE "userId" = auth.uid()
        )
    );

CREATE POLICY "Users can view their own custom domains" ON public."QrCodeCustomDomain"
    FOR ALL USING ("userId" = auth.uid());

-- Add functions for advanced features
CREATE OR REPLACE FUNCTION public.get_device_redirect_url(
    qr_code_id TEXT,
    user_agent TEXT
) RETURNS TEXT AS $$
DECLARE
    device_config JSONB;
    device_type TEXT;
    redirect_url TEXT;
BEGIN
    -- Get QR code device redirection config
    SELECT "deviceRedirection" INTO device_config
    FROM public."QrCode"
    WHERE id = qr_code_id;
    
    IF device_config IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Determine device type from user agent
    IF user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipad%' THEN
        device_type := 'ios';
    ELSIF user_agent ILIKE '%android%' THEN
        device_type := 'android';
    ELSE
        device_type := 'desktop';
    END IF;
    
    -- Get redirect URL for device type
    redirect_url := device_config->>device_type;
    
    RETURN redirect_url;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_geo_redirect_url(
    qr_code_id TEXT,
    country_code TEXT,
    city_name TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    geo_config JSONB;
    redirect_url TEXT;
BEGIN
    -- Get QR code geo redirection config
    SELECT "geoRedirection" INTO geo_config
    FROM public."QrCode"
    WHERE id = qr_code_id;
    
    IF geo_config IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Try city-specific redirect first
    IF city_name IS NOT NULL THEN
        redirect_url := geo_config->'cities'->>city_name;
        IF redirect_url IS NOT NULL THEN
            RETURN redirect_url;
        END IF;
    END IF;
    
    -- Fall back to country-specific redirect
    redirect_url := geo_config->'countries'->>country_code;
    
    RETURN redirect_url;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for AB test tracking
CREATE OR REPLACE FUNCTION public.track_ab_test_conversion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update AB test conversion count
    UPDATE public."QrCodeABTest"
    SET "conversionCount" = "conversionCount" + 1,
        "updatedAt" = NOW()
    WHERE "qrCodeId" = NEW."qrCodeId"
    AND "variant" = (
        SELECT "abTestConfig"->>'activeVariant'
        FROM public."QrCode"
        WHERE id = NEW."qrCodeId"
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_ab_test_conversion_trigger
    AFTER INSERT ON public."QrCodeScan"
    FOR EACH ROW
    EXECUTE FUNCTION public.track_ab_test_conversion();

-- Add cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM public."QrCodeRateLimit"
    WHERE "lastRequestAt" < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to cleanup old rate limits (run daily)
-- Note: This would typically be set up in your application scheduler
