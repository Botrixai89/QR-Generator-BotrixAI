import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { headers } from "next/headers"

// Enhanced scan endpoint with device-based and geo-targeting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      userAgent, 
      ipAddress, 
      country, 
      city, 
      device, 
      browser, 
      os,
      latitude,
      longitude
    } = body

    // Get client IP from headers if not provided
    const headersList = await headers()
    const clientIP = ipAddress || 
      headersList.get('x-forwarded-for') || 
      headersList.get('x-real-ip') || 
      'unknown'

    // First, check if the QR code exists and is active
    const { data: qrCode, error: qrError } = await supabaseAdmin!
      .from('QrCode')
      .select('*')
      .eq('id', id)
      .single()

    if (qrError || !qrCode) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      )
    }

    // Check if QR code is active
    if (!qrCode.isActive) {
      return NextResponse.json(
        { error: "QR code is inactive" },
        { status: 403 }
      )
    }

    // Check if QR code has expired
    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "QR code has expired" },
        { status: 403 }
      )
    }

    // Check if max scans limit has been reached
    if (qrCode.maxScans && qrCode.scanCount >= qrCode.maxScans) {
      return NextResponse.json(
        { error: "QR code scan limit reached" },
        { status: 403 }
      )
    }

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(id, clientIP, qrCode.rateLimitConfig)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    // Determine redirect URL based on advanced features
    let finalRedirectUrl = qrCode.redirectUrl || qrCode.url

    // Device-based redirection
    if (qrCode.deviceRedirection && userAgent) {
      const deviceRedirectUrl = getDeviceRedirectUrl(qrCode.deviceRedirection, userAgent)
      if (deviceRedirectUrl) {
        finalRedirectUrl = deviceRedirectUrl
      }
    }

    // Geo-targeting redirection
    if (qrCode.geoRedirection && country) {
      const geoRedirectUrl = getGeoRedirectUrl(qrCode.geoRedirection, country, city)
      if (geoRedirectUrl) {
        finalRedirectUrl = geoRedirectUrl
      }
    }

    // A/B testing redirection
    let abTestVariant = null
    if (qrCode.abTestConfig) {
      abTestVariant = getABTestVariant(qrCode.abTestConfig)
      if (abTestVariant && qrCode.abTestConfig.variants[abTestVariant]) {
        const variantUrl = qrCode.abTestConfig.variants[abTestVariant].url
        if (variantUrl) {
          finalRedirectUrl = variantUrl
        }
      }
    }

    // Record the scan with enhanced data
    const { data: scan, error: scanError } = await supabaseAdmin!
      .from('QrCodeScan')
      .insert({
        qrCodeId: id,
        userAgent,
        ipAddress: clientIP,
        country,
        city,
        device,
        browser,
        os,
        latitude,
        longitude,
        abTestVariant,
        finalRedirectUrl
      })
      .select()
      .single()

    if (scanError) {
      console.error("Error recording scan:", scanError)
      return NextResponse.json(
        { error: "Failed to record scan" },
        { status: 500 }
      )
    }

    // Update scan count and last scanned timestamp
    const { error: updateError } = await supabaseAdmin!
      .from('QrCode')
      .update({
        scanCount: qrCode.scanCount + 1,
        lastScannedAt: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error("Error updating scan count:", updateError)
    }

    // Trigger webhook if configured
    if (qrCode.webhookUrl) {
      triggerWebhook(qrCode.webhookUrl, qrCode.webhookSecret, {
        qrCodeId: id,
        scanId: scan.id,
        userAgent,
        device,
        country,
        city,
        redirectUrl: finalRedirectUrl,
        abTestVariant,
        timestamp: new Date().toISOString()
      })
    }

    // Inject marketing pixels if configured
    const pixelData = qrCode.marketingPixels ? {
      facebook: qrCode.marketingPixels.facebook,
      googleAnalytics: qrCode.marketingPixels.googleAnalytics
    } : null

    return NextResponse.json({
      success: true,
      redirectUrl: finalRedirectUrl,
      scanId: scan.id,
      abTestVariant,
      pixelData
    })
  } catch (error) {
    console.error("Error processing enhanced QR code scan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Device-based redirection logic
function getDeviceRedirectUrl(deviceConfig: any, userAgent: string): string | null {
  if (!deviceConfig || typeof deviceConfig !== 'object') {
    return null
  }

  // Determine device type from user agent
  let deviceType = 'desktop'
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    deviceType = 'ios'
  } else if (userAgent.includes('Android')) {
    deviceType = 'android'
  }

  return deviceConfig[deviceType] || null
}

// Geo-targeting redirection logic
function getGeoRedirectUrl(geoConfig: any, country: string, city?: string): string | null {
  if (!geoConfig || typeof geoConfig !== 'object') {
    return null
  }

  // Try city-specific redirect first
  if (city && geoConfig.cities && geoConfig.cities[city]) {
    return geoConfig.cities[city]
  }

  // Fall back to country-specific redirect
  if (geoConfig.countries && geoConfig.countries[country]) {
    return geoConfig.countries[country]
  }

  return null
}

// A/B testing variant selection
function getABTestVariant(abTestConfig: any): string | null {
  if (!abTestConfig || !abTestConfig.variants) {
    return null
  }

  // Simple random distribution (can be enhanced with more sophisticated algorithms)
  const variants = Object.keys(abTestConfig.variants)
  const weights = variants.map(v => abTestConfig.variants[v].weight || 1)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  
  const random = Math.random() * totalWeight
  let currentWeight = 0
  
  for (let i = 0; i < variants.length; i++) {
    currentWeight += weights[i]
    if (random <= currentWeight) {
      return variants[i]
    }
  }
  
  return variants[0] // Fallback to first variant
}

// Rate limiting check
async function checkRateLimit(qrCodeId: string, ipAddress: string, rateLimitConfig: any) {
  if (!rateLimitConfig) {
    return { allowed: true }
  }

  const windowSize = rateLimitConfig.windowSize || 3600 // 1 hour default
  const maxRequests = rateLimitConfig.maxRequests || 100 // 100 requests per hour default

  // Check current rate limit for this IP and QR code
  const { data: existingLimit } = await supabaseAdmin!
    .from('QrCodeRateLimit')
    .select('*')
    .eq('qrCodeId', qrCodeId)
    .eq('ipAddress', ipAddress)
    .gte('windowStart', new Date(Date.now() - windowSize * 1000).toISOString())
    .single()

  if (existingLimit) {
    if (existingLimit.requestCount >= maxRequests) {
      const retryAfter = Math.ceil((new Date(existingLimit.windowStart).getTime() + windowSize * 1000 - Date.now()) / 1000)
      return { allowed: false, retryAfter }
    }

    // Update existing rate limit
    await supabaseAdmin!
      .from('QrCodeRateLimit')
      .update({
        requestCount: existingLimit.requestCount + 1,
        lastRequestAt: new Date().toISOString()
      })
      .eq('id', existingLimit.id)
  } else {
    // Create new rate limit record
    await supabaseAdmin!
      .from('QrCodeRateLimit')
      .insert({
        qrCodeId,
        ipAddress,
        requestCount: 1,
        windowStart: new Date().toISOString(),
        lastRequestAt: new Date().toISOString()
      })
  }

  return { allowed: true }
}

// Webhook trigger (async)
async function triggerWebhook(webhookUrl: string, secret: string, payload: any) {
  try {
    const signature = secret ? await generateWebhookSignature(payload, secret) : null
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature && { 'X-Webhook-Signature': signature })
      },
      body: JSON.stringify(payload)
    })

    // Log webhook attempt
    await supabaseAdmin!
      .from('QrCodeWebhookLog')
      .insert({
        qrCodeId: payload.qrCodeId,
        webhookUrl,
        payload,
        responseStatus: response.status,
        responseBody: await response.text(),
        isSuccessful: response.ok
      })
  } catch (error) {
    console.error('Webhook error:', error)
    
    // Log failed webhook attempt
    await supabaseAdmin!
      .from('QrCodeWebhookLog')
      .insert({
        qrCodeId: payload.qrCodeId,
        webhookUrl,
        payload,
        responseStatus: 0,
        responseBody: error instanceof Error ? error.message : 'Unknown error',
        isSuccessful: false
      })
  }
}

// Generate webhook signature for security
async function generateWebhookSignature(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(JSON.stringify(payload))
  )
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
