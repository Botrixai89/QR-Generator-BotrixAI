/**
 * Image Optimization Utilities
 * Handles image optimization, compression, and cache headers
 */

// Dynamic import for sharp (server-side only)
let sharpInstance: any = null

async function getSharp() {
  if (typeof window !== 'undefined') {
    throw new Error('Image optimization is only available server-side')
  }
  
  if (!sharpInstance) {
    try {
      const sharpModule = await import('sharp')
      sharpInstance = sharpModule.default
    } catch (error) {
      console.error('Failed to load sharp:', error)
      throw new Error('Image optimization library not available')
    }
  }
  
  return sharpInstance
}

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 1-100
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  progressive?: boolean
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 85,
  format: 'webp',
  progressive: true,
}

/**
 * Optimize image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options }

  const sharp = await getSharp()
  let sharpInstance = sharp(buffer)

  // Resize if needed
  if (finalOptions.maxWidth || finalOptions.maxHeight) {
    sharpInstance = sharpInstance.resize(
      finalOptions.maxWidth,
      finalOptions.maxHeight,
      {
        fit: 'inside',
        withoutEnlargement: true,
      }
    )
  }

  // Convert format
  switch (finalOptions.format) {
    case 'webp':
      return await sharpInstance
        .webp({ quality: finalOptions.quality, progressive: finalOptions.progressive })
        .toBuffer()
    case 'jpeg':
      return await sharpInstance
        .jpeg({ quality: finalOptions.quality, progressive: finalOptions.progressive })
        .toBuffer()
    case 'png':
      return await sharpInstance
        .png({ quality: finalOptions.quality, progressive: finalOptions.progressive })
        .toBuffer()
    case 'avif':
      return await sharpInstance
        .avif({ quality: finalOptions.quality })
        .toBuffer()
    default:
      return await sharpInstance.toBuffer()
  }
}

/**
 * Generate image cache headers
 */
export function getImageCacheHeaders(maxAge: number = 31536000): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${maxAge}, immutable`,
    'Content-Type': 'image/webp',
    'X-Content-Type-Options': 'nosniff',
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, WebP, or SVG).',
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Please upload an image smaller than 5MB.',
    }
  }

  return { valid: true }
}

/**
 * Generate optimized image URL (for CDN)
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  const params = new URLSearchParams()

  if (options.maxWidth) params.set('w', options.maxWidth.toString())
  if (options.maxHeight) params.set('h', options.maxHeight.toString())
  if (options.quality) params.set('q', options.quality.toString())
  if (options.format) params.set('f', options.format)

  // In production, this would go through a CDN image optimization service
  // For now, return original URL with params for future implementation
  if (params.toString()) {
    return `${imageUrl}?${params.toString()}`
  }

  return imageUrl
}

