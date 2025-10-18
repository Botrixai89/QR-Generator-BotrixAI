# Advanced QR Code Features

This document describes the advanced QR code customization features implemented in the QR Generator application.

## Overview

The advanced QR code system extends the basic QR code generation with sophisticated customization options including:

- **Custom Shapes**: Heart, circle, star, hexagon, and more
- **Pre-designed Templates**: Business, creative, minimal, and other professional templates
- **Stickers & Frames**: Decorative elements and holiday-themed stickers
- **Gradient Colors**: Linear, radial, and conic gradients
- **Visual Effects**: Shadows, glow, 3D effects, and more
- **Advanced Patterns**: Custom dot types, corner styles, and eye patterns

## Architecture

### Core Components

1. **Advanced QR Code Generator** (`src/lib/qr-code-advanced.ts`)
   - Main class for generating QR codes with advanced features
   - Handles custom shapes, gradients, stickers, and effects
   - Extends the base `qr-code-styling` library

2. **Customization Panel** (`src/components/qr-customization-panel.tsx`)
   - UI component for advanced customization options
   - Tabbed interface for different customization categories
   - Real-time preview updates

3. **Advanced Generator Component** (`src/components/advanced-qr-generator.tsx`)
   - Main interface for the advanced QR generator
   - Integrates all customization features
   - Handles form submission and QR code generation

### Type Definitions

The advanced features are defined in `src/types/qr-code-advanced.ts`:

```typescript
interface AdvancedQROptions {
  data: string
  width: number
  height: number
  type?: 'svg' | 'canvas' | 'png'
  
  // Advanced customization
  shape?: QRShape
  customShapePath?: string
  
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
  stickers?: QRStickerConfig[]
  
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
}
```

## Features

### 1. Custom Shapes

Support for various QR code shapes:

- **Basic Shapes**: Square, circle, diamond
- **Organic Shapes**: Heart, star, hexagon
- **Themed Shapes**: Brain, flower, shield, gift, cake
- **Custom Shapes**: User-defined SVG paths

```typescript
const shapePaths = {
  circle: `M${width/2},0 A${width/2},${height/2} 0 1,1 ${width/2},${height} A${width/2},${height/2} 0 1,1 ${width/2},0`,
  heart: `M${width/2},${height*0.7} C${width/2},${height*0.7} ${width*0.1},${height*0.3} ${width*0.1},${height*0.5} C${width*0.1},${height*0.6} ${width*0.2},${height*0.7} ${width*0.3},${height*0.7} C${width*0.4},${height*0.7} ${width/2},${height*0.9} ${width/2},${height*0.9} C${width/2},${height*0.9} ${width*0.6},${height*0.7} ${width*0.7},${height*0.7} C${width*0.8},${height*0.7} ${width*0.9},${height*0.6} ${width*0.9},${height*0.5} C${width*0.9},${height*0.3} ${width/2},${height*0.7} ${width/2},${height*0.7} Z`,
  star: `M${width/2},0 L${width*0.6},${height*0.4} L${width},${height*0.4} L${width*0.7},${height*0.6} L${width*0.8},${height} L${width/2},${height*0.8} L${width*0.2},${height} L${width*0.3},${height*0.6} L0,${height*0.4} L${width*0.4},${height*0.4} Z`
}
```

### 2. Pre-designed Templates

Professional templates for different use cases:

- **Business**: Professional blue theme with rounded corners
- **Creative**: Vibrant red gradient with extra-rounded style
- **Minimal**: Clean black and white design
- **Vibrant**: Purple radial gradient with circular dots
- **Elegant**: Sophisticated gray theme with classy style
- **Playful**: Teal theme with heart corners and star dots
- **Tech**: Modern green on dark background
- **Nature**: Organic green theme with circular elements
- **Retro**: Vintage yellow theme with classy-rounded style
- **Modern**: Contemporary design with extra-rounded elements

### 3. Gradient Support

Three types of gradients:

- **Linear Gradients**: Directional color transitions
- **Radial Gradients**: Circular color transitions from center
- **Conic Gradients**: Angular color transitions

```typescript
interface QRGradient {
  type: 'linear' | 'radial' | 'conic'
  colors: string[]
  direction?: number // for linear gradients
  centerX?: number // for radial/conic gradients
  centerY?: number // for radial/conic gradients
}
```

### 4. Stickers & Frames

Decorative elements for QR codes:

- **Holiday Stickers**: Christmas trees, Santa, snowmen, pumpkins, bats
- **Frame Styles**: Heart, star, circle, gold, silver, rainbow frames
- **Custom Stickers**: User-uploaded images
- **Positioning**: Top-left, top-right, bottom-left, bottom-right, center, full-frame

### 5. Visual Effects

Advanced visual effects:

- **Shadow**: Drop shadow effect
- **Glow**: Outer glow effect
- **3D Effect**: Three-dimensional appearance
- **Emboss**: Raised surface effect
- **Blur**: Blurred edges effect

### 6. Advanced Patterns

Enhanced dot and corner patterns:

- **Dot Types**: Square, rounded, extra-rounded, classy, classy-rounded, dots, circles, diamonds, stars
- **Corner Types**: Square, rounded, extra-rounded, diamond, star, heart
- **Eye Patterns**: Square, circle, diamond, rounded, extra-rounded, classy, classy-rounded, star, heart

