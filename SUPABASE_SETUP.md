# Supabase Database Setup

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `imejubcsmzwhzpzgdbur`

## Step 2: Create Tables

### 1. Create Users Table

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### 2. Create QR Codes Table

Run this SQL in the SQL Editor:

```sql
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
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes("userId");
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON public.qr_codes("createdAt");

-- Enable Row Level Security
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
```

### 3. Create RLS Policies (Optional - for security)

Run this SQL to set up Row Level Security policies:

```sql
-- RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- RLS policies for qr_codes table
CREATE POLICY "Users can view own QR codes" ON public.qr_codes
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own QR codes" ON public.qr_codes
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own QR codes" ON public.qr_codes
    FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own QR codes" ON public.qr_codes
    FOR DELETE USING (auth.uid()::text = "userId");
```

## Step 3: Verify Tables

After running the SQL, go to **Table Editor** in your Supabase dashboard and verify that you can see:
- `users` table
- `qr_codes` table

## Step 4: Test Registration

Once the tables are created, your registration should work! The error was because the `users` table didn't exist in your Supabase database.

## Alternative: Quick Setup Script

If you prefer, you can also run this single SQL command to create everything at once:

```sql
-- Complete database setup
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

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes("userId");
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON public.qr_codes("createdAt");

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
```
