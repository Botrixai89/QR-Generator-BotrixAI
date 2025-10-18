/**
 * URL Shortening utility functions
 * This creates a simple URL shortening mechanism without external dependencies
 */

// Simple hash function to create short URLs
function generateShortCode(url: string): string {
  let hash = 0
  if (url.length === 0) return hash.toString()
  
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Convert to base36 and take first 8 characters
  return Math.abs(hash).toString(36).substring(0, 8)
}

/**
 * Determines if a URL should be shortened
 * URLs longer than 100 characters are considered for shortening
 */
export function shouldShortenUrl(url: string): boolean {
  return url.length > 100
}

/**
 * Creates a short URL using the current domain
 * @param originalUrl - The original long URL
 * @returns A shortened URL using the current domain
 */
export function createShortUrl(originalUrl: string): string {
  const shortCode = generateShortCode(originalUrl)
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/s/${shortCode}`
}

/**
 * Extracts the short code from a short URL
 * @param shortUrl - The shortened URL
 * @returns The short code
 */
export function extractShortCode(shortUrl: string): string | null {
  const match = shortUrl.match(/\/s\/([a-zA-Z0-9]+)$/)
  return match ? match[1] : null
}

/**
 * Creates a URL mapping for storage
 * This would typically be stored in a database
 */
export interface UrlMapping {
  shortCode: string
  originalUrl: string
  createdAt: Date
  userId?: string
}

/**
 * Simple in-memory storage for URL mappings
 * In production, this should be replaced with a database
 */
const urlMappings = new Map<string, UrlMapping>()

/**
 * Stores a URL mapping
 * @param originalUrl - The original URL
 * @param userId - Optional user ID
 * @returns The URL mapping
 */
export function storeUrlMapping(originalUrl: string, userId?: string): UrlMapping {
  const shortCode = generateShortCode(originalUrl)
  
  // Check if mapping already exists
  let mapping = urlMappings.get(shortCode)
  if (mapping && mapping.originalUrl === originalUrl) {
    return mapping
  }
  
  // Create new mapping
  mapping = {
    shortCode,
    originalUrl,
    createdAt: new Date(),
    userId
  }
  
  urlMappings.set(shortCode, mapping)
  return mapping
}

/**
 * Retrieves the original URL from a short code
 * @param shortCode - The short code
 * @returns The original URL or null if not found
 */
export function getOriginalUrl(shortCode: string): string | null {
  const mapping = urlMappings.get(shortCode)
  return mapping ? mapping.originalUrl : null
}

/**
 * Gets all URL mappings for a user
 * @param userId - The user ID
 * @returns Array of URL mappings
 */
export function getUserUrlMappings(userId: string): UrlMapping[] {
  return Array.from(urlMappings.values()).filter(mapping => mapping.userId === userId)
}
