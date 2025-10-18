-- Create QrCode table to match the existing User table structure
CREATE TABLE IF NOT EXISTS public."QrCode" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    "foregroundColor" TEXT DEFAULT '#000000',
    "backgroundColor" TEXT DEFAULT '#FFFFFF',
    "dotType" TEXT DEFAULT 'square',
    "cornerType" TEXT DEFAULT 'square',
    "logoUrl" TEXT,
    "hasWatermark" BOOLEAN DEFAULT true,
    "downloadCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_qrcode_user_id ON public."QrCode"("userId");
CREATE INDEX IF NOT EXISTS idx_qrcode_created_at ON public."QrCode"("createdAt");

-- Enable Row Level Security
ALTER TABLE public."QrCode" ENABLE ROW LEVEL SECURITY;
