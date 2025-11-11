-- Migration: Performance Indexes
-- Adds critical indexes to improve query performance and prevent degradation at scale
-- These indexes were identified as missing during the codebase audit

-- ============================================================================
-- QR CODE TABLE INDEXES
-- ============================================================================

-- Index for organization-owned QR codes
-- Used in: GET /api/qr-codes (fetches QR codes by organization)
CREATE INDEX IF NOT EXISTS idx_qrcode_organization_id 
ON public."QrCode"("organizationId") 
WHERE "organizationId" IS NOT NULL;

-- Index for dynamic QR codes
-- Used in: Filtering and analytics queries for dynamic QR codes
CREATE INDEX IF NOT EXISTS idx_qrcode_is_dynamic 
ON public."QrCode"("isDynamic") 
WHERE "isDynamic" = true;

-- Index for QR codes with expiration
-- Used in: Cleanup jobs and expiration checks
CREATE INDEX IF NOT EXISTS idx_qrcode_expires_at 
ON public."QrCode"("expiresAt") 
WHERE "expiresAt" IS NOT NULL;

-- Composite index for common dashboard query pattern
-- Used in: Dashboard fetches QR codes by user, sorted by creation date
CREATE INDEX IF NOT EXISTS idx_qrcode_user_created 
ON public."QrCode"("userId", "createdAt" DESC);

-- Composite index for organization dashboard queries
-- Used in: Organization members viewing org's QR codes
CREATE INDEX IF NOT EXISTS idx_qrcode_org_created 
ON public."QrCode"("organizationId", "createdAt" DESC) 
WHERE "organizationId" IS NOT NULL;

-- Index for QR code URL lookups (for duplicate detection)
CREATE INDEX IF NOT EXISTS idx_qrcode_url_hash 
ON public."QrCode" USING hash("url");

-- Index for active dynamic QR codes
-- Used in: Scan endpoints for dynamic QR code lookups
CREATE INDEX IF NOT EXISTS idx_qrcode_active_dynamic 
ON public."QrCode"("id", "isDynamic", "isActive") 
WHERE "isDynamic" = true AND "isActive" = true;

-- ============================================================================
-- SCAN TABLE INDEXES
-- ============================================================================

-- Composite index for scan analytics queries
-- Used in: Analytics dashboard - scans per QR code over time
CREATE INDEX IF NOT EXISTS idx_scan_qrcode_created 
ON public."Scan"("qrCodeId", "createdAt" DESC);

-- Index for scan analytics by location
-- Used in: Geographic analytics queries
CREATE INDEX IF NOT EXISTS idx_scan_country_city 
ON public."Scan"("country", "city") 
WHERE "country" IS NOT NULL;

-- Index for device analytics
-- Used in: Device breakdown analytics
CREATE INDEX IF NOT EXISTS idx_scan_device 
ON public."Scan"("device") 
WHERE "device" IS NOT NULL;

-- Index for recent scans lookup
-- Used in: Dashboard showing recent scan activity
CREATE INDEX IF NOT EXISTS idx_scan_created_at 
ON public."Scan"("createdAt" DESC);

-- Composite index for user's scan analytics
-- Used in: User viewing all their QR codes' scans
CREATE INDEX IF NOT EXISTS idx_scan_user_created 
ON public."Scan"("userId", "createdAt" DESC) 
WHERE "userId" IS NOT NULL;

-- Index for IP-based analytics and abuse detection
CREATE INDEX IF NOT EXISTS idx_scan_ip_address 
ON public."Scan"("ipAddress") 
WHERE "ipAddress" IS NOT NULL;

-- ============================================================================
-- API KEY TABLE INDEXES
-- ============================================================================

-- Hash index for fast API key lookup
-- Used in: Every authenticated API request
CREATE INDEX IF NOT EXISTS idx_apikey_hash 
ON public."ApiKey" USING hash("keyHash");

-- Index for active API keys by user
-- Used in: User's API key management page
CREATE INDEX IF NOT EXISTS idx_apikey_user_active 
ON public."ApiKey"("userId", "isActive") 
WHERE "isActive" = true;

-- Index for API key expiration checks
-- Used in: Cleanup jobs and validation
CREATE INDEX IF NOT EXISTS idx_apikey_expires_at 
ON public."ApiKey"("expiresAt") 
WHERE "expiresAt" IS NOT NULL;

-- Composite index for organization API keys
CREATE INDEX IF NOT EXISTS idx_apikey_org_active 
ON public."ApiKey"("organizationId", "isActive") 
WHERE "organizationId" IS NOT NULL;

-- ============================================================================
-- USER TABLE INDEXES
-- ============================================================================

-- Index for credit-based queries
-- Used in: Finding users with low/no credits for notifications
CREATE INDEX IF NOT EXISTS idx_user_credits 
ON public."User"("credits") 
WHERE "credits" IS NOT NULL;

