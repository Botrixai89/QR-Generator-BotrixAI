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

-- Create indexes for better performance
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