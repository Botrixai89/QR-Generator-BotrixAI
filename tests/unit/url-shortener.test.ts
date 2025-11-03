import { describe, it, expect, beforeEach } from 'vitest'
import {
  shouldShortenUrl,
  createShortUrl,
  extractShortCode,
  storeUrlMapping,
  getOriginalUrl,
  getUserUrlMappings,
} from '@/lib/url-shortener'

describe('URL Shortener', () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.NEXTAUTH_URL
  })

  describe('shouldShortenUrl', () => {
    it('should return true for URLs longer than 100 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(100)
      expect(shouldShortenUrl(longUrl)).toBe(true)
    })

    it('should return false for URLs shorter than 100 characters', () => {
      const shortUrl = 'https://example.com'
      expect(shouldShortenUrl(shortUrl)).toBe(false)
    })

    it('should return false for URLs exactly 100 characters', () => {
      const url = 'https://example.com/' + 'a'.repeat(77) // Total = 100
      expect(shouldShortenUrl(url)).toBe(false)
    })
  })

  describe('createShortUrl', () => {
    it('should create a short URL with default base URL', () => {
      const originalUrl = 'https://example.com/very/long/path'
      const shortUrl = createShortUrl(originalUrl)
      
      expect(shortUrl).toMatch(/^http:\/\/localhost:3000\/s\/[a-z0-9]+$/)
    })

    it('should use NEXTAUTH_URL if set', () => {
      process.env.NEXTAUTH_URL = 'https://app.example.com'
      const originalUrl = 'https://example.com/very/long/path'
      const shortUrl = createShortUrl(originalUrl)
      
      expect(shortUrl).toMatch(/^https:\/\/app\.example\.com\/s\/[a-z0-9]+$/)
    })

    it('should generate consistent short codes for same URL', () => {
      const originalUrl = 'https://example.com/very/long/path'
      const shortUrl1 = createShortUrl(originalUrl)
      const shortUrl2 = createShortUrl(originalUrl)
      
      expect(extractShortCode(shortUrl1)).toBe(extractShortCode(shortUrl2))
    })
  })

  describe('extractShortCode', () => {
    it('should extract short code from valid URL', () => {
      const shortUrl = 'http://localhost:3000/s/abc123'
      const code = extractShortCode(shortUrl)
      
      expect(code).toBe('abc123')
    })

    it('should return null for invalid URL', () => {
      const invalidUrl = 'http://localhost:3000/invalid'
      const code = extractShortCode(invalidUrl)
      
      expect(code).toBeNull()
    })

    it('should return null for URL without short code path', () => {
      const url = 'http://localhost:3000/'
      const code = extractShortCode(url)
      
      expect(code).toBeNull()
    })
  })

  describe('storeUrlMapping', () => {
    it('should store URL mapping', () => {
      const originalUrl = 'https://example.com/test1'
      const mapping = storeUrlMapping(originalUrl)
      
      expect(mapping.originalUrl).toBe(originalUrl)
      expect(mapping.shortCode).toBeTruthy()
      expect(mapping.createdAt).toBeInstanceOf(Date)
    })

    it('should return existing mapping for same URL', () => {
      const originalUrl = 'https://example.com/test2'
      const mapping1 = storeUrlMapping(originalUrl)
      const mapping2 = storeUrlMapping(originalUrl)
      
      expect(mapping1.shortCode).toBe(mapping2.shortCode)
    })

    it('should include userId if provided', () => {
      // Use a unique URL to avoid conflicts with other tests
      const originalUrl = `https://example.com/test-user-${Date.now()}`
      const userId = 'user-123'
      const mapping = storeUrlMapping(originalUrl, userId)
      
      expect(mapping.userId).toBe(userId)
      expect(mapping.originalUrl).toBe(originalUrl)
    })
  })

  describe('getOriginalUrl', () => {
    it('should retrieve original URL from short code', () => {
      const originalUrl = 'https://example.com/test'
      const mapping = storeUrlMapping(originalUrl)
      
      const retrieved = getOriginalUrl(mapping.shortCode)
      expect(retrieved).toBe(originalUrl)
    })

    it('should return null for non-existent short code', () => {
      const retrieved = getOriginalUrl('nonexistent')
      expect(retrieved).toBeNull()
    })
  })

  describe('getUserUrlMappings', () => {
    it('should return URL mappings for user', () => {
      const userId = `user-${Date.now()}-${Math.random()}` // Unique userId
      const url1 = `https://example.com/test1-${Date.now()}`
      const url2 = `https://example.com/test2-${Date.now()}`
      const mapping1 = storeUrlMapping(url1, userId)
      const mapping2 = storeUrlMapping(url2, userId)
      storeUrlMapping(`https://example.com/test3-${Date.now()}`, 'other-user') // Different user
      
      const userMappings = getUserUrlMappings(userId)
      
      expect(userMappings.length).toBe(2)
      expect(userMappings.some(m => m.shortCode === mapping1.shortCode)).toBe(true)
      expect(userMappings.some(m => m.shortCode === mapping2.shortCode)).toBe(true)
    })

    it('should return empty array for user with no mappings', () => {
      const userMappings = getUserUrlMappings('no-mappings-user')
      expect(userMappings).toEqual([])
    })
  })
})

