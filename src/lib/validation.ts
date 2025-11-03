/**
 * Centralized Validation Schemas using Zod
 * Provides consistent validation and error responses across all API routes
 */

import { z } from 'zod'
import { NextResponse } from 'next/server'

// Common validation patterns
const emailSchema = z.string().email('Invalid email address').max(255)
const uuidSchema = z.string().uuid('Invalid UUID format')
const urlSchema = z.string().url('Invalid URL format').max(2048)
const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-_]+$/, 'Slug must be lowercase alphanumeric with hyphens/underscores only')

// QR Code schemas
export const qrCodeCreateSchema = z.object({
  url: urlSchema,
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
    .optional(),
  dotType: z.enum(['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded']).optional(),
  cornerType: z.enum(['square', 'rounded', 'dot', 'extra-rounded']).optional(),
  logoUrl: urlSchema.optional(),
  hasWatermark: z.boolean().optional(),
  isDynamic: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxScans: z.number().int().min(0).max(1000000).optional().nullable(),
  redirectUrl: urlSchema.optional(),
  webhookUrl: urlSchema.optional(),
  organizationId: uuidSchema.optional().nullable(),
})

export const qrCodeUpdateSchema = qrCodeCreateSchema.partial().extend({
  id: uuidSchema,
  isActive: z.boolean().optional(),
})

export const qrCodeQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(200).optional(),
})

// User/Auth schemas
export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
})

// Organization schemas
export const organizationCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema,
  description: z.string().max(500).optional(),
})

export const organizationUpdateSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

// API Key schemas
export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z
    .array(
      z.enum([
        'qr:read',
        'qr:write',
        'qr:delete',
        'scan:read',
        'webhook:read',
        'webhook:write',
        'webhook:delete',
        '*',
      ])
    )
    .min(1, 'At least one scope is required'),
  organizationId: uuidSchema.optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export const apiKeyUpdateSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100).optional(),
  scopes: z
    .array(
      z.enum([
        'qr:read',
        'qr:write',
        'qr:delete',
        'scan:read',
        'webhook:read',
        'webhook:write',
        'webhook:delete',
        '*',
      ])
    )
    .optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
})

// Webhook schemas
export const webhookCreateSchema = z.object({
  qrCodeId: uuidSchema,
  webhookUrl: urlSchema,
  regenerateSecret: z.boolean().optional(),
})

// Scan query schemas
export const scanQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
})

// Usage query schemas
export const usageQuerySchema = z.object({
  apiKeyId: uuidSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// Billing schemas
export const billingProfileUpdateSchema = z.object({
  billingEmail: emailSchema.optional(),
  billingName: z.string().max(100).optional(),
  country: z.string().max(2).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
})

// Custom domain schemas
export const customDomainCreateSchema = z.object({
  domain: z.string().min(1).max(253).regex(/^[a-z0-9.-]+$/, 'Invalid domain format'),
})

/**
 * Validates request data against a Zod schema
 * Returns parsed data if valid, or throws a formatted error response
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle both Zod v3 (errors) and Zod v4 (issues)
      const issues = (error as any).issues || (error as any).errors || []
      const formattedErrors = issues.map((err: any) => ({
        field: (err.path || []).join('.'),
        message: err.message || 'Validation error',
        code: err.code || 'invalid_type',
      }))

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation error',
            message: 'Invalid request data',
            details: formattedErrors,
          },
          { status: 400 }
        ),
      }
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Validation error', message: 'Invalid request format' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validates request body from JSON
 */
export async function validateJsonBody<T>(
  schema: z.ZodSchema<T>,
  request: Request
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    return validateRequest(schema, body)
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validates query parameters
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; response: NextResponse } {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return validateRequest(schema, params)
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Validates and sanitizes URL
 */
export function validateAndSanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    // Prevent javascript: and data: URLs
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

