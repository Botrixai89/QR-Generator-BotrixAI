// Enhanced utility function to add BotrixAI logo watermark to QR code SVG
const watermarkObserverMap = new WeakMap<SVGElement, MutationObserver>()

export const addBotrixLogoToQR = (svg: SVGElement) => {
  // Use unique IDs to avoid conflicts and enable reliable updates
  const WATERMARK_LAYER_ID = 'botrix-watermark-layer'
  const WATERMARK_ID = 'botrix-watermark'
  const WATERMARK_BG_ID = 'botrix-watermark-bg'

  // Remove any previous layer to avoid duplicates
  const existingLayer = svg.querySelector(`#${WATERMARK_LAYER_ID}`)
  if (existingLayer) {
    existingLayer.remove()
  }
  // (Backward compatibility) clean up any old loose nodes
  const existingLogo = svg.querySelector(`#${WATERMARK_ID}`)
  if (existingLogo) existingLogo.remove()
  const existingBg = svg.querySelector(`#${WATERMARK_BG_ID}`)
  if (existingBg) existingBg.remove()
  
  // Get SVG dimensions and calculate responsive sizing
  const svgRect = svg.getBoundingClientRect()
  const svgWidth = svgRect.width || 300
  const svgHeight = svgRect.height || 300
  
  // Calculate responsive logo size based on QR code size
  const baseSize = Math.min(svgWidth, svgHeight)
  const logoSize = Math.max(24, Math.min(60, baseSize * 0.12)) // 12% of QR size, min 24px, max 60px
  const padding = Math.max(4, baseSize * 0.02) // 2% padding, min 4px
  
  const logoX = svgWidth - logoSize - padding
  const logoY = svgHeight - logoSize - padding
  
  // Create a dedicated top-most layer so we can re-append it easily
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  layer.setAttribute('id', WATERMARK_LAYER_ID)
  layer.setAttribute('data-role', 'botrix-watermark')

  // Create enhanced background with subtle shadow
  const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  bgCircle.setAttribute('id', WATERMARK_BG_ID)
  bgCircle.setAttribute('cx', (logoX + logoSize / 2).toString())
  bgCircle.setAttribute('cy', (logoY + logoSize / 2).toString())
  bgCircle.setAttribute('r', (logoSize / 2 + 3).toString())
  bgCircle.setAttribute('fill', '#ffffff')
  bgCircle.setAttribute('opacity', '0.95')
  bgCircle.setAttribute('stroke', '#e5e7eb')
  bgCircle.setAttribute('stroke-width', '0.5')
  
  // Add subtle shadow filter
  const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  if (!svg.querySelector('defs')) {
    svg.insertBefore(defs, svg.firstChild)
  }
  
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
  filter.setAttribute('id', 'botrix-shadow')
  filter.setAttribute('x', '-50%')
  filter.setAttribute('y', '-50%')
  filter.setAttribute('width', '200%')
  filter.setAttribute('height', '200%')
  
  const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow')
  feDropShadow.setAttribute('dx', '1')
  feDropShadow.setAttribute('dy', '1')
  feDropShadow.setAttribute('stdDeviation', '2')
  feDropShadow.setAttribute('flood-color', 'rgba(0,0,0,0.1)')
  
  filter.appendChild(feDropShadow)
  defs.appendChild(filter)
  bgCircle.setAttribute('filter', 'url(#botrix-shadow)')
  
  // Create enhanced Botrix logo image with better positioning
  const logoImage = document.createElementNS('http://www.w3.org/2000/svg', 'image')
  logoImage.setAttribute('id', WATERMARK_ID)
  logoImage.setAttribute('href', '/botrix-logo01.png')
  logoImage.setAttribute('x', (logoX + 2).toString())
  logoImage.setAttribute('y', (logoY + 2).toString())
  logoImage.setAttribute('width', (logoSize - 4).toString())
  logoImage.setAttribute('height', (logoSize - 4).toString())
  logoImage.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  logoImage.setAttribute('clip-path', 'circle(50%)')

  // Append to the watermark layer, then move layer to top
  layer.appendChild(bgCircle)
  layer.appendChild(logoImage)
  svg.appendChild(layer)
  
  // Force repaint to ensure watermark is visible
  // Use a small delay to ensure all other rendering is complete
  requestAnimationFrame(() => {
    // Keep watermark layer at the very end if the SVG mutates (e.g., when a logo is uploaded)
    const ensureTopMost = () => {
      const currentLayer = svg.querySelector(`#${WATERMARK_LAYER_ID}`)
      if (currentLayer && currentLayer !== svg.lastElementChild) {
        svg.appendChild(currentLayer)
      }
    }
    ensureTopMost()

    // Attach a singleton MutationObserver to track late re-renders by the QR library
    if (!watermarkObserverMap.has(svg)) {
      const observer = new MutationObserver(() => ensureTopMost())
      observer.observe(svg, { childList: true })
      watermarkObserverMap.set(svg, observer)
    }
  })
}
