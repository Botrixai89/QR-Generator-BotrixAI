"use client"
import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import type { QRTemplateConfig, QRStickerConfig } from "@/types/qr-code-advanced"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Download,
  Upload,
  Settings,
  Zap,
  Calendar,
  Users,
  Link,
  Sparkles,
  Sticker,
  Eye,
  Circle,
  Square,
  Heart,
  Star,
  Hexagon,
  Diamond,
  Cloud,
  Gift,
  Coffee,
  Music,
  Car,
  Home,
  Sun,
  Moon,
  Brain,
  Flower,
  Shield,
  Cake,
  Leaf,
  RotateCcw,
  CreditCard,
  IndianRupee,
  Contact,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Globe,
  MapPin
} from "lucide-react"
import { socialMediaIcons, SocialMediaPlatform } from "@/components/social-media-icons"
import { loadAdvancedQR } from "@/lib/qr-loader"
import { appendTestQrCode } from "@/lib/e2e-test-storage"
import { getSocialMediaLogoDataUrl, isSocialMediaTemplate, SOCIAL_MEDIA_PLATFORMS } from "@/lib/social-media-logos"
import { useEffectiveSession } from "@/hooks/use-effective-session"
import {
  AdvancedQROptions,
  QRShape,
  QRTemplate,
  QRSticker,
  QR_TEMPLATES,
  QR_STICKERS
} from "@/types/qr-code-advanced"

interface QRGeneratorProps {
  userId?: string
}

// Shape icons mapping
const shapeIcons: Record<QRShape, React.ComponentType<{ className?: string }>> = {
  square: Square,
  circle: Circle,
  heart: Heart,
  hexagon: Hexagon,
  brain: Brain,
  star: Star,
  diamond: Diamond,
  cloud: Cloud,
  flower: Flower,
  shield: Shield,
  gift: Gift,
  cake: Cake,
  coffee: Coffee,
  music: Music,
  car: Car,
  house: Home,
  tree: Leaf,
  sun: Sun,
  moon: Moon,
  custom: Settings,
}

const dataUriToFile = (dataUri: string, fileName: string): File | null => {
  if (typeof window === 'undefined') return null
  const commaIndex = dataUri.indexOf(',')
  if (commaIndex === -1) return null
  const header = dataUri.substring(0, commaIndex)
  const base64 = dataUri.substring(commaIndex + 1)
  const mimeMatch = header.match(/data:(.*?);/)
  const mime = mimeMatch?.[1] || 'image/png'
  try {
    const byteString = window.atob(base64)
    const arrayBuffer = new ArrayBuffer(byteString.length)
    const uintArray = new Uint8Array(arrayBuffer)
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i)
    }
    return new File([uintArray], fileName, { type: mime })
  } catch (error) {
    console.warn('Failed to convert data URI to file:', error)
    return null
  }
}

// Template preview component
function TemplatePreview({ template, isSelected, onClick }: {
  template: QRTemplateConfig,
  isSelected: boolean,
  onClick: () => void
}) {
  const [previewRef, setPreviewRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (previewRef && template) {
      const timeoutId = setTimeout(() => {
        try {
          const previewOptions = {
            data: "Preview",
            width: 80,
            height: 80,
            type: "svg" as const,
            foregroundColor: template.colors?.foreground || '#000000',
            backgroundColor: template.colors?.background || '#ffffff',
            dotType: template.styles?.dotType || 'square',
            cornerType: template.styles?.cornerType || 'square',
            eyePattern: template.styles?.eyePattern || 'square',
            watermark: false,
            effects: {},
            gradient: template.colors?.gradient
          }
            ; (async () => {
              const getCreator = await loadAdvancedQR()
              const qrGenerator = getCreator(previewOptions)
              await qrGenerator.generate(previewRef)
            })()
        } catch (error) {
          console.error('Error generating template preview:', error)
          if (previewRef) {
            previewRef.innerHTML = `
              <div style="width: 80px; height: 80px; background: ${template.colors?.background || '#ffffff'}; border: 2px solid ${template.colors?.foreground || '#000000'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: ${template.colors?.foreground || '#000000'};">QR</div>
            `
          }
        }
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [previewRef, template])
  return (
    <div
      className={`group relative cursor-pointer rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-lg hover:scale-105 ${isSelected
        ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
        : 'border-border hover:border-primary/60 bg-card'
        }`}
      onClick={onClick}
    >
      {/* Template Preview */}
      <div className="aspect-square w-full rounded-lg bg-white p-2 shadow-sm border">
        <div
          ref={setPreviewRef}
          className="w-full h-full flex items-center justify-center"
        />
      </div>

      {/* Template Info */}
      <div className="mt-3 text-center space-y-1">
        <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {template.name}
        </div>
        <div className="text-xs text-muted-foreground leading-tight">
          {template.description}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  )
}

// Shape preview component
function ShapePreview({ shape, isSelected, onClick }: {
  shape: QRShape,
  isSelected: boolean,
  onClick: () => void
}) {
  const IconComponent = shapeIcons[shape] || Square

  return (
    <div
      className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      onClick={onClick}
    >
      <div className="aspect-square w-full rounded bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <IconComponent className="h-8 w-8 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="mt-2 text-center">
        <div className="text-xs font-medium capitalize text-foreground">{shape}</div>
      </div>
    </div>
  )
}

// Sticker preview component
function StickerPreview({ sticker, isSelected, onClick }: {
  sticker: QRStickerConfig,
  isSelected: boolean,
  onClick: () => void
}) {
  const renderStickerPreview = () => {
    const size = 24
    switch (sticker.type) {
      case 'heart-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-red-500">
            <path d="M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z"
              fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )
      case 'star-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-yellow-500">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )
      case 'circle-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-blue-500">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )
      case 'gold-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-yellow-600">
            <rect x="2" y="2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )
      case 'silver-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-500 dark:text-gray-400">
            <rect x="2" y="2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )
      case 'rainbow-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" fill="none" stroke="url(#rainbow)" strokeWidth="2" />
            <defs>
              <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="16.66%" stopColor="#ff8000" />
                <stop offset="33.33%" stopColor="#ffff00" />
                <stop offset="50%" stopColor="#80ff00" />
                <stop offset="66.66%" stopColor="#00ffff" />
                <stop offset="83.33%" stopColor="#8000ff" />
                <stop offset="100%" stopColor="#ff0080" />
              </linearGradient>
            </defs>
          </svg>
        )
      case 'christmas-tree':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-green-600">
            <path d="M12,2 L8,8 L12,6 L16,8 L12,2 Z M12,6 L6,14 L12,10 L18,14 L12,6 Z M12,10 L4,22 L12,18 L20,22 L12,10 Z M12,18 L12,22"
              fill="currentColor" />
          </svg>
        )
      case 'santa':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-red-600">
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path d="M8,16 Q12,12 16,16" fill="currentColor" />
          </svg>
        )
      case 'snowman':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-400 dark:text-gray-500">
            <circle cx="12" cy="6" r="3" fill="currentColor" />
            <circle cx="12" cy="14" r="4" fill="currentColor" />
            <circle cx="10" cy="5" r="1" fill="white" />
            <circle cx="14" cy="5" r="1" fill="white" />
          </svg>
        )
      case 'gift-box':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-red-500">
            <rect x="4" y="6" width="16" height="12" fill="currentColor" />
            <rect x="4" y="6" width="16" height="3" fill="#ff6b6b" />
            <rect x="11" y="2" width="2" height="16" fill="#ff6b6b" />
          </svg>
        )
      case 'pumpkin':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-orange-500">
            <path d="M12,2 C8,2 5,5 5,9 C5,13 8,16 12,16 C16,16 19,13 19,9 C19,5 16,2 12,2 Z M9,7 C9.5,7 10,7.5 10,8 C10,8.5 9.5,9 9,9 C8.5,9 8,8.5 8,8 C8,7.5 8.5,7 9,7 Z M15,7 C15.5,7 16,7.5 16,8 C16,8.5 15.5,9 15,9 C14.5,9 14,8.5 14,8 C14,7.5 14.5,7 15,7 Z"
              fill="currentColor" />
          </svg>
        )
      case 'bat':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-800 dark:text-gray-300">
            <path d="M12,2 C8,4 6,8 6,12 C6,16 8,20 12,22 C16,20 18,16 18,12 C18,8 16,4 12,2 Z M10,8 C10.5,8 11,8.5 11,9 C11,9.5 10.5,10 10,10 C9.5,10 9,9.5 9,9 C9,8.5 9.5,8 10,8 Z M14,8 C14.5,8 15,8.5 15,9 C15,9.5 14.5,10 14,10 C13.5,10 13,9.5 13,9 C13,8.5 13.5,8 14,8 Z"
              fill="currentColor" />
          </svg>
        )
      case 'skull':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-600 dark:text-gray-400">
            <circle cx="12" cy="8" r="6" fill="currentColor" />
            <circle cx="9" cy="7" r="1" fill="white" />
            <circle cx="15" cy="7" r="1" fill="white" />
            <path d="M8,12 Q12,16 16,12" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        )
      default:
        return <Sticker className="h-6 w-6 text-gray-600 dark:text-gray-400" />
    }
  }

  return (
    <div
      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      onClick={onClick}
    >
      <div className="aspect-square w-full rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        {renderStickerPreview()}
      </div>
      <div className="mt-2 text-center">
        <div className="text-xs font-medium capitalize text-foreground">{sticker.type.replace('-', ' ')}</div>
      </div>
    </div>
  )
}