-- Index for email verification status
-- Used in: Filtering unverified users
CREATE INDEX IF NOT EXISTS idx_user_email_verified 
ON public."User"("emailVerified") 
WHERE "emailVerified" IS NULL;

-- Index for user plan/tier
-- Used in: Plan-based filtering and analytics
CREATE INDEX IF NOT EXISTS idx_user_plan 
ON public."User"("plan") 
WHERE "plan" IS NOT NULL;

-- Index for subscription status
CREATE INDEX IF NOT EXISTS idx_user_subscription_status 
ON public."User"("subscriptionStatus") 
WHERE "subscriptionStatus" IS NOT NULL;

-- ============================================================================
-- ORGANIZATION TABLE INDEXES
-- ============================================================================

-- Index for organization lookups by slug
-- Used in: Custom domain routing, public profile pages
CREATE INDEX IF NOT EXISTS idx_organization_slug 
ON public."Organization"("slug") 
WHERE "slug" IS NOT NULL;

-- Index for active organizations
CREATE INDEX IF NOT EXISTS idx_organization_active 
ON public."Organization"("isActive") 
WHERE "isActive" = true;

-- ============================================================================
-- ORGANIZATION MEMBER TABLE INDEXES
-- ============================================================================

-- Composite index for user's organizations
-- Used in: Dashboard - fetching user's organization memberships
CREATE INDEX IF NOT EXISTS idx_org_member_user_org 
ON public."OrganizationMember"("userId", "organizationId");

-- Index for organization member role
-- Used in: RBAC checks
CREATE INDEX IF NOT EXISTS idx_org_member_role 
ON public."OrganizationMember"("organizationId", "role");

-- Index for active members
CREATE INDEX IF NOT EXISTS idx_org_member_active 
ON public."OrganizationMember"("organizationId", "isActive") 
WHERE "isActive" = true;

-- ============================================================================
-- PAYMENT/BILLING INDEXES
-- ============================================================================

-- Index for payment lookup by external ID
-- Used in: Webhook processing
CREATE INDEX IF NOT EXISTS idx_payment_external_id 
ON public."Payment"("externalPaymentId") 
WHERE "externalPaymentId" IS NOT NULL;

-- Index for user's payment history
CREATE INDEX IF NOT EXISTS idx_payment_user_created 
ON public."Payment"("userId", "createdAt" DESC);

-- Index for failed payments
CREATE INDEX IF NOT EXISTS idx_payment_failed 
ON public."Payment"("status", "createdAt" DESC) 
WHERE "status" = 'failed';

-- Index for subscription payments
CREATE INDEX IF NOT EXISTS idx_payment_subscription 
ON public."Payment"("subscriptionId", "createdAt" DESC) 
WHERE "subscriptionId" IS NOT NULL;

-- ============================================================================
-- AUDIT LOG INDEXES
-- ============================================================================

-- Composite index for audit log queries
-- Used in: Admin dashboard, security monitoring
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action 
ON public."AuditLog"("userId", "action", "createdAt" DESC);

-- Index for audit log by resource
CREATE INDEX IF NOT EXISTS idx_audit_log_resource 
ON public."AuditLog"("resourceType", "resourceId", "createdAt" DESC);

-- Index for recent audit logs
CREATE INDEX IF NOT EXISTS idx_audit_log_created 
ON public."AuditLog"("createdAt" DESC);

-- ============================================================================
-- NOTIFICATION INDEXES
-- ============================================================================

-- Index for unread notifications
-- Used in: Notification dropdown, unread count
CREATE INDEX IF NOT EXISTS idx_notification_user_unread 
ON public."Notification"("userId", "isRead", "createdAt" DESC) 
WHERE "isRead" = false;

-- Index for notification type
CREATE INDEX IF NOT EXISTS idx_notification_type 
ON public."Notification"("userId", "type", "createdAt" DESC);

-- ============================================================================
-- CUSTOM DOMAIN INDEXES
-- ============================================================================

