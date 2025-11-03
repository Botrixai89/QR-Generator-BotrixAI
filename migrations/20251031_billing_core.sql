-- Subscriptions, invoices, billing profiles, and idempotency keys

-- User billing profile
CREATE TABLE IF NOT EXISTS public."BillingProfile" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  userId TEXT NOT NULL,
  customerId TEXT, -- external gateway customer id (Razorpay customer_id)
  billingEmail TEXT,
  billingName TEXT,
  country TEXT,
  addressLine1 TEXT,
  addressLine2 TEXT,
  city TEXT,
  state TEXT,
  postalCode TEXT,
  taxId TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_billingprofile_user ON public."BillingProfile"(userId);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public."Subscription" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  userId TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL, -- active, past_due, canceled, trialing, incomplete
  gateway TEXT NOT NULL DEFAULT 'razorpay',
  gatewaySubscriptionId TEXT,
  currentPeriodStart TIMESTAMPTZ,
  currentPeriodEnd TIMESTAMPTZ,
  cancelAtPeriodEnd BOOLEAN DEFAULT false,
  canceledAt TIMESTAMPTZ,
  trialEnd TIMESTAMPTZ,
  graceUntil TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_user ON public."Subscription"(userId);
CREATE INDEX IF NOT EXISTS idx_subscription_gateway_sub ON public."Subscription"(gatewaySubscriptionId);

-- Invoices
CREATE TABLE IF NOT EXISTS public."Invoice" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  userId TEXT NOT NULL,
  subscriptionId TEXT,
  gateway TEXT NOT NULL DEFAULT 'razorpay',
  gatewayInvoiceId TEXT,
  amountCents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL, -- paid, open, void, uncollectible, refunded
  pdfUrl TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  paidAt TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invoice_user ON public."Invoice"(userId);
CREATE INDEX IF NOT EXISTS idx_invoice_gateway_invoice ON public."Invoice"(gatewayInvoiceId);

-- Webhook idempotency keys
CREATE TABLE IF NOT EXISTS public."WebhookIdempotency" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gateway TEXT NOT NULL,
  eventId TEXT NOT NULL,
  processedAt TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (gateway, eventId)
);

-- Admin adjustments (credits/grants/plan override)
CREATE TABLE IF NOT EXISTS public."BillingAdjustment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  userId TEXT NOT NULL,
  type TEXT NOT NULL, -- credit_grant, plan_override, refund
  amountCents INTEGER,
  plan TEXT,
  reason TEXT,
  createdBy TEXT, -- admin id/email
  createdAt TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_billingadjustment_user ON public."BillingAdjustment"(userId);


