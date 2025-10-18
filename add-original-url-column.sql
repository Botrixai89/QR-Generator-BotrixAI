-- Add originalUrl column to QrCode table for URL shortening support
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "originalUrl" TEXT;

-- Update existing records to have originalUrl same as url
UPDATE public."QrCode" 
SET "originalUrl" = url 
WHERE "originalUrl" IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public."QrCode"."originalUrl" IS 'Original URL before shortening, used for display purposes';
