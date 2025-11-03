-- Brand Kit and Internationalization Migration
-- Adds brand kit support per organization and i18n scaffolding

-- Add brand kit fields to Organization table
ALTER TABLE public."Organization" 
ADD COLUMN IF NOT EXISTS "brandKit" JSONB,
ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "brandColors" JSONB,
ADD COLUMN IF NOT EXISTS "qrStylePresets" JSONB;

-- Brand kit structure:
-- {
--   "logoUrl": "https://...",
--   "primaryColor": "#...",
--   "secondaryColor": "#...",
--   "accentColor": "#...",
--   "presets": {
--     "default": { "foregroundColor": "#...", "backgroundColor": "#..." },
--     "event": { ... },
--     "menu": { ... },
--     "payment": { ... },
--     "vcard": { ... }
--   }
-- }

-- Create i18n translations table
CREATE TABLE IF NOT EXISTS public."I18nTranslation" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "namespace" TEXT DEFAULT 'common',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("key", "locale", "namespace")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_i18n_key ON public."I18nTranslation"("key");
CREATE INDEX IF NOT EXISTS idx_i18n_locale ON public."I18nTranslation"("locale");
CREATE INDEX IF NOT EXISTS idx_i18n_namespace ON public."I18nTranslation"("namespace");
CREATE INDEX IF NOT EXISTS idx_i18n_key_locale ON public."I18nTranslation"("key", "locale");

-- Enable RLS
ALTER TABLE public."I18nTranslation" ENABLE ROW LEVEL SECURITY;

-- Create policy: All authenticated users can read translations
CREATE POLICY "Anyone can view translations" ON public."I18nTranslation"
  FOR SELECT USING (true);

-- Insert default English translations for core pages
INSERT INTO public."I18nTranslation" ("key", "locale", "value", "namespace") VALUES
-- Common
('common.loading', 'en', 'Loading...', 'common'),
('common.error', 'en', 'An error occurred', 'common'),
('common.success', 'en', 'Success', 'common'),
('common.save', 'en', 'Save', 'common'),
('common.cancel', 'en', 'Cancel', 'common'),
('common.delete', 'en', 'Delete', 'common'),
('common.edit', 'en', 'Edit', 'common'),
('common.create', 'en', 'Create', 'common'),
('common.close', 'en', 'Close', 'common'),
('common.confirm', 'en', 'Confirm', 'common'),

-- Pricing
('pricing.title', 'en', 'Pricing', 'pricing'),
('pricing.description', 'en', 'Choose the perfect plan for your needs', 'pricing'),
('pricing.monthly', 'en', 'Monthly', 'pricing'),
('pricing.annual', 'en', 'Annual', 'pricing'),
('pricing.perMonth', 'en', 'per month', 'pricing'),
('pricing.features', 'en', 'Features', 'pricing'),
('pricing.getStarted', 'en', 'Get Started', 'pricing'),
('pricing.contactSales', 'en', 'Contact Sales', 'pricing'),

-- Dashboard
('dashboard.title', 'en', 'Dashboard', 'dashboard'),
('dashboard.welcome', 'en', 'Welcome back', 'dashboard'),
('dashboard.createQRCode', 'en', 'Create QR Code', 'dashboard'),
('dashboard.recentCodes', 'en', 'Recent QR Codes', 'dashboard'),
('dashboard.analytics', 'en', 'Analytics', 'dashboard'),
('dashboard.settings', 'en', 'Settings', 'dashboard'),

-- QR Generator
('qr.create', 'en', 'Create QR Code', 'qr'),
('qr.customize', 'en', 'Customize', 'qr'),
('qr.download', 'en', 'Download', 'qr'),
('qr.preview', 'en', 'Preview', 'qr'),
('qr.url', 'en', 'URL', 'qr'),
('qr.text', 'en', 'Text', 'qr'),
('qr.email', 'en', 'Email', 'qr'),
('qr.phone', 'en', 'Phone', 'qr'),
('qr.wifi', 'en', 'WiFi', 'qr'),
('qr.vcard', 'en', 'vCard', 'qr'),

-- Templates
('templates.title', 'en', 'Templates', 'templates'),
('templates.event', 'en', 'Event', 'templates'),
('templates.menu', 'en', 'Menu', 'templates'),
('templates.payment', 'en', 'Payment', 'templates'),
('templates.vcard', 'en', 'vCard', 'templates'),
('templates.business', 'en', 'Business', 'templates'),
('templates.creative', 'en', 'Creative', 'templates'),

-- Brand Kit
('brandKit.title', 'en', 'Brand Kit', 'brandKit'),
('brandKit.logo', 'en', 'Logo', 'brandKit'),
('brandKit.colors', 'en', 'Brand Colors', 'brandKit'),
('brandKit.presets', 'en', 'QR Style Presets', 'brandKit'),
('brandKit.primaryColor', 'en', 'Primary Color', 'brandKit'),
('brandKit.secondaryColor', 'en', 'Secondary Color', 'brandKit'),
('brandKit.accentColor', 'en', 'Accent Color', 'brandKit'),
('brandKit.uploadLogo', 'en', 'Upload Logo', 'brandKit'),
('brandKit.savePresets', 'en', 'Save Presets', 'brandKit'),

-- Empty States
('emptyStates.noQRCodes', 'en', 'No QR Codes Yet', 'emptyStates'),
('emptyStates.noQRCodesDesc', 'en', 'Get started by creating your first QR code', 'emptyStates'),
('emptyStates.noDomains', 'en', 'No Custom Domains', 'emptyStates'),
('emptyStates.noDomainsDesc', 'en', 'Add a custom domain to brand your QR codes', 'emptyStates'),

-- Onboarding
('onboarding.title', 'en', 'Getting Started', 'onboarding'),
('onboarding.createFirstQR', 'en', 'Create your first QR code', 'onboarding'),
('onboarding.uploadLogo', 'en', 'Upload your logo', 'onboarding'),
('onboarding.setupBrand', 'en', 'Set up your brand kit', 'onboarding'),
('onboarding.verifyDomain', 'en', 'Verify your custom domain', 'onboarding'),

ON CONFLICT ("key", "locale", "namespace") DO NOTHING;

