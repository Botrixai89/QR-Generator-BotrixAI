-- Migration: ME-QR-like Features
-- Adds folders, file storage, and ad tracking support

-- 1. Create QrCodeFolder table for organizing QR codes
CREATE TABLE IF NOT EXISTS public."QrCodeFolder" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT, -- Optional folder color for UI
    "parentFolderId" TEXT REFERENCES public."QrCodeFolder"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qrcodefolder_user_id ON public."QrCodeFolder"("userId");
CREATE INDEX IF NOT EXISTS idx_qrcodefolder_parent ON public."QrCodeFolder"("parentFolderId");

-- 2. Add folderId column to QrCode table
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "folderId" TEXT REFERENCES public."QrCodeFolder"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_qrcode_folder_id ON public."QrCode"("folderId");

-- 3. Create QrCodeFile table for file storage linked to QR codes
CREATE TABLE IF NOT EXISTS public."QrCodeFile" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    "qrCodeId" TEXT REFERENCES public."QrCode"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    size INTEGER NOT NULL, -- Size in bytes
    "storagePath" TEXT NOT NULL, -- Path in storage bucket
    "publicUrl" TEXT NOT NULL,
    "downloadCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qrcodefile_user_id ON public."QrCodeFile"("userId");
CREATE INDEX IF NOT EXISTS idx_qrcodefile_qrcode_id ON public."QrCodeFile"("qrCodeId");

-- 4. Add fileId column to QrCode table (for QR codes that link to files)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "fileId" TEXT REFERENCES public."QrCodeFile"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_qrcode_file_id ON public."QrCode"("fileId");

-- 5. Add ad tracking columns to QrCode table
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "showAds" BOOLEAN DEFAULT true, -- Whether ads should be shown when scanning
ADD COLUMN IF NOT EXISTS "adDisplayCount" INTEGER DEFAULT 0; -- Track how many times ads were shown

-- 6. Create QrCodeAdView table to track ad impressions
CREATE TABLE IF NOT EXISTS public."QrCodeAdView" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
    "scannedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "city" TEXT,
    "adType" TEXT, -- e.g., 'banner', 'interstitial', 'video'
    "adProvider" TEXT, -- e.g., 'google', 'custom'
    "revenueCents" INTEGER DEFAULT 0 -- Revenue generated from this ad view (in cents)
);

CREATE INDEX IF NOT EXISTS idx_qrcodeadview_qrcode_id ON public."QrCodeAdView"("qrCodeId");
CREATE INDEX IF NOT EXISTS idx_qrcodeadview_scanned_at ON public."QrCodeAdView"("scannedAt");

-- 7. Enable Row Level Security
ALTER TABLE public."QrCodeFolder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QrCodeFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QrCodeAdView" ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for QrCodeFolder
CREATE POLICY "Users can view their own folders" ON public."QrCodeFolder"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create their own folders" ON public."QrCodeFolder"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update their own folders" ON public."QrCodeFolder"
    FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete their own folders" ON public."QrCodeFolder"
    FOR DELETE USING ("userId" = auth.uid()::text);

-- 9. Create RLS policies for QrCodeFile
CREATE POLICY "Users can view their own files" ON public."QrCodeFile"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create their own files" ON public."QrCodeFile"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update their own files" ON public."QrCodeFile"
    FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete their own files" ON public."QrCodeFile"
    FOR DELETE USING ("userId" = auth.uid()::text);

-- 10. Create RLS policies for QrCodeAdView (users can only view ads for their QR codes)
CREATE POLICY "Users can view ad views for their QR codes" ON public."QrCodeAdView"
    FOR SELECT USING (
        "qrCodeId" IN (
            SELECT id FROM public."QrCode" WHERE "userId" = auth.uid()::text
        )
    );

-- 11. Add function to calculate user's file storage usage
CREATE OR REPLACE FUNCTION public.get_user_file_storage_usage(p_user_id TEXT)
RETURNS BIGINT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(size) FROM public."QrCodeFile" WHERE "userId" = p_user_id),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Add function to check if user can upload file (within storage limit)
CREATE OR REPLACE FUNCTION public.can_user_upload_file(
    p_user_id TEXT,
    p_file_size INTEGER,
    p_plan TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_usage BIGINT;
    v_storage_limit_mb INTEGER;
    v_storage_limit_bytes BIGINT;
BEGIN
    -- Get current storage usage in bytes
    v_current_usage := public.get_user_file_storage_usage(p_user_id);
    
    -- Define storage limits per plan (in MB)
    CASE p_plan
        WHEN 'FREE' THEN v_storage_limit_mb := 100;
        WHEN 'FLEX' THEN v_storage_limit_mb := 250;
        WHEN 'PRO' THEN v_storage_limit_mb := 500;
        WHEN 'BUSINESS' THEN v_storage_limit_mb := 2000;
        ELSE v_storage_limit_mb := 100;
    END CASE;
    
    -- Convert MB to bytes
    v_storage_limit_bytes := v_storage_limit_mb * 1024 * 1024;
    
    -- Check if adding this file would exceed limit
    RETURN (v_current_usage + p_file_size) <= v_storage_limit_bytes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_file_storage_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_file_storage_usage TO service_role;
GRANT EXECUTE ON FUNCTION public.can_user_upload_file TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_upload_file TO service_role;

