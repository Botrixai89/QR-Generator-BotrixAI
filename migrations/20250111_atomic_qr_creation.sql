-- Migration: Atomic QR Code Creation with Credit Deduction
-- This ensures QR codes are only created if credits can be deducted successfully
-- Prevents revenue loss from failed credit deductions

-- Function to atomically create QR code and deduct credit
CREATE OR REPLACE FUNCTION public.create_qr_code_with_credit_deduction(
  p_qr_data JSONB,
  p_user_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_credits INTEGER;
  v_qr_code JSONB;
BEGIN
  -- Lock the user row to prevent race conditions
  SELECT credits INTO v_user_credits
  FROM public."User"
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has sufficient credits
  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user_credits <= 0 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Insert QR code
  INSERT INTO public."QrCode" (
    id,
    "userId",
    url,
    title,
    description,
    "foregroundColor",
    "backgroundColor",
    "dotType",
    "cornerType",
    "logoUrl",
    "hasWatermark",
    "isDynamic",
    "dynamicContent",
    "expiresAt",
    "maxScans",
    "redirectUrl",
    "organizationId",
    shape,
    template,
    "eyePattern",
    gradient,
    sticker,
    effects,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    (p_qr_data->>'id')::TEXT,
    p_user_id,
    (p_qr_data->>'url')::TEXT,
    (p_qr_data->>'title')::TEXT,
    (p_qr_data->>'description')::TEXT,
    COALESCE((p_qr_data->>'foregroundColor')::TEXT, '#000000'),
    COALESCE((p_qr_data->>'backgroundColor')::TEXT, '#FFFFFF'),
    COALESCE((p_qr_data->>'dotType')::TEXT, 'square'),
    COALESCE((p_qr_data->>'cornerType')::TEXT, 'square'),
    (p_qr_data->>'logoUrl')::TEXT,
    COALESCE((p_qr_data->>'hasWatermark')::BOOLEAN, true),
    COALESCE((p_qr_data->>'isDynamic')::BOOLEAN, false),
    (p_qr_data->'dynamicContent')::JSONB,
    (p_qr_data->>'expiresAt')::TIMESTAMP WITH TIME ZONE,
    (p_qr_data->>'maxScans')::INTEGER,
    (p_qr_data->>'redirectUrl')::TEXT,
    (p_qr_data->>'organizationId')::TEXT,
    (p_qr_data->>'shape')::TEXT,
    (p_qr_data->>'template')::TEXT,
    (p_qr_data->>'eyePattern')::TEXT,
    (p_qr_data->'gradient')::JSONB,
    (p_qr_data->'sticker')::JSONB,
    (p_qr_data->'effects')::JSONB,
    NOW(),
    NOW()
  )
  RETURNING row_to_json("QrCode")::JSONB INTO v_qr_code;

  -- Deduct credit (this will rollback with QR insert if it fails)
  UPDATE public."User"
  SET credits = credits - 1,
      "updatedAt" = NOW()
  WHERE id = p_user_id;

  -- Return the created QR code
  RETURN v_qr_code;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Failed to create QR code: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_qr_code_with_credit_deduction TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_qr_code_with_credit_deduction TO service_role;

-- Function to bulk create QR codes with credit deduction
CREATE OR REPLACE FUNCTION public.bulk_create_qr_codes_with_credits(
  p_qr_data_array JSONB[],
  p_user_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_credits INTEGER;
  v_required_credits INTEGER;
  v_qr_codes JSONB[] := '{}';
  v_qr_data JSONB;
  v_created_qr JSONB;
BEGIN
  -- Calculate required credits
  v_required_credits := array_length(p_qr_data_array, 1);

  -- Lock the user row
  SELECT credits INTO v_user_credits
  FROM public."User"
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has sufficient credits
  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user_credits < v_required_credits THEN
    RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', v_required_credits, v_user_credits;
  END IF;

  -- Create all QR codes
  FOREACH v_qr_data IN ARRAY p_qr_data_array LOOP
    INSERT INTO public."QrCode" (
      id,
      "userId",
      url,
      title,
      "foregroundColor",
      "backgroundColor",
      "dotType",
      "cornerType",
      "logoUrl",
      "hasWatermark",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      (v_qr_data->>'id')::TEXT,
      p_user_id,
      (v_qr_data->>'url')::TEXT,
      (v_qr_data->>'title')::TEXT,
      COALESCE((v_qr_data->>'foregroundColor')::TEXT, '#000000'),
      COALESCE((v_qr_data->>'backgroundColor')::TEXT, '#FFFFFF'),
      COALESCE((v_qr_data->>'dotType')::TEXT, 'square'),
      COALESCE((v_qr_data->>'cornerType')::TEXT, 'square'),
      (v_qr_data->>'logoUrl')::TEXT,
      COALESCE((v_qr_data->>'hasWatermark')::BOOLEAN, true),
      NOW(),
      NOW()
    )
    RETURNING row_to_json("QrCode")::JSONB INTO v_created_qr;
    
    v_qr_codes := array_append(v_qr_codes, v_created_qr);
  END LOOP;

  -- Deduct all credits at once
  UPDATE public."User"
  SET credits = credits - v_required_credits,
      "updatedAt" = NOW()
  WHERE id = p_user_id;

  -- Return array of created QR codes
  RETURN array_to_json(v_qr_codes)::JSONB;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to bulk create QR codes: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.bulk_create_qr_codes_with_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_create_qr_codes_with_credits TO service_role;

-- Add comment
COMMENT ON FUNCTION public.create_qr_code_with_credit_deduction IS 'Atomically creates a QR code and deducts user credit in a single transaction';
COMMENT ON FUNCTION public.bulk_create_qr_codes_with_credits IS 'Atomically creates multiple QR codes and deducts user credits in a single transaction';

