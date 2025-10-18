// Advanced QR Code Types for Enhanced Customization

export type QRShape = 
  | 'square' 
  | 'circle' 
  | 'heart' 
  | 'hexagon' 
  | 'brain' 
  | 'star' 
  | 'diamond' 
  | 'cloud' 
  | 'flower' 
  | 'shield' 
  | 'gift' 
  | 'cake' 
  | 'coffee' 
  | 'music' 
  | 'car' 
  | 'house' 
  | 'tree' 
  | 'sun' 
  | 'moon' 
  | 'custom'

export type QREyePattern = 
  | 'square' 
  | 'circle' 
  | 'diamond' 
  | 'rounded' 
  | 'extra-rounded' 
  | 'classy' 
  | 'classy-rounded'
  | 'star'
  | 'heart'
  | 'custom'

export type QRCornerPattern = 
  | 'square' 
  | 'rounded' 
  | 'extra-rounded' 
  | 'diamond' 
  | 'star' 
  | 'heart' 
  | 'custom'

export type QRDotPattern = 
  | 'square' 
  | 'rounded' 
  | 'extra-rounded' 
  | 'classy' 
  | 'classy-rounded' 
  | 'dots' 
  | 'circles' 
  | 'diamonds' 
  | 'stars' 
  | 'custom'

export type QRTemplate = 
  | 'business' 
  | 'creative' 
  | 'minimal' 
  | 'vibrant' 
  | 'elegant' 
  | 'playful' 
  | 'tech' 
  | 'nature' 
  | 'retro' 
  | 'modern'

export type QRSticker = 
  | 'christmas-tree' 
  | 'santa' 
  | 'snowman' 
  | 'gift-box' 
  | 'pumpkin' 
  | 'bat' 
  | 'skull' 
  | 'heart-frame' 
  | 'star-frame' 
  | 'circle-frame' 
  | 'gold-frame' 
  | 'silver-frame' 
  | 'rainbow-frame' 
  | 'custom'

export interface QRGradient {
  type: 'linear' | 'radial' | 'conic'
  colors: string[]
  direction?: number // for linear gradients
  centerX?: number // for radial/conic gradients
  centerY?: number // for radial/conic gradients
}

export interface QRStickerConfig {
  type: QRSticker
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'full-frame'
  size: number // percentage of QR code size
  opacity: number // 0-1
  rotation?: number // degrees
  customImage?: string // base64 or URL for custom stickers
}

export interface QRTemplateConfig {
  id: QRTemplate
  name: string
  description: string
  colors: {
    foreground: string
    background: string
    gradient?: QRGradient
  }
  styles: {
    dotType: QRDotPattern
    cornerType: QRCornerPattern
    eyePattern: QREyePattern
  }
  shape?: QRShape
  sticker?: QRStickerConfig
}

export interface AdvancedQROptions {
  // Basic options (existing)
  data: string
  width: number
  height: number
  type?: 'svg' | 'canvas' | 'png'
  
  // Advanced customization
  shape?: QRShape
  customShapePath?: string // SVG path for custom shapes
  
  // Colors and gradients
  foregroundColor?: string
  backgroundColor?: string
  gradient?: QRGradient
  
  // Patterns
  dotType?: QRDotPattern
  cornerType?: QRCornerPattern
  eyePattern?: QREyePattern
  
  // Templates
  template?: QRTemplate
  templateConfig?: QRTemplateConfig
  
  // Stickers and decorations
  sticker?: QRStickerConfig
  stickers?: QRStickerConfig[] // Multiple stickers
  
  // Effects
  effects?: {
    shadow?: boolean
    glow?: boolean
    emboss?: boolean
    blur?: boolean
    threeD?: boolean
  }
  
  // Logo and watermark
  logo?: {
    image: string
    size: number
    margin: number
    opacity: number
  }
  watermark?: boolean
  
  // Custom styling
  customCSS?: string
  customSVG?: string
}

export interface QRCodePreview {
  id: string
  name: string
  thumbnail: string
  config: AdvancedQROptions
  category: 'shapes' | 'templates' | 'stickers' | 'colors' | 'styles'
}

