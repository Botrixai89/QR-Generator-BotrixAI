/**
 * QR Code Library Loader
 * Dynamic imports for code-splitting - only loads QR libraries when needed
 */

/**
 * Dynamically import QRCodeStyling library
 */
export async function loadQRCodeStyling() {
  if (typeof window === 'undefined') {
    // Server-side: return null or use server-side QR generation
    return null
  }

  try {
    const module = await import('qr-code-styling')
    return module.default
  } catch (error) {
    console.error('Failed to load QRCodeStyling:', error)
    throw error
  }
}

/**
 * Dynamically import qrcode library
 */
export async function loadQRCode() {
  try {
    const module = await import('qrcode')
    return module.default
  } catch (error) {
    console.error('Failed to load qrcode:', error)
    throw error
  }
}

/**
 * Dynamically import advanced QR code utilities
 */
export async function loadAdvancedQR() {
  try {
    const module = await import('@/lib/qr-code-advanced')
    return module.createAdvancedQR
  } catch (error) {
    console.error('Failed to load advanced QR utilities:', error)
    throw error
  }
}

/**
 * Dynamically import QR watermark utilities
 */
export async function loadQRWatermark() {
  try {
    const module = await import('@/lib/qr-watermark')
    return module.addBotrixLogoToQR
  } catch (error) {
    console.error('Failed to load QR watermark utilities:', error)
    throw error
  }
}