export default function QRGenerator({ userId }: QRGeneratorProps) {
  const router = useRouter()
  const { session } = useEffectiveSession()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const isClientTestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true'
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [showGuestUpsell, setShowGuestUpsell] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [downloadQuality, setDownloadQuality] = useState<'web' | 'print' | 'ultra-hd'>('ultra-hd')
  const [downloadMessage] = useState<string | null>(null)
  const [showGuestReadyMessage, setShowGuestReadyMessage] = useState(false)
  const isGuest = !userId || !session?.user


  // Dynamic QR code states
  const [isDynamic, setIsDynamic] = useState(false)
  const [expiresAt, setExpiresAt] = useState("")
  const [maxScans, setMaxScans] = useState("")
  const [redirectUrl, setRedirectUrl] = useState("")

  // UPI Payment states
  const [isUpiPayment, setIsUpiPayment] = useState(false)
  const [upiId, setUpiId] = useState("")
  const [upiAmount, setUpiAmount] = useState("")
  const [upiMerchantName, setUpiMerchantName] = useState("")
  const [upiTransactionNote, setUpiTransactionNote] = useState("")

  // Contact QR states
  const [isContact, setIsContact] = useState(false)
  const [contactFirstName, setContactFirstName] = useState("")
  const [contactLastName, setContactLastName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactOrg, setContactOrg] = useState("")
  const [contactJobTitle, setContactJobTitle] = useState("")
  const [contactWebsite, setContactWebsite] = useState("")
  const [contactAddress, setContactAddress] = useState("")

  // Advanced QR options
  const [qrOptions, setQrOptions] = useState<AdvancedQROptions>({
    data: "",
    width: 300,
    height: 300,
    type: "svg",
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
    dotType: "square",
    cornerType: "square",
    eyePattern: "square",
    watermark: true,
    effects: {
      shadow: false,
      glow: false,
      threeD: false,
    }
  })
  // Persist the raw logo file for upload to backend
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [generatedLogoFile, setGeneratedLogoFile] = useState<File | null>(null)

  const qrRef = useRef<HTMLDivElement>(null)
  const qrGeneratorRef = useRef<{
    generate: (element: HTMLElement) => Promise<unknown>
    updateData?: (data: string) => void
    download?: (filename?: string, format?: "png" | "svg", quality?: "web" | "print" | "ultra-hd") => void
  } | null>(null)
  const retryOnceRef = useRef<boolean>(false)


  // Function to generate vCard 3.0 string for Contact QR codes
  const generateVCardString = useCallback((
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    org: string,
    jobTitle: string,
    website: string,
    address: string
  ): string => {
    const lines: string[] = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName};;;`,
      `FN:${[firstName, lastName].filter(Boolean).join(" ") || "Contact"}`,
    ]
    if (phone) lines.push(`TEL;TYPE=CELL:${phone}`)
    if (email) lines.push(`EMAIL:${email}`)
    if (org) lines.push(`ORG:${org}`)
    if (jobTitle) lines.push(`TITLE:${jobTitle}`)
    if (website) lines.push(`URL:${website}`)
    if (address) lines.push(`ADR:;;${address};;;;`)
    lines.push("END:VCARD")
    return lines.join("\r\n")
  }, [])

  // Function to generate UPI payment URL - Simple format for maximum compatibility
  const generateUpiUrl = useCallback((upiId: string, amount?: string, merchantName?: string, transactionNote?: string) => {
    if (!upiId.trim()) return ""

    // Clean UPI ID (preserve case for compatibility)
    const cleanUpiId = upiId.trim()

    // Validate UPI ID format (basic validation)
    const upiIdPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/
    if (!upiIdPattern.test(cleanUpiId)) {
      console.warn("Invalid UPI ID format:", cleanUpiId)
    }

    // Generate simple UPI URL - works with all UPI apps (GPay, PhonePe, Paytm, BHIM)
    // Format: upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&cu=INR
    let upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpiId)}`

    // Add payee name
    if (merchantName?.trim()) {
      upiUrl += `&pn=${encodeURIComponent(merchantName.trim())}`
    } else {
      const username = cleanUpiId.split('@')[0]
      upiUrl += `&pn=${encodeURIComponent(username)}`
    }

    // Add amount if specified
    if (amount?.trim() && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
      upiUrl += `&am=${parseFloat(amount).toFixed(2)}`
    }

    // Add currency (required for UPI)
    upiUrl += `&cu=INR`

    // Add transaction note if specified
    if (transactionNote?.trim()) {
      upiUrl += `&tn=${encodeURIComponent(transactionNote.trim())}`
    }

    return upiUrl
  }, [])

  // Ensure we're on the client side and auto-fill URL
  useEffect(() => {
    setIsClient(true)

    // Auto-fill the URL field with the current website URL
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.origin
      setUrl(currentUrl)
    }
  }, [])

  // Initialize QR code with advanced features
  useEffect(() => {
    if (isClient && qrRef.current) {
      let cancelled = false

      let qrData = url || "https://example.com"

      // If UPI payment is enabled, generate UPI URL
      if (isUpiPayment && upiId) {
        qrData = generateUpiUrl(upiId, upiAmount, upiMerchantName, upiTransactionNote)
      }

      // If Contact QR is enabled, generate vCard string
      if (isContact && (contactFirstName || contactPhone)) {
        qrData = generateVCardString(
          contactFirstName, contactLastName, contactPhone,
          contactEmail, contactOrg, contactJobTitle, contactWebsite, contactAddress
        )
      }

      const options = {
        ...qrOptions,
        data: qrData
      }

      // Clear previous QR code before generating new one
      if (qrRef.current) {
        qrRef.current.innerHTML = ""
      }

      // Add timeout to prevent infinite loops
      const timeoutId = setTimeout(() => {
        ; (async () => {
          try {
            if (!qrRef.current || cancelled) return

            const getCreator = await loadAdvancedQR()
            if (!getCreator) {
              throw new Error('Failed to load QR generator')
            }

            if (cancelled || !qrRef.current) return

            qrGeneratorRef.current = getCreator(options) as typeof qrGeneratorRef.current

            if (!qrGeneratorRef.current || cancelled || !qrRef.current) return

            // Generate QR code and await completion
            await qrGeneratorRef.current.generate(qrRef.current)

            if (cancelled || !qrRef.current) return

            // Apply watermark after QR code is generated
            if (options.watermark || false) {
              setTimeout(() => {
                if (cancelled || !qrRef.current) return
                const svg = qrRef.current.querySelector('svg') as unknown as SVGElement | null
                if (svg) {
                  // Lazy import to avoid duplicate bundle cost on server
                  import('@/lib/qr-watermark').then(({ addBotrixLogoToQR }) => {
                    if (!cancelled && qrRef.current) {
                      addBotrixLogoToQR(svg as unknown as SVGElement)
                    }
                  }).catch(() => { /* no-op */ })
                }
              }, 100)
            }
          } catch (error) {
            console.error('Error generating QR code:', error)
            if (!cancelled && qrRef.current) {
              qrRef.current.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 250px; color: #666; font-size: 14px;">Error generating QR code</div>`
            }
          }
        })()
      }, 100) // Small delay to prevent rapid re-renders

      return () => {
        cancelled = true
        clearTimeout(timeoutId)
      }
    }
  }, [isClient, url, qrOptions, isUpiPayment, upiId, upiAmount, upiMerchantName, upiTransactionNote, generateUpiUrl,
    isContact, contactFirstName, contactLastName, contactPhone, contactEmail, contactOrg, contactJobTitle, contactWebsite, contactAddress, generateVCardString])

  // Retry generation once if SVG didn't render (e.g., racing updates after logo upload)
  useEffect(() => {
    if (!isClient || !qrRef.current) return
    const checkId = setTimeout(() => {
      const hasSvg = !!qrRef.current!.querySelector('svg')
      if (!hasSvg && !retryOnceRef.current) {
        retryOnceRef.current = true
        // Reset retry flag after a delay to allow future retries
        setTimeout(() => {
          retryOnceRef.current = false
        }, 1000)
        // Trigger a soft re-render by nudging width (no visual change)
        setQrOptions(prev => ({ ...prev }))
      } else if (hasSvg) {
        // Reset retry flag if SVG is present
        retryOnceRef.current = false
      }
    }, 300) // Increased delay to ensure generation has time to complete
    return () => clearTimeout(checkId)
  }, [isClient, qrOptions.logo, qrOptions.template, qrOptions.shape, url])

  // Ensure watermark persists after logo uploads or option changes
  useEffect(() => {
    if (!isClient || !qrRef.current) return
    if (!(qrOptions.watermark || false)) return

    // Only apply watermark if QR code is already rendered
    const checkAndApplyWatermark = () => {
      const svg = qrRef.current?.querySelector('svg') as unknown as SVGElement | null
      if (svg) {
        import('@/lib/qr-watermark').then(({ addBotrixLogoToQR }) => {
          // Double-check SVG still exists after async import
          if (qrRef.current?.querySelector('svg')) {
            addBotrixLogoToQR(svg as unknown as SVGElement)
          }
        }).catch(() => { /* no-op */ })
      }
    }

    // Re-apply watermark shortly after any logo change which may trigger re-render
    const tid = setTimeout(checkAndApplyWatermark, 200)
    return () => clearTimeout(tid)
  }, [isClient, qrOptions.logo, qrOptions.watermark])

  // Clear template-generated logo when template is cleared or when switching to non-social media template
  useEffect(() => {
    if (!isClient) return

    const socialTemplateActive = isSocialMediaTemplate(qrOptions.template)

    // If no template is selected or template is not a social media template, clear generated logo
    if (!qrOptions.template || !socialTemplateActive) {
      // Only clear if it's a generated logo (not user-uploaded) and logo currently exists
      if (!logoFile && generatedLogoFile && qrOptions.logo) {
        setGeneratedLogoFile(null)
        setQrOptions(prev => ({ ...prev, logo: undefined }))
      }
    }
  }, [isClient, qrOptions.template, logoFile, generatedLogoFile])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setGeneratedLogoFile(null)
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
      const lowerName = file.name.toLowerCase()
      const hasAllowedExt = allowedExts.some(ext => lowerName.endsWith(ext))
      if (!allowedTypes.includes(file.type) || !hasAllowedExt) {
        const { toast } = await import("sonner")
        toast.error(`Invalid file type. Please upload an image file (JPEG, PNG, GIF, WebP, or SVG).`)
        event.target.value = '' // Clear the input
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        const { toast } = await import("sonner")
        toast.error(`File too large. Please upload an image smaller than 5MB.`)
        event.target.value = '' // Clear the input
        return
      }

      // Keep the file so we can send it to the API for storage
      setLogoFile(file)

      const reader = new FileReader()
      reader.onload = async (e) => {
        const logoUrl = e.target?.result as string
        setQrOptions(prev => ({
          ...prev,
          logo: {
            image: logoUrl,
            size: 0.3,
            margin: 5,
            opacity: 1
          }
        }))
        const { toast } = await import("sonner")
        toast.success('Logo uploaded successfully!')
      }
      reader.onerror = async () => {
        const { toast } = await import("sonner")
        toast.error('Failed to read the file. Please try again.')
        event.target.value = '' // Clear the input
      }
      reader.readAsDataURL(file)
    }
  }

  // Helper function to check if user is using pro features
  const isUsingProFeature = (): { isPro: boolean; featureName: string } => {
    // Check for social media templates
    if (qrOptions.template && SOCIAL_MEDIA_PLATFORMS.includes(qrOptions.template as SocialMediaPlatform)) {
      return { isPro: true, featureName: 'Social Media QR Codes' }
    }

    // Contact, UPI, and Dynamic QR are free — no pro gate
    return { isPro: false, featureName: '' }
  }

  const premiumTabNames: Record<string, string> = {
    upi: 'UPI payment QR codes',
    dynamic: 'Dynamic QR codes',
  }

  const handleTabChange = (value: string) => {
    if (isGuest && (value === 'social' || value === 'upi' || value === 'dynamic')) {
      setShowGuestUpsell(true)
      return
    }
    // Sync boolean flags when switching tabs
    setIsUpiPayment(value === 'upi')
    setIsDynamic(value === 'dynamic')
    setIsContact(value === 'contact')
    setActiveTab(value)
  }

  const handleGenerate = async () => {
    // Validate input based on mode
    if (isUpiPayment) {
      if (!upiId.trim()) {
        toast.error("Please enter a UPI ID to generate QR code")
        return
      }
    } else if (isContact) {
      if (!contactFirstName.trim() && !contactPhone.trim()) {
        toast.error("Please enter at least a name or phone number for the contact")
        return
      }
    } else {
      if (!url.trim()) {
        toast.error("Please enter a URL or text to generate QR code")
        return
      }
    }

    setIsGenerating(true)

    if (!userId) {
      try {
        setShowGuestReadyMessage(false)
        setQrOptions((prev) => ({ ...prev }))
        const deadline = Date.now() + 8000
        while (Date.now() < deadline) {
          if (qrRef.current?.querySelector('svg')) break
          await new Promise((r) => setTimeout(r, 50))
        }
        if (!qrRef.current?.querySelector('svg')) {
          toast.error('Could not generate QR code preview. Please try again.')
          return
        }
        setShowGuestReadyMessage(true)
        setShowGuestUpsell(true)
      } finally {
        setIsGenerating(false)
      }
      return
    }

    // Determine the actual URL/data to save
    let actualUrl = url
    let actualTitle = title || url

    if (isUpiPayment && upiId) {
      actualUrl = generateUpiUrl(upiId, upiAmount, upiMerchantName, upiTransactionNote)
      actualTitle = title || `UPI Payment - ${upiId}`
    } else if (isContact) {
      actualUrl = generateVCardString(
        contactFirstName, contactLastName, contactPhone,
        contactEmail, contactOrg, contactJobTitle, contactWebsite, contactAddress
      )
      actualTitle = title || `Contact - ${[contactFirstName, contactLastName].filter(Boolean).join(" ") || contactPhone || "Contact"}`
    }

    if (isClientTestMode) {
      try {
        const nowIso = new Date().toISOString()
        const generatedId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `test-${Date.now()}`
        appendTestQrCode({
          id: generatedId,
          title: actualTitle,
          url: actualUrl,
          originalUrl: actualUrl,
          foregroundColor: qrOptions.foregroundColor || "#000000",
          backgroundColor: qrOptions.backgroundColor || "#ffffff",
          dotType: qrOptions.dotType || "square",
          cornerType: qrOptions.cornerType || "square",
          hasWatermark: qrOptions.watermark ?? true,
          createdAt: nowIso,
          updatedAt: nowIso,
          downloadCount: 0,
        })
        toast.success("QR code saved successfully! (test mode)")
        router.push("/dashboard")
      } finally {
        setIsGenerating(false)
      }
      return
    }

    try {
      const formData = new FormData()

      formData.append("url", actualUrl)
      formData.append("title", actualTitle)
      formData.append("foregroundColor", qrOptions.foregroundColor || "#000000")
      formData.append("backgroundColor", qrOptions.backgroundColor || "#ffffff")
      formData.append("dotType", qrOptions.dotType || "square")
      formData.append("cornerType", qrOptions.cornerType || "square")
      formData.append("eyePattern", qrOptions.eyePattern || "square")
      formData.append("hasWatermark", (qrOptions.watermark || false).toString())
      formData.append("isDynamic", isDynamic.toString())
      formData.append("shape", qrOptions.shape || "square")
      formData.append("template", qrOptions.template || "")

      if (expiresAt) {
        formData.append("expiresAt", expiresAt)
      }
      if (maxScans) {
        formData.append("maxScans", maxScans)
      }
      if (redirectUrl) {
        formData.append("redirectUrl", redirectUrl)
      }

      if (qrOptions.gradient) {
        formData.append("gradient", JSON.stringify(qrOptions.gradient))
      }
      if (qrOptions.sticker) {
        formData.append("sticker", JSON.stringify(qrOptions.sticker))
      }
      if (qrOptions.effects) {
        formData.append("effects", JSON.stringify(qrOptions.effects))
      }

      // Attach logo file if available so backend persists it and returns logoUrl
      const logoToUpload = logoFile || generatedLogoFile
      if (logoToUpload) {
        formData.append("logo", logoToUpload)
      }

      const response = await fetch("/api/qr-codes", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const savedQrCode = await response.json()
        if (isDynamic && savedQrCode.id) {
          const qrCodeUrl = `${window.location.origin}/qr/${savedQrCode.id}`

          // Update the QR code data
          if (qrGeneratorRef.current?.updateData) {
            qrGeneratorRef.current.updateData(qrCodeUrl)
          }
        }

        toast.success("QR code saved successfully!")
        router.push("/dashboard")
      } else {
        // Safely parse error response (supports ApiErrors shape and plain { error, message } from routes)
        let errorMessage = "Failed to save QR code"
        try {
          const errorData = (await response.json()) as Record<string, unknown>

          const topMessage = typeof errorData.message === 'string' ? errorData.message : ''
          const err = errorData.error
          const nestedMessage =
            err && typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string'
              ? (err as { message: string }).message
              : ''
          const nestedCode =
            err && typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'string'
              ? (err as { code: string }).code
              : ''
          const nestedDetailsRaw =
            err && typeof err === 'object' && err !== null && 'details' in err
              ? (err as { details: unknown }).details
              : undefined
          const nestedDetails =
            typeof nestedDetailsRaw === 'string'
              ? nestedDetailsRaw
              : nestedDetailsRaw != null
                ? String(nestedDetailsRaw)
                : ''
          const flatErrorString = typeof err === 'string' ? err : ''

          if (topMessage) {
            errorMessage = topMessage
          } else if (nestedMessage) {
            errorMessage = nestedMessage
          } else if (flatErrorString) {
            errorMessage = flatErrorString
          }

          // Surface Postgres / API details (e.g. constraint name) when message is generic
          if (nestedDetails && response.status >= 500) {
            errorMessage = errorMessage.includes(nestedDetails)
              ? errorMessage
              : `${errorMessage} (${nestedDetails})`
          }

          const creditCode =
            nestedCode === 'no_credits' ||
            flatErrorString === 'no_credits' ||
            (typeof errorData.code === 'string' && errorData.code === 'no_credits')

          if (response.status === 402 && creditCode) {
            toast.error("You have no credits left. Please purchase more credits to continue.")
            router.push("/pricing")
            return
          }

          if (response.status === 401) {
            errorMessage = topMessage || nestedMessage || "Authentication required. Please sign in."
            toast.error(errorMessage)
            router.push("/auth/signin")
            return
          }

          // 403: plan limits, feature not allowed, etc. — show API message; do not force sign-in

          if (response.status === 429) {
            errorMessage = "Too many requests. Please try again later."
          }
        } catch {
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage = errorText.substring(0, 200)
            }
          } catch {
            errorMessage = `Request failed with status ${response.status}`
          }
        }

        if (typeof errorMessage !== 'string') {
          errorMessage = "An unknown error occurred"
        }

        toast.error(errorMessage)
        // Single-line log so Next.js dev overlay shows a readable message (objects often render as {})
        console.error(
          `QR code creation failed: ${response.status} ${response.statusText || ''} — ${errorMessage}`
        )
      }
    } catch (error) {
      console.error("Error saving QR code:", error)

      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error("Network error. Please check your internet connection and try again.")
      } else if (error instanceof Error) {
        toast.error(`Failed to save QR code: ${error.message}`)
      } else {
        toast.error("Failed to save QR code. Please try again.")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (format: "png" | "svg") => {
    if (qrGeneratorRef.current?.download) {
      qrGeneratorRef.current.download(title || "qr-code", format, downloadQuality)
    }
  }

  const handleReset = () => {
    setShowGuestReadyMessage(false)
    setQrOptions({
      data: url || "https://example.com",
      width: 300,
      height: 300,
      type: "svg",
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
      dotType: "square",
      cornerType: "square",
      eyePattern: "square",
      watermark: true,
      effects: {
        shadow: false,
        glow: false,
        threeD: false,
      },
      logo: undefined, // Clear logo on reset
      template: undefined, // Clear template on reset
    })

    // Reset UPI payment fields
    setIsUpiPayment(false)
    setUpiId("")
    setUpiAmount("")
    setUpiMerchantName("")
    setUpiTransactionNote("")
    setGeneratedLogoFile(null)
    setLogoFile(null) // Clear uploaded logo file
  }

  const prepareTemplateLogoFile = useCallback(async (imageSrc: string, templateId: string) => {
    try {
      if (!imageSrc) {
        setGeneratedLogoFile(null)
        return
      }
      if (imageSrc.startsWith('data:')) {
        const file = dataUriToFile(imageSrc, `${templateId}-logo`)
        setGeneratedLogoFile(file)
        return
      }
      if (typeof window === 'undefined') {
        setGeneratedLogoFile(null)
        return
      }
      const resolvedSrc = imageSrc.startsWith('http') || imageSrc.startsWith('blob:')
        ? imageSrc
        : `${window.location.origin}${imageSrc}`
      const response = await fetch(resolvedSrc)
      if (!response.ok) {
        throw new Error(`Failed to fetch template logo: ${response.status}`)
      }
      const blob = await response.blob()
      const extension = blob.type?.split('/')?.pop() || 'png'
      const fileName = `${templateId}-logo.${extension}`
      const file = new File([blob], fileName, { type: blob.type || 'image/png' })
      setGeneratedLogoFile(file)
    } catch (error) {
      console.warn('Unable to prepare template logo file:', error)
      setGeneratedLogoFile(null)
    }
  }, [])



  const handleTemplateSelect = (templateId: QRTemplate) => {
    const template = QR_TEMPLATES[templateId]
    if (template) {
      // Check if this is a social media template
      let logoConfig = qrOptions.logo

      // If it's a social media template, add the platform logo to the center
      if (SOCIAL_MEDIA_PLATFORMS.includes(templateId as SocialMediaPlatform)) {
        const logoDataUrl = getSocialMediaLogoDataUrl(templateId as SocialMediaPlatform)
        if (logoDataUrl) {
          logoConfig = {
            image: logoDataUrl,
            size: 0.25,
            margin: 5,
            opacity: 1
          }
          void prepareTemplateLogoFile(logoDataUrl, templateId)
        }
      } else {
        // Clear logo for non-social media templates unless user has manually uploaded a custom logo file
        // Only keep logo if user has manually uploaded one (tracked by logoFile state)
        if (logoFile) {
          // User has uploaded a logo, keep it
          logoConfig = qrOptions.logo
        } else {
          // No user upload, clear any template-generated logo
          logoConfig = undefined
          setGeneratedLogoFile(null)
        }
      }

      // Always apply the full template (colors + styles) for consistency.
      // The user can override colors with the color pickers afterwards.
      setQrOptions({
        ...qrOptions,
        template: templateId,
        foregroundColor: template.colors.foreground,
        backgroundColor: template.colors.background,
        gradient: template.colors.gradient,
        dotType: template.styles.dotType,
        cornerType: template.styles.cornerType,
        eyePattern: template.styles.eyePattern,
        sticker: template.sticker,
        logo: logoConfig,
      })
    }
  }

  const handleStickerSelect = (stickerId: QRSticker) => {
    const sticker = QR_STICKERS[stickerId]
    if (sticker) {
      setQrOptions(prev => ({ ...prev, sticker }))
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="text-center space-y-2 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">QR Code Generator</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Create beautiful, customizable QR codes with advanced features
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Configuration Panel */}
            <div className="lg:w-1/2 qr-config-scroll">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                      QR Code Configuration
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Set up your QR code content and customize its appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="basic" value={activeTab} onValueChange={handleTabChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1 p-1 bg-muted">
                        <TabsTrigger
                          value="basic"
                          className="px-2 py-2 text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                        >
                          Basic
                        </TabsTrigger>
                        <TabsTrigger
                          value="social"
                          className="px-2 py-2 text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                        >
                          Social
                        </TabsTrigger>
                        <TabsTrigger
                          value="upi"
                          className="px-2 py-2 text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                        >
                          UPI
                        </TabsTrigger>
                        <TabsTrigger
                          value="dynamic"
                          className="px-2 py-2 text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                        >
                          Dynamic
                        </TabsTrigger>
                        <TabsTrigger
                          value="contact"
                          className="px-2 py-2 text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                        >
                          Contact
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4 mt-4">
                        {/* URL Input */}
                        <div className="space-y-2">
                          <Label htmlFor="url">URL or Text</Label>
                          <Input
                            id="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                          />
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                          <Label htmlFor="title">Title (Optional)</Label>
                          <Input
                            id="title"
                            placeholder="My QR Code"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Logo (Optional)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="flex-1"
                              />
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>

                          {qrOptions.logo && qrOptions.logo.image && (
                            <div className="space-y-3 pt-2">
                              <div className="flex flex-row items-center justify-between">
                                <Label className="text-xs font-medium text-muted-foreground">Logo Size</Label>
                                <span className="text-xs text-muted-foreground">{Math.round((qrOptions.logo.size || 0.3) * 100)}%</span>
                              </div>
                              <Slider
                                min={0.1}
                                max={0.6}
                                step={0.05}
                                value={[qrOptions.logo.size || 0.3]}
                                onValueChange={([value]) => {
                                  setQrOptions(prev => ({
                                    ...prev,
                                    logo: {
                                      image: prev.logo?.image || "",
                                      size: value,
                                      margin: prev.logo?.margin || 5,
                                      opacity: prev.logo?.opacity || 1
                                    }
                                  }))
                                }}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>

                        {/* Watermark Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                          <div className="space-y-0.5 flex-1">
                            <Label className="text-sm sm:text-base">BotrixAI Watermark</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Add our watermark to your QR code
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">

                            <Switch
                              checked={qrOptions.watermark || false}
                              onCheckedChange={(checked) => {
                                setQrOptions(prev => ({ ...prev, watermark: checked }))
                              }}
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Advanced Customization Section */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            <Label className="text-sm sm:text-base font-medium">Advanced Customization</Label>
                          </div>

                          {/* Templates — horizontal scroll */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Templates</Label>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
                              style={{ scrollbarWidth: 'thin' }}
                            >
                              {Object.entries(QR_TEMPLATES).map(([id, template]) => (
                                <div key={id} className="flex-shrink-0 w-[110px]">
                                  <TemplatePreview
                                    template={template}
                                    isSelected={qrOptions.template === id}
                                    onClick={() => handleTemplateSelect(id as QRTemplate)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Colors */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Colors</Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Foreground</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    value={qrOptions.foregroundColor || '#000000'}
                                    onChange={(e) => setQrOptions(prev => ({ ...prev, foregroundColor: e.target.value }))}
                                    className="w-8 h-8 p-1"
                                  />
                                  <Input
                                    value={qrOptions.foregroundColor || '#000000'}
                                    onChange={(e) => setQrOptions(prev => ({ ...prev, foregroundColor: e.target.value, gradient: undefined }))}
                                    className="flex-1 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Background</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    value={qrOptions.backgroundColor || '#ffffff'}
                                    onChange={(e) => setQrOptions(prev => ({ ...prev, backgroundColor: e.target.value, gradient: undefined }))}
                                    className="w-8 h-8 p-1"
                                  />
                                  <Input
                                    value={qrOptions.backgroundColor || '#ffffff'}
                                    onChange={(e) => setQrOptions(prev => ({ ...prev, backgroundColor: e.target.value, gradient: undefined }))}
                                    className="flex-1 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </TabsContent>

                      <TabsContent value="social" className="space-y-4 mt-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Social media</Label>
                          <p className="text-xs text-muted-foreground">
                            Choose a platform to apply branded styling to your QR code.
                          </p>
                          <div
                            className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
                            style={{ scrollbarWidth: 'thin' }}
                          >
                            {Object.entries(QR_TEMPLATES)
                              .filter(([id]) =>
                                SOCIAL_MEDIA_PLATFORMS.includes(id as SocialMediaPlatform)
                              )
                              .map(([id, template]) => (
                                <div key={id} className="flex-shrink-0 w-[110px]">
                                  <TemplatePreview
                                    template={template}
                                    isSelected={qrOptions.template === id}
                                    onClick={() => handleTemplateSelect(id as QRTemplate)}
                                  />
                                </div>
                              ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="upi" className="space-y-4 mt-4">
                        {/* UPI Payment Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              UPI Payment QR Code
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Generate QR codes for UPI payments that can be scanned by any UPI app
                            </p>
                          </div>
                          <Switch
                            checked={isUpiPayment}
                            onCheckedChange={(checked) => setIsUpiPayment(checked)}
                          />
                        </div>

                        {isUpiPayment && (
                          <>
                            <Separator />

                            {/* UPI ID Input */}
                            <div className="space-y-2">
                              <Label htmlFor="upiId" className="flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" />
                                UPI ID *
                              </Label>
                              <Input
                                id="upiId"
                                placeholder="yourname@paytm or 9876543210@ybl"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className={upiId && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upiId.trim()) ? "border-red-500" : ""}
                              />
                              <p className="text-xs text-muted-foreground">
                                Enter your UPI ID (e.g., yourname@paytm, 9876543210@ybl, etc.)
                              </p>
                              {upiId && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upiId.trim()) && (
                                <p className="text-xs text-red-500">
                                  ⚠️ Invalid UPI ID format. Please check and try again.
                                </p>
                              )}
                            </div>

                            {/* Merchant Name */}
                            <div className="space-y-2">
                              <Label htmlFor="upiMerchantName">Merchant Name (Optional)</Label>
                              <Input
                                id="upiMerchantName"
                                placeholder="Your Business Name"
                                value={upiMerchantName}
                                onChange={(e) => setUpiMerchantName(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                This will be displayed to the payer
                              </p>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                              <Label htmlFor="upiAmount">Amount (Optional)</Label>
                              <Input
                                id="upiAmount"
                                type="number"
                                placeholder="100"
                                value={upiAmount}
                                onChange={(e) => setUpiAmount(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Leave empty to allow any amount
                              </p>
                            </div>

                            {/* Transaction Note */}
                            <div className="space-y-2">
                              <Label htmlFor="upiTransactionNote">Transaction Note (Optional)</Label>
                              <Input
                                id="upiTransactionNote"
                                placeholder="Payment for services"
                                value={upiTransactionNote}
                                onChange={(e) => setUpiTransactionNote(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Description of the payment
                              </p>
                            </div>

                            {/* UPI QR Preview */}
                            {upiId && (
                              <div className="space-y-2">
                                <Label>Generated UPI URL:</Label>
                                <div className="p-3 bg-gray-50 rounded-md text-xs font-mono break-all">
                                  {generateUpiUrl(upiId, upiAmount, upiMerchantName, upiTransactionNote)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  This URL will be encoded in the QR code
                                </p>

                                {/* Test UPI URL Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const upiUrl = generateUpiUrl(upiId, upiAmount, upiMerchantName, upiTransactionNote)
                                    window.open(upiUrl, '_blank')
                                  }}
                                  className="w-full"
                                >
                                  Test UPI URL
                                </Button>
                              </div>
                            )}

                            {/* UPI QR Code Information */}
                            <div className="space-y-2 p-3 bg-blue-50 rounded-md">
                              <div className="flex items-start gap-2">
                                <div className="text-blue-600 text-sm">ℹ️</div>
                                <div className="text-xs text-blue-800">
                                  <p className="font-medium mb-1">Important Notes:</p>
                                  <ul className="space-y-1 text-xs">
                                    <li>• UPI QR codes are designed for <strong>receiving payments</strong></li>
                                    <li>• Works with Google Pay, PhonePe, Paytm, BHIM, and all UPI apps</li>
                                    <li>• Always verify the UPI ID before sharing</li>
                                    <li>• Use the UPI app&apos;s built-in QR scanner for best results</li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* Troubleshooting Section */}
                            <div className="space-y-2 p-3 bg-amber-50 rounded-md">
                              <div className="flex items-start gap-2">
                                <div className="text-amber-600 text-sm">💡</div>
                                <div className="text-xs text-amber-800">
                                  <p className="font-medium mb-1">Tips:</p>
                                  <ul className="space-y-1 text-xs">
                                    <li>• <strong>Not scanning?</strong> Use the UPI app&apos;s QR scanner, not camera</li>
                                    <li>• <strong>Invalid UPI ID?</strong> Check format: username@bankname</li>
                                    <li>• <strong>Amount issues?</strong> Leave amount empty to allow any amount</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </TabsContent>

                      <TabsContent value="dynamic" className="space-y-4 mt-4">
                        {/* Dynamic QR Code Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Dynamic QR Code
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Create a QR code that can be updated without changing the code itself
                            </p>
                          </div>
                          <Switch
                            checked={isDynamic}
                            onCheckedChange={(checked) => setIsDynamic(checked)}
                          />
                        </div>

                        {isDynamic && (
                          <>
                            <Separator />

                            {/* Redirect URL */}
                            <div className="space-y-2">
                              <Label htmlFor="redirectUrl" className="flex items-center gap-2">
                                <Link className="h-4 w-4" />
                                Redirect URL
                              </Label>
                              <Input
                                id="redirectUrl"
                                placeholder="https://example.com"
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                URL to redirect users when they scan the QR code
                              </p>
                            </div>

                            {/* Expiration Date */}
                            <div className="space-y-2">
                              <Label htmlFor="expiresAt" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Expiration Date (Optional)
                              </Label>
                              <Input
                                id="expiresAt"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                min="1900-01-01T00:00" // Allow past dates for testing purposes
                              />
                              <p className="text-xs text-muted-foreground">
                                QR code will become inactive after this date (past dates allowed for testing)
                              </p>
                            </div>

                            {/* Max Scans */}
                            <div className="space-y-2">
                              <Label htmlFor="maxScans" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Maximum Scans (Optional)
                              </Label>
                              <Input
                                id="maxScans"
                                type="number"
                                placeholder="1000"
                                value={maxScans}
                                onChange={(e) => setMaxScans(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                QR code will become inactive after this many scans
                              </p>
                            </div>
                          </>
                        )}
                      </TabsContent>

                      {/* ===== CONTACT QR TAB ===== */}
                      <TabsContent value="contact" className="space-y-4 mt-4">
                        {/* Info banner */}

                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="contactFirstName">First Name</Label>
                            <Input
                              id="contactFirstName"
                              placeholder="John"
                              value={contactFirstName}
                              onChange={(e) => setContactFirstName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactLastName">Last Name</Label>
                            <Input
                              id="contactLastName"
                              placeholder="Doe"
                              value={contactLastName}
                              onChange={(e) => setContactLastName(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <Label htmlFor="contactPhone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </Label>
                          <Input
                            id="contactPhone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            placeholder="john@example.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                          />
                        </div>

                        {/* Organisation */}
                        <div className="space-y-2">
                          <Label htmlFor="contactOrg" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Organization (Optional)
                          </Label>
                          <Input
                            id="contactOrg"
                            placeholder="Acme Corp"
                            value={contactOrg}
                            onChange={(e) => setContactOrg(e.target.value)}
                          />
                        </div>

                        {/* Job Title */}
                        <div className="space-y-2">
                          <Label htmlFor="contactJobTitle" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Job Title (Optional)
                          </Label>
                          <Input
                            id="contactJobTitle"
                            placeholder="Software Engineer"
                            value={contactJobTitle}
                            onChange={(e) => setContactJobTitle(e.target.value)}
                          />
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                          <Label htmlFor="contactWebsite" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website (Optional)
                          </Label>
                          <Input
                            id="contactWebsite"
                            type="url"
                            placeholder="https://johndoe.com"
                            value={contactWebsite}
                            onChange={(e) => setContactWebsite(e.target.value)}
                          />
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                          <Label htmlFor="contactAddress" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Address (Optional)
                          </Label>
                          <Input
                            id="contactAddress"
                            placeholder="123 Main St, Mumbai, India"
                            value={contactAddress}
                            onChange={(e) => setContactAddress(e.target.value)}
                          />
                        </div>

                        {/* Live vCard preview */}
                        {(contactFirstName || contactPhone) && (
                          <div className="space-y-2">
                            <Label>vCard Preview (encoded in QR):</Label>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-xs font-mono break-all whitespace-pre-wrap border">
                              {generateVCardString(
                                contactFirstName, contactLastName, contactPhone,
                                contactEmail, contactOrg, contactJobTitle, contactWebsite, contactAddress
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              This vCard data will be encoded in the QR code
                            </p>
                          </div>
                        )}

                        {/* Tips */}
                        <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                          <div className="flex items-start gap-2">
                            <div className="text-amber-600 text-sm">💡</div>
                            <div className="text-xs text-amber-800 dark:text-amber-300">
                              <p className="font-medium mb-1">Tips:</p>
                              <ul className="space-y-1">
                                <li>• Works natively with <strong>iPhone</strong> camera and <strong>Android</strong> camera apps</li>
                                <li>• At least <strong>First Name</strong> or <strong>Phone</strong> is required</li>
                                <li>• The QR preview on the right updates as you type</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <Separator className="my-4" />

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleGenerate}
                        className="w-full"
                        disabled={
                          (
                            isUpiPayment
                              ? (!upiId.trim() || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upiId.trim()))
                              : isContact
                                ? (!contactFirstName.trim() && !contactPhone.trim())
                                : !url.trim()
                          ) ||
                          isGenerating
                        }
                      >
                        {isGenerating ? "Generating..." : "Generate QR Code"}
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleReset}
                          className="flex-1"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                        <Button
                          onClick={() => handleDownload('png')}
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <Download className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Download PNG</span>
                          <span className="sm:hidden">PNG</span>
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleDownload('svg')}
                        className="w-full text-xs sm:text-sm"
                      >
                        <Download className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Download SVG</span>
                        <span className="sm:hidden">SVG</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* Preview Panel - Sticky */}
            <div className="lg:w-1/2 qr-preview-sticky">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Your QR code will appear here with real-time updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px] sm:min-h-[500px]">
                    <div className="relative flex items-center justify-center w-full">
                      {isClient ? (
                        <div
                          ref={qrRef}
                          className="border rounded-lg p-2 sm:p-4 bg-white qr-code-container w-full max-w-full"
                          style={{
                            minHeight: "250px",
                            maxHeight: "400px",
                            width: "100%",
                            maxWidth: "100%",
                            backgroundColor: "#ffffff"
                          }}
                        />
                      ) : (
                        <div
                          className="border rounded-lg p-2 sm:p-4 bg-white flex items-center justify-center w-full"
                          style={{ minHeight: "250px", maxHeight: "400px", width: "100%", maxWidth: "100%" }}
                        >
                          <p className="text-sm sm:text-base text-muted-foreground">Loading QR code preview...</p>
                        </div>
                      )}
                    </div>

                    {showGuestReadyMessage && (
                      <p className="text-center text-green-600 dark:text-green-400 font-medium text-sm">
                        QR code is ready
                      </p>
                    )}

                    {url && (
                      <div className="space-y-3">
                        {/* Quality Selector */}
                        <div className="flex flex-col gap-2 w-full">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Download Quality:</label>
                          <div className="flex gap-1 sm:gap-2 flex-wrap">
                            {(['web', 'print', 'ultra-hd'] as const).map((quality) => (
                              <Button
                                key={quality}
                                onClick={() => setDownloadQuality(quality)}
                                variant={downloadQuality === quality ? "default" : "outline"}
                                size="sm"
                                className="text-xs flex-1 sm:flex-none min-w-0"
                              >
                                {quality === 'web' && (
                                  <>
                                    <span className="hidden sm:inline">Web (2x)</span>
                                    <span className="sm:hidden">2x</span>
                                  </>
                                )}
                                {quality === 'print' && (
                                  <>
                                    <span className="hidden sm:inline">Print (4x)</span>
                                    <span className="sm:hidden">4x</span>
                                  </>
                                )}
                                {quality === 'ultra-hd' && (
                                  <>
                                    <span className="hidden sm:inline">Ultra-HD (8x)</span>
                                    <span className="sm:hidden">8x</span>
                                  </>
                                )}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Download Status Message */}
                        {downloadMessage && (
                          <div className="text-sm text-green-600 text-center">
                            {downloadMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div >
      </div >

      <Dialog open={showGuestUpsell} onOpenChange={setShowGuestUpsell}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to unlock more features</DialogTitle>
            <DialogDescription>
              Save your QR codes, track analytics, and access social media, UPI, and dynamic QR capabilities when you create a free account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowGuestUpsell(false)
                router.push('/auth/signin')
              }}
            >
              I already have an account
            </Button>
            <Button
              onClick={() => {
                setShowGuestUpsell(false)
                router.push('/auth/signup')
              }}
            >
              Sign up free
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Login Modal — shown when a guest tries to generate or download */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="currentColor" className="text-primary" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-center text-xl">Sign in to generate</DialogTitle>
            <DialogDescription className="text-center">
              Create a free account and generate, customise, and download your QR codes — all for free.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            {/* Google */}
            <Button
              variant="outline"
              className="w-full flex items-center gap-3"
              onClick={async () => {
                setShowLoginModal(false)
                const { signIn } = await import('next-auth/react')
                signIn('google', { callbackUrl: '/' })
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                setShowLoginModal(false)
                router.push('/auth/signup')
              }}
            >
              Create free account
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setShowLoginModal(false)
                router.push('/auth/signin')
              }}
            >
              I already have an account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}



