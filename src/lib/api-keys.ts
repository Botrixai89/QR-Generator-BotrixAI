import crypto from 'crypto'
import { supabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'

export interface ApiKeyData {
  id: string
  userId: string | null
  organizationId: string | null
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

// Generate a new API key
export async function generateApiKey(
  userId: string | null,
  organizationId: string | null,
  name: string,
  scopes: string[],
  expiresAt?: string
): Promise<{ key: string; apiKey: ApiKeyData }> {
  // Validate that either userId or organizationId is provided
  if (!userId && !organizationId) {
    throw new Error('Either userId or organizationId must be provided')
  }

  // Generate a secure random key
  const keyBytes = crypto.randomBytes(32)
  const key = `sk_${keyBytes.toString('base64').replace(/[+/=]/g, (match) => {
    const replacements: Record<string, string> = { '+': '-', '/': '_', '=': '' }
    return replacements[match]
  })}`

  // Get prefix for display
  const keyPrefix = key.substring(0, 12) + '...'

  // Hash the full key for storage
  const keyHash = await bcrypt.hash(key, 12)

  // Insert API key into database
  const { data: apiKey, error } = await supabaseAdmin!
    .from('ApiKey')
    .insert({
      userId: userId || null,
      organizationId: organizationId || null,
      name,
      keyPrefix,
      keyHash,
      scopes,
      expiresAt: expiresAt || null,
      isActive: true,
    })
    .select()
    .single()

  if (error || !apiKey) {
    throw new Error('Failed to create API key')
  }

  return { key, apiKey }
}

// Verify API key and return user/org info
export async function verifyApiKey(key: string): Promise<{
  apiKey: ApiKeyData
  userId: string
  organizationId: string | null
} | null> {
  // Get all active API keys (we need to check all since keys are hashed)
  const { data: apiKeys, error } = await supabaseAdmin!
    .from('ApiKey')
    .select('*')
    .eq('isActive', true)

  if (error || !apiKeys) {
    return null
  }

  // Check if key has expired
  const now = new Date()

  // Try to match the key against all active keys
  for (const apiKey of apiKeys) {
    // Check expiration
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < now) {
      continue
    }

    // Verify the key hash
    const isValid = await bcrypt.compare(key, apiKey.keyHash)
    if (isValid) {
      // Update last used timestamp
      await supabaseAdmin!
        .from('ApiKey')
        .update({ lastUsedAt: new Date().toISOString() })
        .eq('id', apiKey.id)

      return {
        apiKey,
        userId: apiKey.userId || '',
        organizationId: apiKey.organizationId || null,
      }
    }
  }

  return null
}

// Rotate API key (create new, optionally deactivate old)
export async function rotateApiKey(
  oldKeyId: string,
  name?: string,
  deactivateOld: boolean = true
): Promise<{ key: string; apiKey: ApiKeyData }> {
  // Get old key
  const { data: oldKey, error: fetchError } = await supabaseAdmin!
    .from('ApiKey')
    .select('*')
    .eq('id', oldKeyId)
    .single()

  if (fetchError || !oldKey) {
    throw new Error('API key not found')
  }

  // Generate new key with same permissions
  const { key, apiKey } = await generateApiKey(
    oldKey.userId,
    oldKey.organizationId,
    name || oldKey.name,
    oldKey.scopes,
    oldKey.expiresAt
  )

  // Link new key to old key for rotation tracking
  await supabaseAdmin!
    .from('ApiKey')
    .update({ rotatedFromId: oldKeyId })
    .eq('id', apiKey.id)

  // Deactivate old key if requested
  if (deactivateOld) {
    await supabaseAdmin!
      .from('ApiKey')
      .update({ isActive: false })
      .eq('id', oldKeyId)
  }

  return { key, apiKey }
}

// Check if API key has required scope
export function hasScope(apiKey: ApiKeyData, requiredScope: string): boolean {
  return apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes('*')
}

// Record API usage
export async function recordApiUsage(
  apiKeyId: string,
  userId: string | null,
  organizationId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  requestSize: number = 0,
  responseSize: number = 0,
  responseTime: number = 0,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await supabaseAdmin!.from('ApiUsageLog').insert({
      apiKeyId,
      userId,
      organizationId,
      endpoint,
      method,
      statusCode,
      requestSize,
      responseSize,
      responseTime,
      ipAddress,
      userAgent,
    })
  } catch (error) {
    // Don't fail the request if usage logging fails
    console.error('Failed to record API usage:', error)
  }
}

// Get API usage statistics
export async function getApiUsageStats(
  apiKeyId: string | null,
  userId: string | null,
  organizationId: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<{
  requestCount: number
  errorCount: number
  avgResponseTime: number
  totalRequestSize: number
  totalResponseSize: number
}> {
  let query = supabaseAdmin!.from('ApiUsageLog').select('*', { count: 'exact' })

  if (apiKeyId) {
    query = query.eq('apiKeyId', apiKeyId)
  } else if (userId) {
    query = query.eq('userId', userId)
  } else if (organizationId) {
    query = query.eq('organizationId', organizationId)
  }

  if (startDate) {
    query = query.gte('createdAt', startDate.toISOString())
  }
  if (endDate) {
    query = query.lte('createdAt', endDate.toISOString())
  }

  const { data, error } = await query

  if (error || !data) {
    return {
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      totalRequestSize: 0,
      totalResponseSize: 0,
    }
  }

  const requestCount = data.length
  const errorCount = data.filter((log) => log.statusCode >= 400).length
  const totalResponseTime = data.reduce((sum, log) => sum + (log.responseTime || 0), 0)
  const avgResponseTime = requestCount > 0 ? totalResponseTime / requestCount : 0
  const totalRequestSize = data.reduce((sum, log) => sum + (log.requestSize || 0), 0)
  const totalResponseSize = data.reduce((sum, log) => sum + (log.responseSize || 0), 0)

  return {
    requestCount,
    errorCount,
    avgResponseTime,
    totalRequestSize,
    totalResponseSize,
  }
}