## Database Schema

The database has been extended to support advanced features:

```sql
-- Advanced QR code customization columns
ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'square';

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS template TEXT;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "eyePattern" TEXT DEFAULT 'square';

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS gradient JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS sticker JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS effects JSONB;

ALTER TABLE public."QrCode" 
ADD COLUMN IF NOT EXISTS "customStyling" JSONB;
```

## Usage

### Basic Usage

```typescript
import { createAdvancedQR } from '@/lib/qr-code-advanced'

const qrGenerator = createAdvancedQR({
  data: 'https://example.com',
  width: 300,
  height: 300,
  shape: 'heart',
  gradient: {
    type: 'linear',
    colors: ['#ff6b6b', '#4ecdc4'],
    direction: 45
  },
  effects: {
    shadow: true,
    glow: true
  }
})

await qrGenerator.generate(containerElement)
```

### Template Usage

```typescript
import { applyTemplateToQR } from '@/lib/qr-code-advanced'

const qrGenerator = createAdvancedQR({
  data: 'https://example.com',
  width: 300,
  height: 300
})

applyTemplateToQR(qrGenerator, 'business')
```

### Custom Shape Usage

```typescript
const qrGenerator = createAdvancedQR({
  data: 'https://example.com',
  width: 300,
  height: 300,
  shape: 'custom',
  customShapePath: 'M50,0 L100,50 L50,100 L0,50 Z' // Custom SVG path
})
```

## API Integration

The API has been updated to handle advanced features:

```typescript
// POST /api/qr-codes
const formData = new FormData()
formData.append('url', 'https://example.com')
formData.append('shape', 'heart')
formData.append('template', 'business')
formData.append('gradient', JSON.stringify({
  type: 'linear',
  colors: ['#ff6b6b', '#4ecdc4'],
  direction: 45
}))
formData.append('sticker', JSON.stringify({
  type: 'heart-frame',
  position: 'full-frame',
  size: 100,
  opacity: 0.6
}))
formData.append('effects', JSON.stringify({
  shadow: true,
  glow: true,
  threeD: false
}))
```

## UI Components

### Customization Panel

The customization panel provides a tabbed interface:

1. **Templates Tab**: Pre-designed professional templates
2. **Shapes Tab**: Custom QR code shapes
3. **Stickers Tab**: Decorative stickers and frames
4. **Colors Tab**: Color pickers and gradient controls
5. **Styles Tab**: Advanced pattern and effect options

### Navigation Integration

The navigation has been updated to include:

- **Advanced Generator Link**: Direct access to advanced features
- **Sparkles Icon**: Visual indicator for advanced features

## File Structure

```
src/
├── types/
│   └── qr-code-advanced.ts          # Type definitions
├── lib/
│   └── qr-code-advanced.ts          # Core advanced QR logic
├── components/
│   ├── qr-customization-panel.tsx   # Customization UI
│   ├── advanced-qr-generator.tsx    # Main advanced generator
│   └── qr-generator.tsx             # Updated basic generator
├── app/
│   ├── advanced/
│   │   └── page.tsx                 # Advanced generator page
│   └── api/
│       └── qr-codes/
│           └── route.ts             # Updated API endpoints
└── components/
    └── navigation.tsx               # Updated navigation
```

## Migration

To set up the advanced features:

1. **Run Database Migration**:
   ```bash
   node setup-advanced-qr.js
   ```

2. **Update Environment Variables**:
   Ensure all required environment variables are set.

3. **Test Features**:
   Navigate to `/advanced` to test the new features.

## Performance Considerations

- **SVG Rendering**: Advanced features use SVG for better quality and scalability
- **Lazy Loading**: Templates and stickers are loaded on demand
- **Caching**: Generated QR codes are cached for better performance
- **Optimization**: Large stickers and effects are optimized for web delivery

## Browser Support

- **Modern Browsers**: Full support for all advanced features
- **SVG Support**: Required for custom shapes and gradients
- **Canvas Support**: Fallback for older browsers
- **File API**: Required for custom sticker uploads

## Future Enhancements

- **Animation Effects**: Animated QR codes
- **3D Rendering**: True 3D QR code effects
- **AI-Generated Templates**: AI-powered template suggestions
- **Collaborative Features**: Shared template libraries
- **Export Options**: Additional export formats (PDF, EPS, etc.)

## Troubleshooting

### Common Issues

1. **SVG Not Rendering**: Check browser SVG support
2. **Gradients Not Showing**: Verify gradient configuration
3. **Stickers Not Loading**: Check file upload permissions
4. **Effects Not Applied**: Ensure effects configuration is valid

### Debug Mode

Enable debug mode by setting:
```typescript
const qrGenerator = createAdvancedQR({
  // ... options
  debug: true
})
```

This will log detailed information about the QR generation process.

## Contributing

When adding new features:

1. **Update Types**: Add new types to `qr-code-advanced.ts`
2. **Extend Generator**: Add functionality to `AdvancedQRCodeGenerator`
3. **Update UI**: Add controls to `QRCustomizationPanel`
4. **Update API**: Handle new fields in the API endpoints
5. **Update Database**: Add new columns if needed
6. **Add Tests**: Create tests for new functionality
7. **Update Documentation**: Update this README

## License

This advanced QR code system is part of the QR Generator application and follows the same license terms.