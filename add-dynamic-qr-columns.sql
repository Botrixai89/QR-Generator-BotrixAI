-- Add columns to support dynamic QR code functionality
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "isDynamic" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "dynamicContent" JSONB,
ADD COLUMN IF NOT EXISTS "scanCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastScannedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "maxScans" INTEGER,
ADD COLUMN IF NOT EXISTS "redirectUrl" TEXT;

-- Create index for dynamic QR codes
CREATE INDEX IF NOT EXISTS idx_qrcode_is_dynamic ON public."QrCode"("isDynamic");
CREATE INDEX IF NOT EXISTS idx_qrcode_is_active ON public."QrCode"("isActive");
CREATE INDEX IF NOT EXISTS idx_qrcode_expires_at ON public."QrCode"("expiresAt");

-- Create table for QR code scan analytics
CREATE TABLE IF NOT EXISTS public."QrCodeScan" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
    "scannedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_qrcodescan_qrcode_id ON public."QrCodeScan"("qrCodeId");
CREATE INDEX IF NOT EXISTS idx_qrcodescan_scanned_at ON public."QrCodeScan"("scannedAt");

-- Enable Row Level Security for scan analytics
ALTER TABLE public."QrCodeScan" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for QrCodeScan
CREATE POLICY "Users can view their own QR code scans" ON public."QrCodeScan"
    FOR SELECT USING (
        "qrCodeId" IN (
            SELECT id FROM public."QrCode" WHERE "userId" = auth.uid()
        )
    );
