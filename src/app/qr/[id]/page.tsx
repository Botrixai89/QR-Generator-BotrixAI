"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, BarChart3, Clock, Download } from "lucide-react"
import type QRCodeStyling from "qr-code-styling"
import { addBotrixLogoToQR } from "@/lib/qr-watermark"
import { createAdvancedQR } from "@/lib/qr-code-advanced"
import type { AdvancedQROptions } from "@/types/qr-code-advanced"
import QRAdDisplay from "@/components/qr-ad-display"

interface QRCodeData {
  id: string
  title: string
  url: string
  isDynamic: boolean
  isActive: boolean
  scanCount: number
  createdAt: string
  lastScannedAt: string | null
  dynamicContent?: Record<string, unknown>
  redirectUrl?: string
  foregroundColor?: string
  backgroundColor?: string
  dotType?: string
  cornerType?: string
  hasWatermark?: boolean
  logoUrl?: string
  // Advanced customization persisted in DB (optional)
  template?: string
  shape?: string
  eyePattern?: string
  gradient?: Record<string, unknown>
  sticker?: Record<string, unknown>
  effects?: Record<string, unknown>
}

interface Analytics {
  totalScans: number
  uniqueDevices: number
  uniqueCountries: number
  uniqueCities: number
  scansByDate: Record<string, number>
  scansByDevice: Record<string, number>
  scansByCountry: Record<string, number>
  recentScans: Array<Record<string, unknown>>
}

