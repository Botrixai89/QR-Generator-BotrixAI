/**
 * Custom Error Pages
 * Handles customizable 404 and expiry pages for QR codes and domains
 */

import { supabaseAdmin } from "@/lib/supabase"

export interface ErrorPageConfig {
  type: '404' | 'expired'
  customContent?: string
  redirectUrl?: string
  showQRCodeInfo?: boolean
}

/**
 * Get custom error page for a QR code
 */
export async function getQrCodeErrorPage(
  qrCodeId: string,
  type: '404' | 'expired'
): Promise<string | null> {
  try {
    const { data: qrCode, error } = await supabaseAdmin!
      .from('QrCode')
      .select('custom404Page, customExpiryPage, title, url')
      .eq('id', qrCodeId)
      .single()

    if (error || !qrCode) {
      return null
    }

    if (type === '404' && qrCode.custom404Page) {
      return qrCode.custom404Page
    }

    if (type === 'expired' && qrCode.customExpiryPage) {
      return qrCode.customExpiryPage
    }

    return null
  } catch (error) {
    console.error('Error getting QR code error page:', error)
    return null
  }
}

/**
 * Get custom error page for a domain
 */
export async function getDomainErrorPage(
  domainId: string,
  type: '404' | 'expired'
): Promise<string | null> {
  try {
    const { data: domain, error } = await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .select('custom404Page, customExpiryPage, domain')
      .eq('id', domainId)
      .single()

    if (error || !domain) {
      return null
    }

    if (type === '404' && domain.custom404Page) {
      return domain.custom404Page
    }

    if (type === 'expired' && domain.customExpiryPage) {
      return domain.customExpiryPage
    }

    return null
  } catch (error) {
    console.error('Error getting domain error page:', error)
    return null
  }
}

/**
 * Generate default error page HTML
 */
export function generateDefaultErrorPage(
  type: '404' | 'expired',
  options?: {
    title?: string
    message?: string
    showQRInfo?: boolean
    qrCodeTitle?: string
    redirectUrl?: string
  }
): string {
  const pageTitle = type === '404' ? 'QR Code Not Found' : 'QR Code Expired'
  const defaultMessage = type === '404' 
    ? 'The QR code you are looking for could not be found.'
    : 'This QR code has expired and is no longer available.'

  const title = options?.title || pageTitle
  const message = options?.message || defaultMessage

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #333;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: ${type === '404' ? '#ef4444' : '#f59e0b'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #1f2937;
    }
    p {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .qr-info {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      text-align: left;
    }
    .qr-info h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #374151;
    }
    .qr-info p {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    a {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    a:hover {
      background: #5568d3;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${type === '404' ? '✕' : '⏰'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${options?.showQRInfo && options?.qrCodeTitle ? `
      <div class="qr-info">
        <h3>QR Code Information</h3>
        <p>${options.qrCodeTitle}</p>
      </div>
    ` : ''}
    ${options?.redirectUrl ? `
      <a href="${options.redirectUrl}">Continue to Destination</a>
    ` : ''}
    <div class="footer">
      <p>QR Code Generator Platform</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Get error page HTML (custom or default)
 */
export async function getErrorPage(
  type: '404' | 'expired',
  options: {
    qrCodeId?: string
    domainId?: string
    title?: string
    message?: string
    showQRInfo?: boolean
    redirectUrl?: string
  }
): Promise<string> {
  // Try to get custom error page from QR code first
  if (options.qrCodeId) {
    const customPage = await getQrCodeErrorPage(options.qrCodeId, type)
    if (customPage) {
      return customPage
    }
  }

  // Try to get custom error page from domain
  if (options.domainId) {
    const customPage = await getDomainErrorPage(options.domainId, type)
    if (customPage) {
      return customPage
    }
  }

  // Return default error page
  return generateDefaultErrorPage(type, {
    title: options.title,
    message: options.message,
    showQRInfo: options.showQRInfo,
    redirectUrl: options.redirectUrl
  })
}

