-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    "emailVerified" TIMESTAMP WITH TIME ZONE,
    image TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes("userId");
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON public.qr_codes("createdAt");

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- Create RLS policies for qr_codes table
CREATE POLICY "Users can view own QR codes" ON public.qr_codes
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own QR codes" ON public.qr_codes
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own QR codes" ON public.qr_codes
    FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own QR codes" ON public.qr_codes
    FOR DELETE USING (auth.uid()::text = "userId");