// Enhanced QR Code Preview Component
function QRCodePreview({ qrCode, onDownload, setDownloadMessage }: { 
  qrCode: QRCodeData, 
  onDownload: (format: 'png' | 'svg') => void,
  setDownloadMessage: (message: string | null) => void
}) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const advancedRef = useRef<{ download?: (format: 'png' | 'svg') => void } | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [downloadQuality, setDownloadQuality] = useState<'web' | 'print' | 'ultra-hd'>('ultra-hd')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && qrRef.current && qrCode) {
      setIsGenerating(true)
      setGenerationError(null)
      
      const formattedBackgroundColor = qrCode.backgroundColor?.startsWith('#') 
        ? qrCode.backgroundColor 
        : `#${qrCode.backgroundColor || 'FFFFFF'}`
      
      if (qrCodeRef.current) {
        qrCodeRef.current = null
      }
      advancedRef.current = null
      
      qrRef.current.innerHTML = ""
      
      try {
        // For dynamic QR codes, use the redirect URL if available, otherwise link to hosted QR route
        const qrData = qrCode.isDynamic 
          ? (qrCode.redirectUrl || `${window.location.origin}/qr/${qrCode.id}`)
          : qrCode.url

        // Use the same advanced generator as the live preview to keep rendering consistent
        const advancedOptions: AdvancedQROptions = {
          data: qrData,
          width: 300,
          height: 300,
          type: 'svg',
          foregroundColor: qrCode.foregroundColor || '#000000',
          backgroundColor: formattedBackgroundColor,
          dotType: (qrCode.dotType as AdvancedQROptions['dotType']) || 'square',
          cornerType: (qrCode.cornerType as AdvancedQROptions['cornerType']) || 'square',
          eyePattern: (qrCode.eyePattern as AdvancedQROptions['eyePattern']) || 'square',
          template: qrCode.template as AdvancedQROptions['template'],
          shape: qrCode.shape as AdvancedQROptions['shape'],
          gradient: qrCode.gradient as AdvancedQROptions['gradient'],
          sticker: qrCode.sticker as AdvancedQROptions['sticker'],
          effects: qrCode.effects as AdvancedQROptions['effects'],
          // Map stored logo URL (if any) to advanced logo config
          logo: qrCode.logoUrl ? { image: qrCode.logoUrl, size: 0.25, margin: 5, opacity: 1 } : undefined,
          // Persist watermark choice
          watermark: !!qrCode.hasWatermark,
        }

        const generator = createAdvancedQR(advancedOptions)
        advancedRef.current = generator
        void generator.generate(qrRef.current)
          .then(() => {
            try {
              // Ensure watermark is present even if advanced pipeline skips it
              if (qrRef.current && qrCode.hasWatermark) {
                // Use a small delay to ensure SVG is fully rendered
                setTimeout(() => {
                  const svg = qrRef.current?.querySelector('svg')
                  if (svg) {
                    addBotrixLogoToQR(svg)
                  }
                }, 100)
              }
            } finally {
              setIsGenerating(false)
            }
          })
          .catch(() => setIsGenerating(false))
      } catch (error) {
        console.error("Error creating QR code preview:", error)
        setGenerationError(error instanceof Error ? error.message : 'Failed to generate QR code')
        setIsGenerating(false)
        if (qrRef.current) {
          qrRef.current.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #666; font-size: 12px;">Error generating QR code</div>`
        }
      }
    }
  }, [isClient, qrCode])

  // Ensure watermark persists after any render or update
  useEffect(() => {
    if (!isClient || !qrRef.current || !qrCode?.hasWatermark) return
    
    const applyWatermark = () => {
      try {
        const svg = qrRef.current?.querySelector('svg')
        if (svg) {
          addBotrixLogoToQR(svg)
        }
      } catch (error) {
        console.warn('Failed to apply watermark:', error)
      }
    }
    
    // Apply watermark after a short delay to ensure SVG is fully rendered
    const timeoutId = setTimeout(applyWatermark, 150)
    
    // Also try to apply immediately in case SVG is already ready
    applyWatermark()
    
    return () => clearTimeout(timeoutId)
  }, [isClient, qrCode?.hasWatermark, qrCode?.logoUrl])

  const handleDownload = async (format: 'png' | 'svg') => {
    if (!qrRef.current) return
    
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return
    
    const filename = `${qrCode.title || 'qr-code'}-${Date.now()}`
    
    // Show download progress with quality info
    const qualityInfo = {
      'web': 'Web Quality (2x)',
      'print': 'Print Quality (4x)', 
      'ultra-hd': 'Ultra-HD Quality (8x)'
    }
    setDownloadMessage(`Preparing ${format.toUpperCase()} download - ${qualityInfo[downloadQuality]}...`)
    
    try {
      // Function to convert image URLs to base64 data URIs with better error handling
      const embedImages = async (svgElement: SVGElement): Promise<string> => {
        const clonedSvg = svgElement.cloneNode(true) as SVGElement
        const images = clonedSvg.querySelectorAll('image')
        
        const imagePromises = Array.from(images).map(async (img) => {
          const href = img.getAttribute('href') || img.getAttribute('xlink:href')
          if (href && !href.startsWith('data:')) {
            try {
              const response = await fetch(href)
              if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
              
              const blob = await response.blob()
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              img.setAttribute('href', base64)
              img.removeAttribute('xlink:href')
            } catch (error) {
              console.warn('Failed to embed image:', href, error)
              // Keep original href if embedding fails
            }
          }
        })
        
        await Promise.all(imagePromises)
        return new XMLSerializer().serializeToString(clonedSvg)
      }
      
      if (format === 'svg') {
        setDownloadMessage('Embedding images in SVG...')
        const svgData = await embedImages(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)
        
        const link = document.createElement('a')
        link.href = svgUrl
        link.download = `${filename}.svg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(svgUrl)
        
        setDownloadMessage('SVG downloaded successfully!')
      } else {
        // Quality settings based on selected option
        const qualitySettings = {
          'web': { scale: 2, suffix: 'Web', message: 'Converting to web-quality PNG...' },
          'print': { scale: 4, suffix: 'Print', message: 'Converting to print-quality PNG...' },
          'ultra-hd': { scale: 8, suffix: 'HD', message: 'Converting to ultra-HD PNG...' }
        }
        
        const settings = qualitySettings[downloadQuality]
        setDownloadMessage(settings.message)
        
        // Create high-resolution canvas based on quality setting
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas context not available')
        
        const baseSize = 300
        canvas.width = baseSize * settings.scale
        canvas.height = baseSize * settings.scale
        
        // Enable high DPI rendering with quality settings
        ctx.scale(settings.scale, settings.scale)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Additional quality enhancements for crisp rendering
        ctx.textBaseline = 'top'
        ctx.textAlign = 'left'
        
        // Set high-quality rendering hints
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, baseSize, baseSize)
        
        // Embed images and create SVG data
        const svgData = await embedImages(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)
        
        const img = new Image()
        img.onload = () => {
          setDownloadMessage(`Rendering ${settings.suffix.toLowerCase()}-quality PNG...`)
          
          // Draw at high resolution with quality settings
          ctx.drawImage(img, 0, 0, baseSize, baseSize)
          
          // Convert canvas to PNG with maximum quality
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
              
              setDownloadMessage(`${settings.suffix}-quality PNG downloaded successfully!`)
            } else {
              throw new Error('Failed to create PNG blob')
            }
          }, 'image/png', 1.0) // Maximum quality (no compression)
          
          URL.revokeObjectURL(svgUrl)
        }
        img.onerror = () => {
          throw new Error('Failed to load SVG for PNG conversion')
        }
        img.src = svgUrl
      }
      
      onDownload(format)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setDownloadMessage(null)
      }, 3000)
      
    } catch (error) {
      console.error('Download error:', error)
      setDownloadMessage(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => {
        setDownloadMessage(null)
      }, 5000)
    }
  }

  if (!isClient) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-80 h-80 bg-gray-100 rounded animate-pulse mx-auto flex items-center justify-center">
          <div className="text-gray-500 text-sm">Initializing...</div>
        </div>
      </div>
    )
  }

  if (generationError) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-80 h-80 border rounded bg-red-50 flex items-center justify-center mx-auto">
          <div className="text-center text-red-600">
            <div className="text-sm font-medium mb-2">QR Code Generation Failed</div>
            <div className="text-xs">{generationError}</div>
          </div>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Loader2 className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div 
          ref={qrRef}
          className="w-80 h-80 border rounded bg-white flex-shrink-0 mx-auto"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
        {isGenerating && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <div className="text-sm text-gray-600">Generating QR Code...</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-3">
        {/* Quality Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Download Quality:</label>
          <div className="flex gap-2">
            {(['web', 'print', 'ultra-hd'] as const).map((quality) => (
              <Button
                key={quality}
                onClick={() => setDownloadQuality(quality)}
                variant={downloadQuality === quality ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                {quality === 'web' && 'Web (2x)'}
                {quality === 'print' && 'Print (4x)'}
                {quality === 'ultra-hd' && 'Ultra-HD (8x)'}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Download Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleDownload('png')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isGenerating}
          >
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
          <Button
            onClick={() => handleDownload('svg')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isGenerating}
          >
            <Download className="h-4 w-4" />
            Download SVG
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function QRCodeRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  const [showAd, setShowAd] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadQRCodeData = async () => {
      try {
        const qrCodeId = params.id as string
        
        // Validate QR code ID
        if (!qrCodeId || qrCodeId.length < 10) {
          throw new Error('Invalid QR code ID')
        }
        
        console.log('Processing QR code with ID:', qrCodeId)
        
        // Check if this is preview mode (from URL search params)
        const urlParams = new URLSearchParams(window.location.search)
        const preview = urlParams.get('preview')
        setIsPreviewMode(preview === 'true')
        
        if (preview === 'true') {
          // Preview mode: Load QR code data and analytics from the public scan endpoint
          try {
            console.log('Loading QR code data for ID:', qrCodeId)
            const response = await fetch(`/api/qr-codes/${qrCodeId}/scan`)
            console.log('Response status:', response.status)
            
            if (response.ok) {
              const data = await response.json()
              console.log('QR code data loaded successfully:', data)
              setQrCode(data.qrCode)
              setAnalytics(data.analytics)
            } else {
              const errorText = await response.text()
              console.error('API Error:', response.status, errorText)
              throw new Error(`Failed to load QR code data: ${response.status} ${errorText}`)
            }
          } catch (fetchError) {
            console.error('Fetch error:', fetchError)
            // If it's a 404, the QR code doesn't exist
            if (fetchError instanceof Error && fetchError.message.includes('404')) {
              throw new Error('QR code not found. Please check the URL or create a new QR code.')
            }
            throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
          }
        } else {
          // Normal scan mode: Record scan and auto-redirect
          const userAgent = navigator.userAgent
          const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'Mobile' : 'Desktop'
          const browser = getBrowserName(userAgent)
          const os = getOSName(userAgent)

          // Record the scan
          const scanResponse = await fetch(`/api/qr-codes/${qrCodeId}/scan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userAgent,
              device,
              browser,
              os
            })
          })

          if (!scanResponse.ok) {
            const errorData = await scanResponse.json()
            throw new Error(errorData.error || 'Failed to process QR code')
          }

          const scanData = await scanResponse.json()
          
          // Get QR code details and analytics
          const analyticsResponse = await fetch(`/api/qr-codes/${qrCodeId}/scan`)
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json()
            setQrCode(analyticsData.qrCode)
            setAnalytics(analyticsData.analytics)
          }

          // Save redirect URL
          setRedirectUrl(scanData.redirectUrl)

          // Check if ads should be shown (ME-QR-like functionality)
          if (scanData.showAds) {
            // Show ad before redirecting
            setShowAd(true)
          } else {
            // Auto-redirect after a short delay if no ads
            setTimeout(() => {
              setRedirecting(true)
              window.location.href = scanData.redirectUrl
            }, 2000)
          }
        }

      } catch (error) {
        console.error('Error processing QR code:', error)
        setError(error instanceof Error ? error.message : 'Failed to process QR code')
      } finally {
        setLoading(false)
      }
    }

    loadQRCodeData()
  }, [params.id])

  const handleManualRedirect = () => {
    if (redirectUrl) {
      setRedirecting(true)
      window.location.href = redirectUrl
    } else if (qrCode) {
      setRedirecting(true)
      window.location.href = qrCode.redirectUrl || qrCode.url
    }
  }

  const handleAdContinue = () => {
    setShowAd(false)
    if (redirectUrl) {
      setRedirecting(true)
      window.location.href = redirectUrl
    }
  }

  const handleAdClose = () => {
    setShowAd(false)
    if (redirectUrl) {
      setRedirecting(true)
      window.location.href = redirectUrl
    }
  }

  const handleDownload = (format: 'png' | 'svg') => {
    setDownloadMessage(`Downloading QR code as ${format.toUpperCase()}...`)
    setTimeout(() => {
      setDownloadMessage(null)
    }, 3000)
  }

  const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  const getOSName = (userAgent: string): string => {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Processing QR code...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Ad Display Component (ME-QR-like functionality) */}
      {showAd && qrCode && (
        <QRAdDisplay
          qrCodeId={qrCode.id}
          onClose={handleAdClose}
          onContinue={handleAdContinue}
          adType="interstitial"
        />
      )}
      
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Redirect Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {redirecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5" />
                  {qrCode?.title || 'QR Code'}
                </>
              )}
            </CardTitle>
            <CardDescription>
              {redirecting 
                ? 'You are being redirected to the destination...'
                : isPreviewMode
                  ? 'This is a preview of your QR code. Click the button below to visit the destination.'
                  : 'Click the button below to continue to the destination'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPreviewMode && qrCode && (
              <div className="flex flex-col items-center space-y-4 mb-6">
                <QRCodePreview qrCode={qrCode} onDownload={handleDownload} setDownloadMessage={setDownloadMessage} />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code or click the button below to visit the destination
                  </p>
                  <p className="text-sm font-medium mt-2">
                    {qrCode.title}
                  </p>
                  {downloadMessage && (
                    <p className="text-sm text-green-600 mt-2">
                      {downloadMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!redirecting && (
              <div className="space-y-2">
                <Button 
                  onClick={handleManualRedirect}
                  className="w-full"
                  size="lg"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Continue to Destination
                </Button>
                {isPreviewMode && (
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Dashboard
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Card */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                QR Code Analytics
              </CardTitle>
              <CardDescription>
                Real-time statistics for this QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.totalScans}</div>
                  <div className="text-sm text-muted-foreground">Total Scans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.uniqueDevices}</div>
                  <div className="text-sm text-muted-foreground">Unique Devices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.uniqueCountries}</div>
                  <div className="text-sm text-muted-foreground">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.uniqueCities}</div>
                  <div className="text-sm text-muted-foreground">Cities</div>
                </div>
              </div>

              {/* Device breakdown */}
              {Object.keys(analytics.scansByDevice).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Scans by Device</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.scansByDevice).map(([device, count]) => (
                      <div key={device} className="flex justify-between items-center">
                        <span className="text-sm">{device}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Country breakdown */}
              {Object.keys(analytics.scansByCountry).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Scans by Country</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.scansByCountry).map(([country, count]) => (
                      <div key={country} className="flex justify-between items-center">
                        <span className="text-sm">{country}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* QR Code Info */}
        {qrCode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                QR Code Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{qrCode.isDynamic ? 'Dynamic' : 'Static'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={qrCode.isActive ? 'text-green-600' : 'text-red-600'}>
                    {qrCode.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(qrCode.createdAt).toLocaleDateString()}</span>
                </div>
                {qrCode.lastScannedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Scanned:</span>
                    <span>{new Date(qrCode.lastScannedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}