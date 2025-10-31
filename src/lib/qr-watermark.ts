// Enhanced utility function to add BotrixAI logo watermark to QR code SVG
export const addBotrixLogoToQR = (svg: SVGElement) => {
  // Use unique IDs to avoid conflicts with user-uploaded center logos
  const WATERMARK_ID = 'botrix-watermark'
  const WATERMARK_BG_ID = 'botrix-watermark-bg'

  // Remove existing Botrix watermark if any
  const existingLogo = svg.querySelector(`#${WATERMARK_ID}`)
  if (existingLogo) {
    existingLogo.remove()
  }
  
  // Remove existing background if any
  const existingBg = svg.querySelector(`#${WATERMARK_BG_ID}`)
  if (existingBg) {
    existingBg.remove()
  }
  
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
  
  // Ensure watermark appears on top by appending to the end of SVG
  // SVG renders elements in order, so last elements appear on top
  svg.appendChild(bgCircle)
  svg.appendChild(logoImage)
  
  // Force repaint to ensure watermark is visible
  // Use a small delay to ensure all other rendering is complete
  requestAnimationFrame(() => {
    // Verify watermark is still present
    const checkWatermark = svg.querySelector(`#${WATERMARK_ID}`)
    if (!checkWatermark) {
      // Re-apply if somehow removed
      svg.appendChild(bgCircle.cloneNode(true) as SVGElement)
      svg.appendChild(logoImage.cloneNode(true) as SVGElement)
    }
  })
}