-- Unique index for domain names (enforce uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_domain_unique 
ON public."CustomDomain"("domain") 
WHERE "isActive" = true;

-- Index for verified domains
CREATE INDEX IF NOT EXISTS idx_custom_domain_verified 
ON public."CustomDomain"("isVerified") 
WHERE "isVerified" = true;

-- Index for domain by user
CREATE INDEX IF NOT EXISTS idx_custom_domain_user 
ON public."CustomDomain"("userId", "isActive");

-- ============================================================================
-- BACKGROUND JOB INDEXES
-- ============================================================================

-- Composite index for job processing
-- Used in: Job queue processor
CREATE INDEX IF NOT EXISTS idx_background_job_processing 
ON public."BackgroundJob"("status", "priority" DESC, "runAfter") 
WHERE "status" IN ('pending', 'processing');

-- Index for failed jobs
CREATE INDEX IF NOT EXISTS idx_background_job_failed 
ON public."BackgroundJob"("status", "createdAt" DESC) 
WHERE "status" = 'failed';

-- ============================================================================
-- WEBHOOK OUTBOX INDEXES
-- ============================================================================

-- Index for webhook retry queue
CREATE INDEX IF NOT EXISTS idx_webhook_outbox_retry 
ON public."WebhookOutbox"("status", "nextRetryAt") 
WHERE "status" IN ('pending', 'failed') AND attempts < "maxAttempts";

-- Index for webhook delivery status
CREATE INDEX IF NOT EXISTS idx_webhook_outbox_delivered 
ON public."WebhookOutbox"("qrCodeId", "status", "deliveredAt");

-- ============================================================================
-- RATE LIMIT INDEXES
-- ============================================================================

-- Index for active rate limit windows
CREATE INDEX IF NOT EXISTS idx_rate_limit_active 
ON public."ApiRateLimit"("key", "route", "windowStart" DESC) 
WHERE "windowStart" > NOW() - INTERVAL '1 hour';

-- ============================================================================
-- METRIC INDEXES
-- ============================================================================

-- Index for metrics by name and time
CREATE INDEX IF NOT EXISTS idx_metric_name_timestamp 
ON public."Metric"("name", "timestamp" DESC);

-- Index for request metrics
CREATE INDEX IF NOT EXISTS idx_request_metric_endpoint 
ON public."RequestMetric"("endpoint", "timestamp" DESC);

-- Index for correlation ID lookups
CREATE INDEX IF NOT EXISTS idx_request_metric_correlation 
ON public."RequestMetric"("correlationId");

-- ============================================================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- ============================================================================

-- Index for QR codes created in the last 30 days (for analytics)
CREATE INDEX IF NOT EXISTS idx_qrcode_recent 
ON public."QrCode"("createdAt" DESC) 
WHERE "createdAt" > NOW() - INTERVAL '30 days';

-- Index for high-value users (for marketing)
CREATE INDEX IF NOT EXISTS idx_user_high_value 
ON public."User"("plan", "credits") 
WHERE "plan" IN ('PRO', 'ENTERPRISE') OR "credits" > 100;

-- Index for expiring QR codes (for cleanup and notifications)
CREATE INDEX IF NOT EXISTS idx_qrcode_expiring_soon 
ON public."QrCode"("expiresAt", "userId") 
WHERE "expiresAt" IS NOT NULL 
  AND "expiresAt" > NOW() 
  AND "expiresAt" < NOW() + INTERVAL '7 days';

-- ============================================================================
-- GIN INDEXES FOR JSONB COLUMNS
-- ============================================================================

-- Index for dynamic content search
CREATE INDEX IF NOT EXISTS idx_qrcode_dynamic_content_gin 
ON public."QrCode" USING gin("dynamicContent") 
WHERE "dynamicContent" IS NOT NULL;

-- Index for gradient search
CREATE INDEX IF NOT EXISTS idx_qrcode_gradient_gin 
ON public."QrCode" USING gin("gradient") 
WHERE "gradient" IS NOT NULL;

-- Index for effects search
CREATE INDEX IF NOT EXISTS idx_qrcode_effects_gin 
ON public."QrCode" USING gin("effects") 
WHERE "effects" IS NOT NULL;

-- Index for metadata search in audit logs
CREATE INDEX IF NOT EXISTS idx_audit_log_metadata_gin 
ON public."AuditLog" USING gin("metadata") 
WHERE "metadata" IS NOT NULL;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update table statistics for query planner
ANALYZE public."QrCode";
ANALYZE public."Scan";
ANALYZE public."User";
ANALYZE public."ApiKey";
ANALYZE public."Organization";
ANALYZE public."OrganizationMember";
ANALYZE public."Payment";
ANALYZE public."AuditLog";
ANALYZE public."Notification";
ANALYZE public."CustomDomain";
ANALYZE public."BackgroundJob";
ANALYZE public."WebhookOutbox";
ANALYZE public."ApiRateLimit";
ANALYZE public."Metric";
ANALYZE public."RequestMetric";

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_qrcode_organization_id IS 'Optimizes queries for organization-owned QR codes';
COMMENT ON INDEX idx_qrcode_user_created IS 'Optimizes dashboard queries - most common access pattern';
COMMENT ON INDEX idx_scan_qrcode_created IS 'Optimizes analytics queries for scans per QR code';
COMMENT ON INDEX idx_apikey_hash IS 'Critical for API authentication performance';
COMMENT ON INDEX idx_webhook_outbox_retry IS 'Optimizes webhook retry queue processing';
COMMENT ON INDEX idx_qrcode_dynamic_content_gin IS 'Enables efficient JSONB searches in dynamic content';

-- ============================================================================
-- INDEX STATISTICS
-- ============================================================================

-- Query to check index usage after deployment
-- Run this periodically to verify indexes are being used:
-- 
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

COMMENT ON TABLE public."QrCode" IS 'Performance indexes added: 2025-01-11';

