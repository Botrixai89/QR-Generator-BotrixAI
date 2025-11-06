import QRCodeStyling from 'qr-code-styling'
import { 
  AdvancedQROptions, 
  QRGradient, 
  QRStickerConfig, 
  QR_TEMPLATES
} from '@/types/qr-code-advanced'

// Advanced QR Code Generator Class
export class AdvancedQRCodeGenerator {
  private qrCode: QRCodeStyling | null = null
  private container: HTMLElement | null = null
  private options: AdvancedQROptions

  constructor(options: AdvancedQROptions) {
    this.options = options
  }

  // Map custom dot types to QRCodeStyling types
  private mapDotType(dotType: string): 'square' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded' | 'dots' {
    const mapping: Record<string, 'square' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded' | 'dots'> = {
      'square': 'square',
      'rounded': 'rounded',
      'extra-rounded': 'extra-rounded',
      'classy': 'classy',
      'classy-rounded': 'classy-rounded',
      'dots': 'dots',
      'circles': 'dots', // map circles to dots
      'diamonds': 'dots', // map diamonds to dots
      'stars': 'dots', // map stars to dots
      'custom': 'square' // fallback to square for custom
    }
    return mapping[dotType] || 'square'
  }

  // Map custom corner types to QRCodeStyling types
  private mapCornerType(cornerType: string): 'square' | 'rounded' | 'extra-rounded' {
    const mapping: Record<string, 'square' | 'rounded' | 'extra-rounded'> = {
      'square': 'square',
      'rounded': 'rounded',
      'extra-rounded': 'extra-rounded',
      'diamond': 'square', // fallback to square
      'star': 'square', // fallback to square
      'heart': 'square', // fallback to square
      'classy': 'rounded', // map to rounded
      'classy-rounded': 'extra-rounded', // map to extra-rounded
      'circle': 'rounded', // map to rounded
      'custom': 'square' // fallback to square
    }
    return mapping[cornerType] || 'square'
  }

  // Generate QR code with advanced features
  async generate(container: HTMLElement): Promise<void> {
    this.container = container
    container.innerHTML = ''

    // Apply template settings first if specified
    let finalOptions = { ...this.options }
    if (this.options.template) {
      const template = QR_TEMPLATES[this.options.template as keyof typeof QR_TEMPLATES]
      if (template) {
        finalOptions = {
          ...finalOptions,
          foregroundColor: template.colors.foreground,
          backgroundColor: template.colors.background,
          gradient: template.colors.gradient,
          dotType: template.styles.dotType,
          cornerType: template.styles.cornerType,
          eyePattern: template.styles.eyePattern,
          shape: template.shape || finalOptions.shape,
          sticker: template.sticker || finalOptions.sticker,
        }
      }
    }

    // Create base QR code with final options
    this.qrCode = new QRCodeStyling({
      width: finalOptions.width,
      height: finalOptions.height,
      type: (finalOptions.type === 'png' ? 'svg' : finalOptions.type) as 'svg' | 'canvas',
      data: finalOptions.data,
      image: finalOptions.logo?.image,
      imageOptions: {
        imageSize: finalOptions.logo ? Math.max(0.05, Math.min(0.9, finalOptions.logo.size || 0.25)) : 0.25,
        margin: typeof finalOptions.logo?.margin === 'number' ? finalOptions.logo.margin : (finalOptions.logo ? 6 : 0),
        crossOrigin: 'anonymous',
        hideBackgroundDots: !!finalOptions.logo,
      },
      dotsOptions: {
        color: finalOptions.foregroundColor || '#000000',
        type: this.mapDotType(finalOptions.dotType || 'square'),
      },
      backgroundOptions: {
        color: finalOptions.backgroundColor || '#ffffff',
      },
      cornersSquareOptions: {
        color: finalOptions.foregroundColor || '#000000',
        type: this.mapCornerType(finalOptions.cornerType || 'square'),
      },
      cornersDotOptions: {
        color: finalOptions.foregroundColor || '#000000',
        type: this.mapDotType(finalOptions.dotType || 'square'),
      },
    })

    // Append base QR code
    this.qrCode.append(container)

    // Apply advanced features
    await this.applyAdvancedFeatures()
  }

  // Apply all advanced features
  private async applyAdvancedFeatures(): Promise<void> {
    if (!this.container || !this.qrCode) return

    const svg = this.container.querySelector('svg')
    if (!svg) return

    // Apply template if specified
    if (this.options.template) {
      await this.applyTemplate(this.options.template)
    }

    // Apply custom shape
    if (this.options.shape && this.options.shape !== 'square') {
      await this.applyCustomShape(this.options.shape)
    }

    // Apply gradient
    if (this.options.gradient) {
      await this.applyGradient(this.options.gradient)
    }

    // Apply stickers
    if (this.options.sticker) {
      await this.applySticker(this.options.sticker)
    }

    // Apply effects
    if (this.options.effects) {
      await this.applyEffects(this.options.effects)
    }

    // Apply watermark
    if (this.options.watermark) {
      await this.applyWatermark()
    }
  }

  // Apply template configuration
  private async applyTemplate(_templateId: string): Promise<void> {
    // Template is already applied during QR code generation
    // This method is kept for backward compatibility but does nothing
    // since template settings are applied in the generate method
    void _templateId // Mark parameter as intentionally unused
    return
  }

  // Apply custom shape mask
  private async applyCustomShape(shape: string): Promise<void> {
    if (!this.container) return

    const svg = this.container.querySelector('svg')
    if (!svg) return

    // Skip if shape is square (default)
    if (shape === 'square') return

    const shapeMask = this.createShapeMask(shape, this.options.width, this.options.height)
    if (shapeMask) {
      // Create mask definition
      let defs = svg.querySelector('defs')
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        svg.insertBefore(defs, svg.firstChild)
      }

      const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask')
      mask.setAttribute('id', `shape-mask-${shape}`)
      mask.appendChild(shapeMask)
      defs.appendChild(mask)

      // Apply mask to the entire QR code group
      const qrGroup = svg.querySelector('g') || svg
      qrGroup.setAttribute('mask', `url(#shape-mask-${shape})`)
    }
  }

  // Create shape mask SVG element
  private createShapeMask(shape: string, width: number, height: number): SVGElement | null {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    
    // Set up white background
    rect.setAttribute('width', width.toString())
    rect.setAttribute('height', height.toString())
    rect.setAttribute('fill', 'white')

    // Define shape paths
    const shapePaths: Record<string, string> = {
      circle: `M${width/2},0 A${width/2},${height/2} 0 1,1 ${width/2},${height} A${width/2},${height/2} 0 1,1 ${width/2},0`,
      heart: `M${width/2},${height*0.7} C${width/2},${height*0.7} ${width*0.1},${height*0.3} ${width*0.1},${height*0.5} C${width*0.1},${height*0.6} ${width*0.2},${height*0.7} ${width*0.3},${height*0.7} C${width*0.4},${height*0.7} ${width/2},${height*0.9} ${width/2},${height*0.9} C${width/2},${height*0.9} ${width*0.6},${height*0.7} ${width*0.7},${height*0.7} C${width*0.8},${height*0.7} ${width*0.9},${height*0.6} ${width*0.9},${height*0.5} C${width*0.9},${height*0.3} ${width/2},${height*0.7} ${width/2},${height*0.7} Z`,
      star: `M${width/2},0 L${width*0.6},${height*0.4} L${width},${height*0.4} L${width*0.7},${height*0.6} L${width*0.8},${height} L${width/2},${height*0.8} L${width*0.2},${height} L${width*0.3},${height*0.6} L0,${height*0.4} L${width*0.4},${height*0.4} Z`,
      hexagon: `M${width*0.25},0 L${width*0.75},0 L${width},${height*0.5} L${width*0.75},${height} L${width*0.25},${height} L0,${height*0.5} Z`,
      diamond: `M${width/2},0 L${width},${height/2} L${width/2},${height} L0,${height/2} Z`,
    }

    if (shapePaths[shape]) {
      path.setAttribute('d', shapePaths[shape])
      path.setAttribute('fill', 'white')
      
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      group.appendChild(rect)
      group.appendChild(path)
      return group
    }

    return rect
  }

  // Apply gradient to QR code
  private async applyGradient(gradient: QRGradient): Promise<void> {
    if (!this.container) return

    const svg = this.container.querySelector('svg')
    if (!svg) return

    let defs = svg.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      svg.insertBefore(defs, svg.firstChild)
    }

    let gradientElement: SVGElement

    if (gradient.type === 'linear') {
      gradientElement = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
      gradientElement.setAttribute('x1', '0%')
      gradientElement.setAttribute('y1', '0%')
      gradientElement.setAttribute('x2', '100%')
      gradientElement.setAttribute('y2', '100%')
      if (gradient.direction) {
        const angle = gradient.direction * Math.PI / 180
        gradientElement.setAttribute('x2', `${Math.cos(angle) * 100}%`)
        gradientElement.setAttribute('y2', `${Math.sin(angle) * 100}%`)
      }
    } else if (gradient.type === 'radial') {
      gradientElement = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient')
      gradientElement.setAttribute('cx', `${gradient.centerX || 50}%`)
      gradientElement.setAttribute('cy', `${gradient.centerY || 50}%`)
      gradientElement.setAttribute('r', '50%')
    } else {
      gradientElement = document.createElementNS('http://www.w3.org/2000/svg', 'conicGradient')
      gradientElement.setAttribute('cx', `${gradient.centerX || 50}%`)
      gradientElement.setAttribute('cy', `${gradient.centerY || 50}%`)
    }

    gradientElement.setAttribute('id', 'qr-gradient')

    // Add gradient stops
    gradient.colors.forEach((color, index) => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop.setAttribute('offset', `${(index / (gradient.colors.length - 1)) * 100}%`)
      stop.setAttribute('stop-color', color)
      gradientElement.appendChild(stop)
    })

    defs.appendChild(gradientElement)

    // Apply gradient to QR code elements (dots and corners)
    const qrElements = svg.querySelectorAll('rect[fill]:not([fill="transparent"]):not([fill="none"])')
    qrElements.forEach(element => {
      const fillColor = element.getAttribute('fill')
      if (fillColor && fillColor !== this.options.backgroundColor && fillColor !== 'transparent') {
        element.setAttribute('fill', 'url(#qr-gradient)')
      }
    })
  }

  // Apply sticker to QR code
  private async applySticker(stickerConfig: QRStickerConfig): Promise<void> {
    if (!this.container) return

    const svg = this.container.querySelector('svg')
    if (!svg) return

    const sticker = this.createStickerElement(stickerConfig)
    if (sticker) {
      svg.appendChild(sticker)
    }
  }

  // Create sticker SVG element
  private createStickerElement(stickerConfig: QRStickerConfig): SVGElement | null {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.setAttribute('opacity', stickerConfig.opacity.toString())

    // Calculate position and size
    const size = (Math.min(this.options.width, this.options.height) * stickerConfig.size) / 100
    let x = 0, y = 0

    switch (stickerConfig.position) {
      case 'top-left':
        x = 10
        y = 10
        break
      case 'top-right':
        x = this.options.width - size - 10
        y = 10
        break
      case 'bottom-left':
        x = 10
        y = this.options.height - size - 10
        break
      case 'bottom-right':
        x = this.options.width - size - 10
        y = this.options.height - size - 10
        break
      case 'center':
        x = (this.options.width - size) / 2
        y = (this.options.height - size) / 2
        break
      case 'full-frame':
        x = 0
        y = 0
        break
    }

    if (stickerConfig.type === 'custom' && stickerConfig.customImage) {
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
      image.setAttribute('href', stickerConfig.customImage)
      image.setAttribute('x', x.toString())
      image.setAttribute('y', y.toString())
      image.setAttribute('width', size.toString())
      image.setAttribute('height', size.toString())
      group.appendChild(image)
    } else {
      // Create simple sticker shapes
      const stickerElement = this.createStickerShape(stickerConfig.type, size)
      if (stickerElement) {
        stickerElement.setAttribute('x', x.toString())
        stickerElement.setAttribute('y', y.toString())
        group.appendChild(stickerElement)
      }
    }

    if (stickerConfig.rotation) {
      group.setAttribute('transform', `rotate(${stickerConfig.rotation} ${x + size/2} ${y + size/2})`)
    }

    return group
  }

  // Create sticker shape
  private createStickerShape(stickerType: string, size: number): SVGElement | null {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    
    // Enhanced sticker implementations
    switch (stickerType) {
      case 'heart-frame':
        const heart = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        heart.setAttribute('d', `M${size/2},${size*0.7} C${size/2},${size*0.7} ${size*0.1},${size*0.3} ${size*0.1},${size*0.5} C${size*0.1},${size*0.6} ${size*0.2},${size*0.7} ${size*0.3},${size*0.7} C${size*0.4},${size*0.7} ${size/2},${size*0.9} ${size/2},${size*0.9} C${size/2},${size*0.9} ${size*0.6},${size*0.7} ${size*0.7},${size*0.7} C${size*0.8},${size*0.7} ${size*0.9},${size*0.6} ${size*0.9},${size*0.5} C${size*0.9},${size*0.3} ${size/2},${size*0.7} ${size/2},${size*0.7} Z`)
        heart.setAttribute('fill', 'none')
        heart.setAttribute('stroke', '#ff6b6b')
        heart.setAttribute('stroke-width', '3')
        element.appendChild(heart)
        break
      case 'star-frame':
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        star.setAttribute('d', `M${size/2},0 L${size*0.6},${size*0.4} L${size},${size*0.4} L${size*0.7},${size*0.6} L${size*0.8},${size} L${size/2},${size*0.8} L${size*0.2},${size} L${size*0.3},${size*0.6} L0,${size*0.4} L${size*0.4},${size*0.4} Z`)
        star.setAttribute('fill', 'none')
        star.setAttribute('stroke', '#ffd93d')
        star.setAttribute('stroke-width', '3')
        element.appendChild(star)
        break
      case 'circle-frame':
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('cx', (size/2).toString())
        circle.setAttribute('cy', (size/2).toString())
        circle.setAttribute('r', (size/2 - 5).toString())
        circle.setAttribute('fill', 'none')
        circle.setAttribute('stroke', '#4ecdc4')
        circle.setAttribute('stroke-width', '4')
        element.appendChild(circle)
        break
      case 'gold-frame':
        const goldFrame = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        goldFrame.setAttribute('x', '5')
        goldFrame.setAttribute('y', '5')
        goldFrame.setAttribute('width', (size - 10).toString())
        goldFrame.setAttribute('height', (size - 10).toString())
        goldFrame.setAttribute('fill', 'none')
        goldFrame.setAttribute('stroke', '#ffd700')
        goldFrame.setAttribute('stroke-width', '4')
        element.appendChild(goldFrame)
        break
      case 'silver-frame':
        const silverFrame = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        silverFrame.setAttribute('x', '5')
        silverFrame.setAttribute('y', '5')
        silverFrame.setAttribute('width', (size - 10).toString())
        silverFrame.setAttribute('height', (size - 10).toString())
        silverFrame.setAttribute('fill', 'none')
        silverFrame.setAttribute('stroke', '#c0c0c0')
        silverFrame.setAttribute('stroke-width', '4')
        element.appendChild(silverFrame)
        break
      case 'rainbow-frame':
        const rainbowFrame = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rainbowFrame.setAttribute('x', '5')
        rainbowFrame.setAttribute('y', '5')
        rainbowFrame.setAttribute('width', (size - 10).toString())
        rainbowFrame.setAttribute('height', (size - 10).toString())
        rainbowFrame.setAttribute('fill', 'none')
        rainbowFrame.setAttribute('stroke', 'url(#rainbow-gradient)')
        rainbowFrame.setAttribute('stroke-width', '4')
        element.appendChild(rainbowFrame)
        
        // Add rainbow gradient definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
        gradient.setAttribute('id', 'rainbow-gradient')
        gradient.setAttribute('x1', '0%')
        gradient.setAttribute('y1', '0%')
        gradient.setAttribute('x2', '100%')
        gradient.setAttribute('y2', '0%')
        
        const colors = ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ffff', '#8000ff', '#ff0080']
        colors.forEach((color, index) => {
          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
          stop.setAttribute('offset', `${(index / (colors.length - 1)) * 100}%`)
          stop.setAttribute('stop-color', color)
          gradient.appendChild(stop)
        })
        
        defs.appendChild(gradient)
        element.appendChild(defs)
        break
      case 'christmas-tree':
        const tree = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        
        // Tree layers
        const layer1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        layer1.setAttribute('d', `M${size/2},${size*0.1} L${size*0.2},${size*0.4} L${size*0.8},${size*0.4} Z`)
        layer1.setAttribute('fill', '#228B22')
        tree.appendChild(layer1)
        
        const layer2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        layer2.setAttribute('d', `M${size/2},${size*0.3} L${size*0.15},${size*0.6} L${size*0.85},${size*0.6} Z`)
        layer2.setAttribute('fill', '#228B22')
        tree.appendChild(layer2)
        
        const layer3 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        layer3.setAttribute('d', `M${size/2},${size*0.5} L${size*0.1},${size*0.8} L${size*0.9},${size*0.8} Z`)
        layer3.setAttribute('fill', '#228B22')
        tree.appendChild(layer3)
        
        // Trunk
        const trunk = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        trunk.setAttribute('x', (size*0.4).toString())
        trunk.setAttribute('y', (size*0.8).toString())
        trunk.setAttribute('width', (size*0.2).toString())
        trunk.setAttribute('height', (size*0.2).toString())
        trunk.setAttribute('fill', '#8B4513')
        tree.appendChild(trunk)
        
        element.appendChild(tree)
        break
      case 'santa':
        const santa = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        
        // Santa hat
        const hat = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        hat.setAttribute('d', `M${size*0.2},${size*0.3} L${size*0.5},${size*0.1} L${size*0.8},${size*0.3} L${size*0.7},${size*0.4} L${size*0.3},${size*0.4} Z`)
        hat.setAttribute('fill', '#ff0000')
        santa.appendChild(hat)
        
        // Hat pom-pom
        const pomPom = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        pomPom.setAttribute('cx', (size*0.5).toString())
        pomPom.setAttribute('cy', (size*0.1).toString())
        pomPom.setAttribute('r', (size*0.05).toString())
        pomPom.setAttribute('fill', '#ffffff')
        santa.appendChild(pomPom)
        
        // Face
        const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        face.setAttribute('cx', (size/2).toString())
        face.setAttribute('cy', (size*0.6).toString())
        face.setAttribute('r', (size*0.2).toString())
        face.setAttribute('fill', '#ffdbac')
        santa.appendChild(face)
        
        element.appendChild(santa)
        break
      case 'snowman':
        const snowman = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        
        // Bottom circle
        const bottomCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        bottomCircle.setAttribute('cx', (size/2).toString())
        bottomCircle.setAttribute('cy', (size*0.7).toString())
        bottomCircle.setAttribute('r', (size*0.25).toString())
        bottomCircle.setAttribute('fill', '#ffffff')
        bottomCircle.setAttribute('stroke', '#cccccc')
        bottomCircle.setAttribute('stroke-width', '2')
        snowman.appendChild(bottomCircle)
        
        // Top circle
        const topCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        topCircle.setAttribute('cx', (size/2).toString())
        topCircle.setAttribute('cy', (size*0.4).toString())
        topCircle.setAttribute('r', (size*0.2).toString())
        topCircle.setAttribute('fill', '#ffffff')
        topCircle.setAttribute('stroke', '#cccccc')
        topCircle.setAttribute('stroke-width', '2')
        snowman.appendChild(topCircle)
        
        // Eyes
        const snowmanLeftEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        snowmanLeftEye.setAttribute('cx', (size*0.45).toString())
        snowmanLeftEye.setAttribute('cy', (size*0.35).toString())
        snowmanLeftEye.setAttribute('r', (size*0.02).toString())
        snowmanLeftEye.setAttribute('fill', '#000000')
        snowman.appendChild(snowmanLeftEye)
        
        const snowmanRightEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        snowmanRightEye.setAttribute('cx', (size*0.55).toString())
        snowmanRightEye.setAttribute('cy', (size*0.35).toString())
        snowmanRightEye.setAttribute('r', (size*0.02).toString())
        snowmanRightEye.setAttribute('fill', '#000000')
        snowman.appendChild(snowmanRightEye)
        
        element.appendChild(snowman)
        break
      case 'gift-box':
        const giftBox = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        
        // Box
        const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        box.setAttribute('x', (size*0.2).toString())
        box.setAttribute('y', (size*0.3).toString())
        box.setAttribute('width', (size*0.6).toString())
        box.setAttribute('height', (size*0.5).toString())
        box.setAttribute('fill', '#ff6b6b')
        giftBox.appendChild(box)
        
        // Ribbon
        const ribbon = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        ribbon.setAttribute('x', (size*0.2).toString())
        ribbon.setAttribute('y', (size*0.45).toString())
        ribbon.setAttribute('width', (size*0.6).toString())
        ribbon.setAttribute('height', (size*0.1).toString())
        ribbon.setAttribute('fill', '#ffffff')
        giftBox.appendChild(ribbon)
        
        element.appendChild(giftBox)
        break
      case 'pumpkin':
        const pumpkin = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        
        // Pumpkin body
        const pumpkinBody = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        pumpkinBody.setAttribute('d', `M${size/2},${size*0.1} C${size*0.3},${size*0.1} ${size*0.1},${size*0.3} ${size*0.1},${size*0.6} C${size*0.1},${size*0.8} ${size*0.3},${size*0.9} ${size/2},${size*0.9} C${size*0.7},${size*0.9} ${size*0.9},${size*0.8} ${size*0.9},${size*0.6} C${size*0.9},${size*0.3} ${size*0.7},${size*0.1} ${size/2},${size*0.1} Z`)
        pumpkinBody.setAttribute('fill', '#ff8c00')
        pumpkin.appendChild(pumpkinBody)
        
        // Eyes
        const pumpkinLeftEye = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        pumpkinLeftEye.setAttribute('d', `M${size*0.35},${size*0.4} L${size*0.4},${size*0.35} L${size*0.35},${size*0.3} L${size*0.3},${size*0.35} Z`)
        pumpkinLeftEye.setAttribute('fill', '#000000')
        pumpkin.appendChild(pumpkinLeftEye)
        
        const pumpkinRightEye = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        pumpkinRightEye.setAttribute('d', `M${size*0.65},${size*0.4} L${size*0.7},${size*0.35} L${size*0.65},${size*0.3} L${size*0.6},${size*0.35} Z`)
        pumpkinRightEye.setAttribute('fill', '#000000')
        pumpkin.appendChild(pumpkinRightEye)
        
        // Mouth
        const pumpkinMouth = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        pumpkinMouth.setAttribute('d', `M${size*0.3},${size*0.6} Q${size/2},${size*0.7} ${size*0.7},${size*0.6}`)
        pumpkinMouth.setAttribute('fill', 'none')
        pumpkinMouth.setAttribute('stroke', '#000000')
        pumpkinMouth.setAttribute('stroke-width', '2')
        pumpkin.appendChild(pumpkinMouth)
        
        element.appendChild(pumpkin)
        break
      case 'bat':
        const bat = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        
        // Bat body
        const batBody = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
        batBody.setAttribute('cx', (size/2).toString())
        batBody.setAttribute('cy', (size*0.6).toString())
        batBody.setAttribute('rx', (size*0.15).toString())
        batBody.setAttribute('ry', (size*0.2).toString())
        batBody.setAttribute('fill', '#2c2c2c')
        bat.appendChild(batBody)
        
        // Wings
        const leftWing = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        leftWing.setAttribute('d', `M${size*0.35},${size*0.6} Q${size*0.1},${size*0.4} ${size*0.1},${size*0.6} Q${size*0.1},${size*0.8} ${size*0.35},${size*0.6} Z`)
        leftWing.setAttribute('fill', '#2c2c2c')
        bat.appendChild(leftWing)
        
        const rightWing = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        rightWing.setAttribute('d', `M${size*0.65},${size*0.6} Q${size*0.9},${size*0.4} ${size*0.9},${size*0.6} Q${size*0.9},${size*0.8} ${size*0.65},${size*0.6} Z`)
        rightWing.setAttribute('fill', '#2c2c2c')
        bat.appendChild(rightWing)
        
        element.appendChild(bat)
        break
      case 'skull':
        const skull = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        
        // Skull
        const skullHead = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        skullHead.setAttribute('cx', (size/2).toString())
        skullHead.setAttribute('cy', (size*0.5).toString())
        skullHead.setAttribute('r', (size*0.3).toString())
        skullHead.setAttribute('fill', '#ffffff')
        skullHead.setAttribute('stroke', '#cccccc')
        skullHead.setAttribute('stroke-width', '2')
        skull.appendChild(skullHead)
        
        // Eyes
        const skullLeftEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        skullLeftEye.setAttribute('cx', (size*0.4).toString())
        skullLeftEye.setAttribute('cy', (size*0.45).toString())
        skullLeftEye.setAttribute('r', (size*0.05).toString())
        skullLeftEye.setAttribute('fill', '#000000')
        skull.appendChild(skullLeftEye)
        
        const skullRightEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        skullRightEye.setAttribute('cx', (size*0.6).toString())
        skullRightEye.setAttribute('cy', (size*0.45).toString())
        skullRightEye.setAttribute('r', (size*0.05).toString())
        skullRightEye.setAttribute('fill', '#000000')
        skull.appendChild(skullRightEye)
        
        // Nose
        const skullNose = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        skullNose.setAttribute('d', `M${size/2},${size*0.5} L${size*0.45},${size*0.55} L${size*0.55},${size*0.55} Z`)
        skullNose.setAttribute('fill', '#000000')
        skull.appendChild(skullNose)
        
        // Mouth
        const skullMouth = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        skullMouth.setAttribute('d', `M${size*0.35},${size*0.6} Q${size/2},${size*0.7} ${size*0.65},${size*0.6}`)
        skullMouth.setAttribute('fill', 'none')
        skullMouth.setAttribute('stroke', '#000000')
        skullMouth.setAttribute('stroke-width', '2')
        skull.appendChild(skullMouth)
        
        element.appendChild(skull)
        break
      default:
        return null
    }

    return element
  }

  // Apply visual effects
  private async applyEffects(effects: NonNullable<AdvancedQROptions['effects']>): Promise<void> {
    if (!this.container) return

    const svg = this.container.querySelector('svg')
    if (!svg) return

    const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    if (!svg.querySelector('defs')) {
      svg.insertBefore(defs, svg.firstChild)
    }

    // Apply shadow effect
    if (effects.shadow) {
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      filter.setAttribute('id', 'qr-shadow')
      filter.setAttribute('x', '-50%')
      filter.setAttribute('y', '-50%')
      filter.setAttribute('width', '200%')
      filter.setAttribute('height', '200%')

      const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow')
      feDropShadow.setAttribute('dx', '2')
      feDropShadow.setAttribute('dy', '2')
      feDropShadow.setAttribute('stdDeviation', '3')
      feDropShadow.setAttribute('flood-color', 'rgba(0,0,0,0.3)')

      filter.appendChild(feDropShadow)
      defs.appendChild(filter)

      svg.setAttribute('filter', 'url(#qr-shadow)')
    }

    // Apply glow effect
    if (effects.glow) {
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      filter.setAttribute('id', 'qr-glow')
      filter.setAttribute('x', '-50%')
      filter.setAttribute('y', '-50%')
      filter.setAttribute('width', '200%')
      filter.setAttribute('height', '200%')

      const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
      feGaussianBlur.setAttribute('stdDeviation', '4')
      feGaussianBlur.setAttribute('result', 'coloredBlur')

      const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge')
      const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
      feMergeNode1.setAttribute('in', 'coloredBlur')
      const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
      feMergeNode2.setAttribute('in', 'SourceGraphic')

      feMerge.appendChild(feMergeNode1)
      feMerge.appendChild(feMergeNode2)
      filter.appendChild(feGaussianBlur)
      filter.appendChild(feMerge)
      defs.appendChild(filter)

      svg.setAttribute('filter', 'url(#qr-glow)')
    }
  }

  // Apply watermark
  private async applyWatermark(): Promise<void> {
    if (!this.container) return

    const svg = this.container.querySelector('svg')
    if (!svg) return

    // Import and apply the existing watermark function
    const { addBotrixLogoToQR } = await import('@/lib/qr-watermark')
    addBotrixLogoToQR(svg)
  }

  // Download QR code with enhanced quality
  download(filename?: string, format?: 'png' | 'svg', quality: 'web' | 'print' | 'ultra-hd' = 'ultra-hd'): void {
    if (!this.qrCode || !this.container) return

    const svg = this.container.querySelector('svg')
    if (!svg) return

    const filenameWithTimestamp = `${filename || 'qr-code'}-${Date.now()}`
    
    if (format === 'svg') {
      // For SVG, use the built-in download method
      this.qrCode.download({
        name: filenameWithTimestamp,
        extension: 'svg',
      })
    } else {
      // For PNG, use enhanced quality rendering
      this.downloadHighQualityPNG(svg, filenameWithTimestamp, quality)
    }
  }

  // Enhanced PNG download with quality options
  private downloadHighQualityPNG(svg: SVGElement, filename: string, quality: 'web' | 'print' | 'ultra-hd'): void {
    const qualitySettings = {
      'web': { scale: 2, suffix: 'Web' },
      'print': { scale: 4, suffix: 'Print' },
      'ultra-hd': { scale: 8, suffix: 'HD' }
    }
    
    const settings = qualitySettings[quality]
    
    // Create high-resolution canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const baseSize = this.options.width
    canvas.width = baseSize * settings.scale
    canvas.height = baseSize * settings.scale
    
    // Enable high DPI rendering
    ctx.scale(settings.scale, settings.scale)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Set background
    ctx.fillStyle = this.options.backgroundColor || '#ffffff'
    ctx.fillRect(0, 0, baseSize, baseSize)
    
    // Convert SVG to image and draw
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, baseSize, baseSize)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${filename}-${settings.suffix}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        URL.revokeObjectURL(svgUrl)
      }, 'image/png', 1.0)
    }
    img.src = svgUrl
  }

  // Update QR code data
  updateData(data: string): void {
    if (this.qrCode) {
      this.qrCode.update({ data })
    }
  }

  // Update QR code options
  updateOptions(options: Partial<AdvancedQROptions>): void {
    this.options = { ...this.options, ...options }
    if (this.container) {
      this.generate(this.container)
    }
  }
}

// Utility functions
export const createAdvancedQR = (options: AdvancedQROptions): AdvancedQRCodeGenerator => {
  return new AdvancedQRCodeGenerator(options)
}

export const applyTemplateToQR = (qrGenerator: AdvancedQRCodeGenerator, templateId: string): void => {
  const template = QR_TEMPLATES[templateId as keyof typeof QR_TEMPLATES]
  if (template) {
    qrGenerator.updateOptions({
      template: templateId as keyof typeof QR_TEMPLATES | undefined,
      foregroundColor: template.colors.foreground,
      backgroundColor: template.colors.background,
      gradient: template.colors.gradient,
      dotType: template.styles.dotType,
      cornerType: template.styles.cornerType,
      eyePattern: template.styles.eyePattern,
      shape: template.shape,
      sticker: template.sticker,
    })
  }
}

export const getTemplatePreview = (templateId: string): string => {
  // Return a preview image URL or base64 string for the template
  // This would typically be generated or stored as static assets
  return `/templates/${templateId}-preview.png`
}

export const getStickerPreview = (stickerId: string): string => {
  // Return a preview image URL or base64 string for the sticker
  return `/stickers/${stickerId}-preview.png`
}
