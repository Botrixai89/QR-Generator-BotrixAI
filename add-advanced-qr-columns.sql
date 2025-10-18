-- Add advanced QR code customization columns to the existing QrCode table

-- Add shape column for custom QR code shapes
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'square';

-- Add template column for pre-designed templates
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS template TEXT;

-- Add eye pattern column for custom eye patterns
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "eyePattern" TEXT DEFAULT 'square';

-- Add gradient column for gradient colors (JSON)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS gradient JSONB;

-- Add sticker column for decorative stickers (JSON)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS sticker JSONB;

-- Add effects column for visual effects (JSON)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS effects JSONB;

-- Add custom styling column for additional CSS/SVG (JSON)
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "customStyling" JSONB;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_qrcode_shape ON public."QrCode"(shape);
CREATE INDEX IF NOT EXISTS idx_qrcode_template ON public."QrCode"(template);
CREATE INDEX IF NOT EXISTS idx_qrcode_eye_pattern ON public."QrCode"("eyePattern");

-- Add comments for documentation
COMMENT ON COLUMN public."QrCode".shape IS 'Custom shape for QR code (square, circle, heart, etc.)';
COMMENT ON COLUMN public."QrCode".template IS 'Pre-designed template ID';
COMMENT ON COLUMN public."QrCode"."eyePattern" IS 'Custom pattern for QR code corner eyes';
COMMENT ON COLUMN public."QrCode".gradient IS 'Gradient configuration (JSON)';
COMMENT ON COLUMN public."QrCode".sticker IS 'Sticker configuration (JSON)';
COMMENT ON COLUMN public."QrCode".effects IS 'Visual effects configuration (JSON)';
COMMENT ON COLUMN public."QrCode"."customStyling" IS 'Custom CSS/SVG styling (JSON)';