// Pre-defined templates
export const QR_TEMPLATES: Record<QRTemplate, QRTemplateConfig> = {
  business: {
    id: 'business',
    name: 'Business',
    description: 'Professional and clean design',
    colors: {
      foreground: '#1a365d',
      background: '#ffffff',
    },
    styles: {
      dotType: 'rounded',
      cornerType: 'rounded',
      eyePattern: 'rounded',
    },
  },
  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Vibrant and artistic design',
    colors: {
      foreground: '#e53e3e',
      background: '#ffffff',
      gradient: {
        type: 'linear',
        colors: ['#e53e3e', '#f56565'],
        direction: 45,
      },
    },
    styles: {
      dotType: 'extra-rounded',
      cornerType: 'extra-rounded',
      eyePattern: 'extra-rounded',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant design',
    colors: {
      foreground: '#000000',
      background: '#ffffff',
    },
    styles: {
      dotType: 'square',
      cornerType: 'square',
      eyePattern: 'square',
    },
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bright and energetic design',
    colors: {
      foreground: '#9f7aea',
      background: '#ffffff',
      gradient: {
        type: 'radial',
        colors: ['#9f7aea', '#ed64a6'],
        centerX: 50,
        centerY: 50,
      },
    },
    styles: {
      dotType: 'circles',
      cornerType: 'rounded',
      eyePattern: 'rounded',
    },
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated and refined design',
    colors: {
      foreground: '#2d3748',
      background: '#f7fafc',
    },
    styles: {
      dotType: 'classy',
      cornerType: 'classy',
      eyePattern: 'classy',
    },
  },
  playful: {
    id: 'playful',
    name: 'Playful',
    description: 'Fun and whimsical design',
    colors: {
      foreground: '#38b2ac',
      background: '#ffffff',
    },
    styles: {
      dotType: 'stars',
      cornerType: 'heart',
      eyePattern: 'heart',
    },
    shape: 'heart',
  },
  tech: {
    id: 'tech',
    name: 'Tech',
    description: 'Modern and technological design',
    colors: {
      foreground: '#00d4aa',
      background: '#1a202c',
    },
    styles: {
      dotType: 'diamonds',
      cornerType: 'diamond',
      eyePattern: 'diamond',
    },
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    description: 'Organic and natural design',
    colors: {
      foreground: '#38a169',
      background: '#f0fff4',
    },
    styles: {
      dotType: 'circles',
      cornerType: 'rounded',
      eyePattern: 'rounded',
    },
    shape: 'circle',
  },
  retro: {
    id: 'retro',
    name: 'Retro',
    description: 'Vintage and nostalgic design',
    colors: {
      foreground: '#d69e2e',
      background: '#fffaf0',
    },
    styles: {
      dotType: 'classy-rounded',
      cornerType: 'classy-rounded',
      eyePattern: 'classy-rounded',
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary and sleek design',
    colors: {
      foreground: '#4a5568',
      background: '#ffffff',
    },
    styles: {
      dotType: 'extra-rounded',
      cornerType: 'extra-rounded',
      eyePattern: 'extra-rounded',
    },
  },
}

// Pre-defined stickers
export const QR_STICKERS: Record<QRSticker, QRStickerConfig> = {
  'christmas-tree': {
    type: 'christmas-tree',
    position: 'full-frame',
    size: 100,
    opacity: 0.8,
  },
  'santa': {
    type: 'santa',
    position: 'top-right',
    size: 20,
    opacity: 0.9,
  },
  'snowman': {
    type: 'snowman',
    position: 'bottom-left',
    size: 25,
    opacity: 0.8,
  },
  'gift-box': {
    type: 'gift-box',
    position: 'center',
    size: 30,
    opacity: 0.7,
  },
  'pumpkin': {
    type: 'pumpkin',
    position: 'full-frame',
    size: 100,
    opacity: 0.8,
  },
  'bat': {
    type: 'bat',
    position: 'top-left',
    size: 15,
    opacity: 0.9,
  },
  'skull': {
    type: 'skull',
    position: 'center',
    size: 25,
    opacity: 0.8,
  },
  'heart-frame': {
    type: 'heart-frame',
    position: 'full-frame',
    size: 100,
    opacity: 0.6,
  },
  'star-frame': {
    type: 'star-frame',
    position: 'full-frame',
    size: 100,
    opacity: 0.5,
  },
  'circle-frame': {
    type: 'circle-frame',
    position: 'full-frame',
    size: 100,
    opacity: 0.4,
  },
  'gold-frame': {
    type: 'gold-frame',
    position: 'full-frame',
    size: 100,
    opacity: 0.7,
  },
  'silver-frame': {
    type: 'silver-frame',
    position: 'full-frame',
    size: 100,
    opacity: 0.6,
  },
  'rainbow-frame': {
    type: 'rainbow-frame',
    position: 'full-frame',
    size: 100,
    opacity: 0.5,
  },
  'custom': {
    type: 'custom',
    position: 'center',
    size: 20,
    opacity: 0.8,
  },
}
