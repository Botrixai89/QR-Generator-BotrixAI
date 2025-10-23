-- Migration: Add credits and payments system
-- Date: 2025-01-01
-- Description: Adds credits system to User table and creates payments table for Razorpay integration

-- Add credits and plan columns to existing User table
ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS credits integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'FREE';

-- Create payments table for Razorpay integration
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    razorpay_order_id text UNIQUE,
    razorpay_payment_id text,
    amount int NOT NULL,
    currency text DEFAULT 'INR',
    status text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Add index on user_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- Add index on razorpay_order_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Add foreign key constraint (optional, depends on your User table structure)
-- ALTER TABLE public.payments ADD CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES public."User"(id);

-- Update existing users to have default credits if they don't have any
UPDATE public."User" 
SET credits = 10, plan = 'FREE' 
WHERE credits IS NULL OR plan IS NULL;
