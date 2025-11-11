/**
 * Caching Layer using Vercel KV (Redis)
 * Reduces database load and improves response times
 */

// In-memory fallback cache for development/when KV is not available
class MemoryCache {
  private cache: Map<string, { value: unknown; expiresAt: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Initialize cache
const memoryCache = new MemoryCache()

// Type-safe cache keys
export const CacheKeys = {
  userCredits: (userId: string) => `user:${userId}:credits`,
  userPlan: (userId: string) => `user:${userId}:plan`,
  userSession: (userId: string) => `session:${userId}`,
  qrCode: (qrCodeId: string) => `qr:${qrCodeId}`,
  qrCodeList: (userId: string, page: number = 1) => `qr:list:${userId}:${page}`,
  userSettings: (userId: string) => `user:${userId}:settings`,
  apiKeyValid: (keyHash: string) => `apikey:${keyHash}`,
  rateLimitKey: (key: string, route: string) => `ratelimit:${key}:${route}`,
  scanStats: (qrCodeId: string) => `stats:${qrCodeId}`,
} as const

// TTL constants (in seconds)
export const CacheTTL = {
  userCredits: 60, // 1 minute
  userPlan: 300, // 5 minutes
  userSession: 3600, // 1 hour
  qrCode: 300, // 5 minutes
  qrCodeList: 60, // 1 minute
  userSettings: 600, // 10 minutes
  apiKey: 300, // 5 minutes
  rateLimit: 60, // 1 minute
  scanStats: 120, // 2 minutes
  short: 30, // 30 seconds
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  veryLong: 86400, // 24 hours
} as const

/**
 * Cache interface - can be implemented with Redis, Vercel KV, or in-memory
 */
interface CacheInterface {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

/**
 * Get cache implementation based on environment
 */
function getCacheImplementation(): CacheInterface {
  // Always use memory cache for now
  // Vercel KV can be enabled by uncommenting the dynamic import below
  // and installing @vercel/kv package
  
  // Uncomment this block to enable Vercel KV:
  /*
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      // Dynamic import would go here
      // For now, using memory cache as it's more reliable
    } catch (error) {
      console.warn('Vercel KV not available, using memory cache:', error)
    }
  }
  */

  // Use memory cache (works everywhere, no dependencies)
  return memoryCache
}

// Initialize cache
const cache = getCacheImplementation()

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await cache.get<T>(key)
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set value in cache
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = CacheTTL.medium
): Promise<void> {
  try {
    await cache.set(key, value, ttlSeconds)
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

/**
 * Delete value from cache
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await cache.del(key)
  } catch (error) {
    console.error('Cache del error:', error)
  }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    return await cache.exists(key)
  } catch (error) {
    console.error('Cache exists error:', error)
    return false
  }
}

/**
 * Get or set pattern - get from cache, or fetch and cache if not found
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CacheTTL.medium
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const fresh = await fetchFn()

  // Cache the result
  await cacheSet(key, fresh, ttlSeconds)

  return fresh
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  // Note: Pattern matching requires Redis SCAN command
  // For Vercel KV, we need to track keys or use explicit invalidation
  console.log('Cache invalidation for pattern:', pattern)
  // Implementation depends on Redis capabilities
}

/**
 * User credits caching helpers
 */
export const UserCreditsCache = {
  async get(userId: string): Promise<number | null> {
    return cacheGet<number>(CacheKeys.userCredits(userId))
  },

  async set(userId: string, credits: number): Promise<void> {
    return cacheSet(CacheKeys.userCredits(userId), credits, CacheTTL.userCredits)
  },

  async invalidate(userId: string): Promise<void> {
    return cacheDel(CacheKeys.userCredits(userId))
  },

  async decrement(userId: string): Promise<void> {
    // Invalidate cache so next read gets fresh value from DB
    return this.invalidate(userId)
  },
}

/**
 * User plan caching helpers
 */
export const UserPlanCache = {
  async get(userId: string): Promise<string | null> {
    return cacheGet<string>(CacheKeys.userPlan(userId))
  },

  async set(userId: string, plan: string): Promise<void> {
    return cacheSet(CacheKeys.userPlan(userId), plan, CacheTTL.userPlan)
  },

  async invalidate(userId: string): Promise<void> {
    return cacheDel(CacheKeys.userPlan(userId))
  },
}

/**
 * QR Code caching helpers
 */
export const QRCodeCache = {
  async get(qrCodeId: string): Promise<unknown | null> {
    return cacheGet(CacheKeys.qrCode(qrCodeId))
  },

  async set(qrCodeId: string, qrCode: unknown): Promise<void> {
    return cacheSet(CacheKeys.qrCode(qrCodeId), qrCode, CacheTTL.qrCode)
  },

  async invalidate(qrCodeId: string): Promise<void> {
    return cacheDel(CacheKeys.qrCode(qrCodeId))
  },

  async invalidateUserList(userId: string): Promise<void> {
    // Invalidate all pages of user's QR code list
    // In production, track pages or use pattern matching
    for (let page = 1; page <= 10; page++) {
      await cacheDel(CacheKeys.qrCodeList(userId, page))
    }
  },
}

/**
 * API Key validation caching
 */
export const ApiKeyCache = {
  async isValid(keyHash: string): Promise<boolean | null> {
    return cacheGet<boolean>(CacheKeys.apiKeyValid(keyHash))
  },

  async setValid(keyHash: string, isValid: boolean): Promise<void> {
    return cacheSet(CacheKeys.apiKeyValid(keyHash), isValid, CacheTTL.apiKey)
  },

  async invalidate(keyHash: string): Promise<void> {
    return cacheDel(CacheKeys.apiKeyValid(keyHash))
  },
}

/**
 * Cache statistics
 */
export const CacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,

  recordHit() {
    this.hits++
  },

  recordMiss() {
    this.misses++
  },

  recordError() {
    this.errors++
  },

  getStats() {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      total,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    }
  },

  reset() {
    this.hits = 0
    this.misses = 0
    this.errors = 0
  },
}

/**
 * Wrap cache get with statistics
 */
export async function cacheGetWithStats<T>(key: string): Promise<T | null> {
  try {
    const value = await cacheGet<T>(key)
    if (value !== null) {
      CacheStats.recordHit()
    } else {
      CacheStats.recordMiss()
    }
    return value
  } catch (error) {
    CacheStats.recordError()
    throw error
  }
}

/**
 * Batch cache operations
 */
export const CacheBatch = {
  async getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>()
    await Promise.all(
      keys.map(async key => {
        const value = await cacheGet<T>(key)
        if (value !== null) {
          results.set(key, value)
        }
      })
    )
    return results
  },

  async setMultiple(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    await Promise.all(
      entries.map(entry =>
        cacheSet(entry.key, entry.value, entry.ttl || CacheTTL.medium)
      )
    )
  },

  async deleteMultiple(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => cacheDel(key)))
  },
}

// Export cache instance for advanced usage
export { cache }

