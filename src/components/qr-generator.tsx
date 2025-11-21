"use client"
import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import type { QRTemplateConfig, QRStickerConfig } from "@/types/qr-code-advanced"
import type { PlanName } from "@/types/billing"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
  IndianRupee
} from "lucide-react"
import { socialMediaIcons, SocialMediaPlatform } from "@/components/social-media-icons"
import { loadAdvancedQR } from "@/lib/qr-loader"
import { getSocialMediaLogoDataUrl, isSocialMediaTemplate, SOCIAL_MEDIA_PLATFORMS } from "@/lib/social-media-logos"
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

type PlanState = PlanName | 'GUEST' | 'LOADING'

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
            gradient: template.colors?.gradient,
            shape: template.shape || 'square'
          }
          ;(async () => {
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
      className={`group relative cursor-pointer rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        isSelected 
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
      className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <div className="aspect-square w-full rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <IconComponent className="h-8 w-8 text-gray-600" />
      </div>
      <div className="mt-2 text-center">
        <div className="text-xs font-medium capitalize">{shape}</div>
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
                  fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )
      case 'star-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-yellow-500">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" 
                     fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )
      case 'circle-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-blue-500">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'gold-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-yellow-600">
            <rect x="2" y="2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'silver-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-500">
            <rect x="2" y="2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'rainbow-frame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" fill="none" stroke="url(#rainbow)" strokeWidth="2"/>
            <defs>
              <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff0000"/>
                <stop offset="16.66%" stopColor="#ff8000"/>
                <stop offset="33.33%" stopColor="#ffff00"/>
                <stop offset="50%" stopColor="#80ff00"/>
                <stop offset="66.66%" stopColor="#00ffff"/>
                <stop offset="83.33%" stopColor="#8000ff"/>
                <stop offset="100%" stopColor="#ff0080"/>
              </linearGradient>
            </defs>
          </svg>
        )
      case 'christmas-tree':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-green-600">
            <path d="M12,2 L8,8 L12,6 L16,8 L12,2 Z M12,6 L6,14 L12,10 L18,14 L12,6 Z M12,10 L4,22 L12,18 L20,22 L12,10 Z M12,18 L12,22" 
                  fill="currentColor"/>
          </svg>
        )
      case 'santa':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-red-600">
            <circle cx="12" cy="8" r="4" fill="currentColor"/>
            <path d="M8,16 Q12,12 16,16" fill="currentColor"/>
          </svg>
        )
      case 'snowman':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-400">
            <circle cx="12" cy="6" r="3" fill="currentColor"/>
            <circle cx="12" cy="14" r="4" fill="currentColor"/>
            <circle cx="10" cy="5" r="1" fill="white"/>
            <circle cx="14" cy="5" r="1" fill="white"/>
          </svg>
        )
      case 'gift-box':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-red-500">
            <rect x="4" y="6" width="16" height="12" fill="currentColor"/>
            <rect x="4" y="6" width="16" height="3" fill="#ff6b6b"/>
            <rect x="11" y="2" width="2" height="16" fill="#ff6b6b"/>
          </svg>
        )
      case 'pumpkin':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-orange-500">
            <path d="M12,2 C8,2 5,5 5,9 C5,13 8,16 12,16 C16,16 19,13 19,9 C19,5 16,2 12,2 Z M9,7 C9.5,7 10,7.5 10,8 C10,8.5 9.5,9 9,9 C8.5,9 8,8.5 8,8 C8,7.5 8.5,7 9,7 Z M15,7 C15.5,7 16,7.5 16,8 C16,8.5 15.5,9 15,9 C14.5,9 14,8.5 14,8 C14,7.5 14.5,7 15,7 Z" 
                  fill="currentColor"/>
          </svg>
        )
      case 'bat':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-800">
            <path d="M12,2 C8,4 6,8 6,12 C6,16 8,20 12,22 C16,20 18,16 18,12 C18,8 16,4 12,2 Z M10,8 C10.5,8 11,8.5 11,9 C11,9.5 10.5,10 10,10 C9.5,10 9,9.5 9,9 C9,8.5 9.5,8 10,8 Z M14,8 C14.5,8 15,8.5 15,9 C15,9.5 14.5,10 14,10 C13.5,10 13,9.5 13,9 C13,8.5 13.5,8 14,8 Z" 
                  fill="currentColor"/>
          </svg>
        )
      case 'skull':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-600">
            <circle cx="12" cy="8" r="6" fill="currentColor"/>
            <circle cx="9" cy="7" r="1" fill="white"/>
            <circle cx="15" cy="7" r="1" fill="white"/>
            <path d="M8,12 Q12,16 16,12" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        )
      default:
        return <Sticker className="h-6 w-6 text-gray-600" />
    }
  }

  return (
    <div 
      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <div className="aspect-square w-full rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        {renderStickerPreview()}
      </div>
      <div className="mt-2 text-center">
        <div className="text-xs font-medium capitalize">{sticker.type.replace('-', ' ')}</div>
      </div>
    </div>
  )
}

export default function QRGenerator({ userId }: QRGeneratorProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [downloadQuality, setDownloadQuality] = useState<'web' | 'print' | 'ultra-hd'>('ultra-hd')
  const [downloadMessage] = useState<string | null>(null)
  const initialPlanState: PlanState = userId && session?.user ? 'LOADING' : 'GUEST'
  const [userPlan, setUserPlan] = useState<PlanState>(initialPlanState)
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [showGuestUpsell, setShowGuestUpsell] = useState(false)
  
  // Dynamic QR code states
  const [isDynamic, setIsDynamic] = useState(false)
  const [dynamicContent, setDynamicContent] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [maxScans, setMaxScans] = useState("")
  const [redirectUrl, setRedirectUrl] = useState("")
  
  // UPI Payment states
  const [isUpiPayment, setIsUpiPayment] = useState(false)
  const [upiId, setUpiId] = useState("")
  const [upiAmount, setUpiAmount] = useState("")
  const [upiMerchantName, setUpiMerchantName] = useState("")
  const [upiTransactionNote, setUpiTransactionNote] = useState("")
  const [upiFormat, setUpiFormat] = useState<'bharat-qr' | 'upi-url'>('upi-url')
  
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

  const isPlanLoading = userPlan === 'LOADING'
  const isPlanReady = !isPlanLoading
  const isGuest = userPlan === 'GUEST'
  const isFreeTier = userPlan === 'FREE' || isGuest

  const requirePlanResolution = () => {
    if (!isPlanReady) {
      toast.info("Checking your plan. Please wait a moment...")
      return false
    }
    return true
  }

  const handlePremiumAccessPrompt = (featureName: string) => {
    if (isGuest) {
      toast.info(`Sign in to unlock ${featureName} and save your QR codes.`)
      setShowGuestUpsell(true)
      return
    }
    toast.info(`Unlock ${featureName} with a paid plan.`)
    router.push('/pricing')
  }

  // Fetch user plan
  useEffect(() => {
    let cancelled = false
    if (!userId || !session?.user) {
      setUserPlan('GUEST')
      return
    }

    const fetchUserPlan = async () => {
      setUserPlan('LOADING')
      try {
        const response = await fetch('/api/user/credits')
        if (!cancelled) {
          if (response.ok) {
            const data = await response.json()
            setUserPlan((data.plan || 'FREE') as PlanState)
          } else {
            setUserPlan('FREE')
          }
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
        if (!cancelled) {
          setUserPlan('FREE')
        }
      }
    }

    fetchUserPlan()

    return () => {
      cancelled = true
    }
  }, [userId, session?.user])

  // Force watermark ON for users on the free tier (including guests) once plan is known
  useEffect(() => {
    if (!isPlanReady) return
    if (isFreeTier && !qrOptions.watermark) {
      setQrOptions(prev => ({ ...prev, watermark: true }))
    }
  }, [isPlanReady, isFreeTier, qrOptions.watermark])

  // Function to generate UPI payment URL using Bharat QR standard or UPI URL format
  const generateUpiUrl = useCallback((upiId: string, amount?: string, merchantName?: string, transactionNote?: string, format: 'bharat-qr' | 'upi-url' = upiFormat) => {
    if (!upiId.trim()) return ""
    
    // Clean and validate UPI ID
    const cleanUpiId = upiId.trim().toLowerCase()
    
    // Validate UPI ID format (basic validation)
    const upiIdPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/
    if (!upiIdPattern.test(cleanUpiId)) {
      console.warn("Invalid UPI ID format:", cleanUpiId)
    }
    
    if (format === 'bharat-qr') {
      // Generate Bharat QR format (JSON structure)
      const bharatQrData = {
        "upi": {
          "pa": cleanUpiId, // Payee Address (UPI ID)
          "pn": merchantName?.trim() || cleanUpiId.split('@')[0], // Payee Name
          "mc": "0000", // Merchant Category Code (default)
          "tr": `TXN${Date.now()}`, // Transaction Reference
          "tn": transactionNote?.trim() || "Payment", // Transaction Note
          "am": amount?.trim() && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? parseFloat(amount).toString() : undefined, // Amount
          "cu": "INR", // Currency
          "url": "" // Optional URL
        }
      }
      
      // Remove undefined values
      if (!bharatQrData.upi.am) {
        delete bharatQrData.upi.am
      }
      
      // Convert to Bharat QR string format
      return JSON.stringify(bharatQrData)
    } else {
      // Generate UPI URL format - CRITICAL: This must be exactly right for UPI apps to recognize it
      let upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpiId)}`
      
      // Add currency FIRST (required by UPI spec)
      upiUrl += `&cu=INR`
      
      // Add merchant name (required for better recognition)
      if (merchantName?.trim()) {
        upiUrl += `&pn=${encodeURIComponent(merchantName.trim())}`
      } else {
        // Use UPI ID username as fallback merchant name
        const username = cleanUpiId.split('@')[0]
        upiUrl += `&pn=${encodeURIComponent(username)}`
      }
      
      // Add amount if specified (must be numeric)
      if (amount?.trim() && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
        upiUrl += `&am=${parseFloat(amount)}`
      }
      
      // Add transaction note if specified
      if (transactionNote?.trim()) {
        upiUrl += `&tn=${encodeURIComponent(transactionNote.trim())}`
      }
      
      // Add transaction reference for better tracking
      const transactionRef = `TXN${Date.now()}`
      upiUrl += `&tr=${transactionRef}`
      
      // Add merchant category code (optional but recommended)
      upiUrl += `&mc=0000`
      
      return upiUrl
    }
  }, [upiFormat])

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
        ;(async () => {
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
  }, [isClient, url, qrOptions, isUpiPayment, upiId, upiAmount, upiMerchantName, upiTransactionNote, generateUpiUrl])

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
    
    // Check for UPI payment
    if (isUpiPayment) {
      return { isPro: true, featureName: 'UPI Payment QR Codes' }
    }
    
    // Check for dynamic QR codes
    if (isDynamic) {
      return { isPro: true, featureName: 'Dynamic QR Codes' }
    }
    
    return { isPro: false, featureName: '' }
  }

  const premiumTabNames: Record<string, string> = {
    social: 'Social media QR templates',
    upi: 'UPI payment QR codes',
    dynamic: 'Dynamic QR codes',
  }

  const handleTabChange = (value: string) => {
    if (['social', 'upi', 'dynamic'].includes(value)) {
      if (!requirePlanResolution()) return
      if (isGuest) {
        handlePremiumAccessPrompt(premiumTabNames[value] || 'this feature')
        return
      }
    }
    setActiveTab(value)
  }

  const handleGenerate = async () => {
    if (!requirePlanResolution()) return

    if (isFreeTier) {
      const proCheck = isUsingProFeature()
      if (proCheck.isPro) {
        handlePremiumAccessPrompt(proCheck.featureName || 'this feature')
        return
      }
      
      if (!qrOptions.watermark) {
        setQrOptions(prev => ({ ...prev, watermark: true }))
      }
    }
    
    // Validate input based on mode
    if (isUpiPayment) {
      if (!upiId.trim()) {
        toast.error("Please enter a UPI ID to generate QR code")
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
        toast.success("Your QR code is ready! Sign in to save it and unlock analytics.")
      } finally {
        setIsGenerating(false)
        setShowGuestUpsell(true)
      }
      return
    }
    
    try {
      const formData = new FormData()
      
      // Determine the actual URL/data to save
      let actualUrl = url
      let actualTitle = title || url
      
      if (isUpiPayment && upiId) {
        actualUrl = generateUpiUrl(upiId, upiAmount, upiMerchantName, upiTransactionNote)
        actualTitle = title || `UPI Payment - ${upiId}`
      }
      
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
      
      if (dynamicContent) {
        formData.append("dynamicContent", dynamicContent)
      }
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
        // Safely parse error response
        let errorMessage = "Failed to save QR code"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          
          // Handle specific error cases
          if (response.status === 402 && (errorData.error === 'no_credits' || errorData.code === 'no_credits')) {
            toast.error("You have no credits left. Please purchase more credits to continue.")
            router.push("/pricing")
            return
          }
          
          if (response.status === 401 || response.status === 403) {
            errorMessage = errorData.message || "Authentication required. Please sign in."
            toast.error(errorMessage)
            router.push("/auth/signin")
            return
          }
          
          if (response.status === 429) {
            errorMessage = "Too many requests. Please try again later."
          }
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage = errorText.substring(0, 200) // Limit length
            }
          } catch (textError) {
            // Fallback to status-based message
            errorMessage = `Request failed with status ${response.status}`
          }
        }
        
        toast.error(errorMessage)
        console.error("QR code creation failed:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage
        })
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
    if (!requirePlanResolution()) return
    
    if (isFreeTier) {
      const proCheck = isUsingProFeature()
      if (proCheck.isPro) {
        handlePremiumAccessPrompt(proCheck.featureName || 'this feature')
        return
      }
    }

    if (qrGeneratorRef.current?.download) {
      qrGeneratorRef.current.download(title || "qr-code", format, downloadQuality)
    }
  }

  const handleReset = () => {
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
    setUpiFormat('upi-url')
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
        if (!requirePlanResolution()) {
          return
        }
        if (isGuest) {
          handlePremiumAccessPrompt('Social media QR codes')
          return
        }
        
        const logoDataUrl = getSocialMediaLogoDataUrl(templateId as SocialMediaPlatform)
        if (logoDataUrl) {
          logoConfig = {
            image: logoDataUrl,
            size: 0.25, // 25% of QR code size
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
      
      setQrOptions({
        ...qrOptions,
        template: templateId,
        foregroundColor: template.colors.foreground,
        backgroundColor: template.colors.background,
        gradient: template.colors.gradient,
        dotType: template.styles.dotType,
        cornerType: template.styles.cornerType,
        eyePattern: template.styles.eyePattern,
        shape: template.shape,
        sticker: template.sticker,
        logo: logoConfig,
      })
    }
  }

  const handleShapeSelect = (shape: QRShape) => {
    setQrOptions(prev => ({ ...prev, shape }))
  }

  const handleStickerSelect = (stickerId: QRSticker) => {
    const sticker = QR_STICKERS[stickerId]
    if (sticker) {
      setQrOptions(prev => ({ ...prev, sticker }))
    }
  }

  return (
    <>
      <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="text-center space-y-2 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">QR Code Generator</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
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
                {/* Mobile: Better spaced grid, Desktop: Standard grid */}
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 sm:gap-1.5 sm:p-1.5 bg-muted/50 sm:bg-muted">
                  <TabsTrigger 
                    value="basic" 
                    className="px-4 py-3.5 sm:px-2 sm:py-1.5 text-sm font-semibold whitespace-nowrap rounded-lg data-[state=active]:shadow-md transition-all"
                  >
                    Basic
                  </TabsTrigger>
                  <TabsTrigger 
                    value="social" 
                    className="px-4 py-3.5 sm:px-2 sm:py-1.5 text-sm font-semibold whitespace-nowrap rounded-lg data-[state=active]:shadow-md transition-all"
                  >
                    <span className="hidden sm:inline">Social Media</span>
                    <span className="sm:hidden">Social</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upi" 
                    className="px-4 py-3.5 sm:px-2 sm:py-1.5 text-sm font-semibold whitespace-nowrap rounded-lg data-[state=active]:shadow-md transition-all"
                  >
                    <span className="hidden sm:inline">UPI Payment</span>
                    <span className="sm:hidden">UPI</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="dynamic" 
                    className="px-4 py-3.5 sm:px-2 sm:py-1.5 text-sm font-semibold whitespace-nowrap rounded-lg data-[state=active]:shadow-md transition-all"
                  >
                    Dynamic
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

                  {/* Watermark Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                    <div className="space-y-0.5 flex-1">
                      <Label className="text-sm sm:text-base">BotrixAI Watermark</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {isPlanLoading
                          ? "Checking your plan..."
                          : isFreeTier
                            ? "Watermark is required for free users. Sign in or upgrade to remove it."
                            : "Add our watermark to your QR code"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isPlanLoading && isFreeTier && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePremiumAccessPrompt('Watermark removal')}
                          className="text-xs whitespace-nowrap"
                        >
                          Upgrade
                        </Button>
                      )}
                      <Switch
                        checked={qrOptions.watermark || false}
                        onCheckedChange={(checked) => {
                          if (!requirePlanResolution()) return
                          if (isFreeTier) {
                            handlePremiumAccessPrompt('Watermark removal')
                            return
                          }
                          setQrOptions(prev => ({ ...prev, watermark: checked }))
                        }}
                        disabled={isPlanLoading || isFreeTier}
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

                    {/* Templates */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Templates</Label>
                      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {Object.entries(QR_TEMPLATES).map(([id, template]) => (
                          <TemplatePreview
                            key={id}
                            template={template}
                            isSelected={qrOptions.template === id}
                            onClick={() => handleTemplateSelect(id as QRTemplate)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Shapes */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Shapes</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {Object.keys(shapeIcons).slice(0, 12).map((shape) => (
                          <ShapePreview
                            key={shape}
                            shape={shape as QRShape}
                            isSelected={qrOptions.shape === shape}
                            onClick={() => handleShapeSelect(shape as QRShape)}
                          />
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
                              onChange={(e) => setQrOptions(prev => ({ ...prev, foregroundColor: e.target.value }))}
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
                              onChange={(e) => setQrOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                              className="w-8 h-8 p-1"
                            />
                            <Input
                              value={qrOptions.backgroundColor || '#ffffff'}
                              onChange={(e) => setQrOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                              className="flex-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Styles */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Styles</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Dot Style</Label>
                          <Select 
                            value={qrOptions.dotType || 'square'} 
                            onValueChange={(value) => setQrOptions(prev => ({ ...prev, dotType: value as AdvancedQROptions['dotType'] }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="rounded">Rounded</SelectItem>
                              <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                              <SelectItem value="classy">Classy</SelectItem>
                              <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
                              <SelectItem value="dots">Dots</SelectItem>
                              <SelectItem value="circles">Circles</SelectItem>
                              <SelectItem value="diamonds">Diamonds</SelectItem>
                              <SelectItem value="stars">Stars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Corner Style</Label>
                          <Select 
                            value={qrOptions.cornerType || 'square'} 
                            onValueChange={(value) => setQrOptions(prev => ({ ...prev, cornerType: value as AdvancedQROptions['cornerType'] }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="rounded">Rounded</SelectItem>
                              <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                              <SelectItem value="diamond">Diamond</SelectItem>
                              <SelectItem value="star">Star</SelectItem>
                              <SelectItem value="heart">Heart</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Eye Pattern</Label>
                          <Select 
                            value={qrOptions.eyePattern || 'square'} 
                            onValueChange={(value) => setQrOptions(prev => ({ ...prev, eyePattern: value as AdvancedQROptions['eyePattern'] }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="circle">Circle</SelectItem>
                              <SelectItem value="diamond">Diamond</SelectItem>
                              <SelectItem value="rounded">Rounded</SelectItem>
                              <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                              <SelectItem value="classy">Classy</SelectItem>
                              <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
                              <SelectItem value="star">Star</SelectItem>
                              <SelectItem value="heart">Heart</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Effects */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Effects</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={qrOptions.effects?.threeD || false}
                            onCheckedChange={(checked) => 
                              setQrOptions(prev => ({ ...prev, effects: { ...prev.effects, threeD: checked } }))
                            }
                            className="scale-75"
                          />
                          <Label className="text-xs">3D Effect</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={qrOptions.effects?.shadow || false}
                            onCheckedChange={(checked) => 
                              setQrOptions(prev => ({ ...prev, effects: { ...prev.effects, shadow: checked } }))
                            }
                            className="scale-75"
                          />
                          <Label className="text-xs">Shadow</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={qrOptions.effects?.glow || false}
                            onCheckedChange={(checked) => 
                              setQrOptions(prev => ({ ...prev, effects: { ...prev.effects, glow: checked } }))
                            }
                            className="scale-75"
                          />
                          <Label className="text-xs">Glow</Label>
                        </div>
                      </div>
                    </div>

                    {/* Stickers */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Stickers</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {Object.entries(QR_STICKERS).slice(0, 8).map(([id, sticker]) => (
                          <StickerPreview
                            key={id}
                            sticker={sticker}
                            isSelected={qrOptions.sticker?.type === sticker.type}
                            onClick={() => handleStickerSelect(id as QRSticker)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-4">
                  {userPlan === 'FREE' && (
                    <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Pro Feature Available
                          </h4>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 sm:mb-3">
                            Social Media QR codes are available in paid plans. You can explore all features, but upgrading is required to generate and download.
                          </p>
                          <Button 
                            onClick={() => handlePremiumAccessPrompt('Social media QR codes')} 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm w-full sm:w-auto"
                          >
                            Upgrade to Pro
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Social Media Platform Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Choose Social Media Platform</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        variant={qrOptions.template === 'instagram' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('instagram')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.instagram size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">Instagram</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'facebook' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('facebook')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.facebook size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">Facebook</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'snapchat' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('snapchat')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.snapchat size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">Snapchat</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'twitter' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('twitter')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.twitter size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">X (Twitter)</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'linkedin' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('linkedin')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.linkedin size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">LinkedIn</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'youtube' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('youtube')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.youtube size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">YouTube</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'tiktok' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('tiktok')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.tiktok size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">TikTok</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'whatsapp' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('whatsapp')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.whatsapp size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">WhatsApp</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'telegram' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('telegram')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.telegram size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">Telegram</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'discord' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('discord')}
                        className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.discord size={16} />
                        </div>
                        <span className="text-xs sm:text-sm">Discord</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Social Media URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="socialUrl">Social Media URL</Label>
                    <Input
                      id="socialUrl"
                      placeholder="https://instagram.com/yourusername or @yourusername"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your social media profile URL or username (e.g., @username, https://instagram.com/username)
                    </p>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="socialTitle">Title (Optional)</Label>
                    <Input
                      id="socialTitle"
                      placeholder="Follow me on Instagram"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Social Media Tips */}
                  <div className="space-y-2 p-3 bg-blue-50 rounded-md">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-600 text-sm">💡</div>
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Social Media QR Tips:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• <strong>Instagram:</strong> Use your profile URL or @username</li>
                          <li>• <strong>Facebook:</strong> Use your page URL or profile link</li>
                          <li>• <strong>Snapchat:</strong> Use your Snapchat username</li>
                          <li>• <strong>Twitter:</strong> Use your profile URL or @handle</li>
                          <li>• <strong>LinkedIn:</strong> Use your profile or company page URL</li>
                          <li>• <strong>YouTube:</strong> Use your channel URL</li>
                          <li>• <strong>TikTok:</strong> Use your profile URL or @username</li>
                          <li>• <strong>WhatsApp:</strong> Use your WhatsApp business link</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upi" className="space-y-4 mt-4">
                  {userPlan === 'FREE' && (
                    <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                            Pro Feature Available
                          </h4>
                          <p className="text-xs text-green-700 dark:text-green-300 mb-2 sm:mb-3">
                            UPI Payment QR codes are available in paid plans. You can explore all features, but upgrading is required to generate and download.
                          </p>
                          <Button 
                            onClick={() => handlePremiumAccessPrompt('UPI payment QR codes')} 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm w-full sm:w-auto"
                          >
                            Upgrade to Pro
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                          onCheckedChange={(checked) => {
                            if (!requirePlanResolution()) return
                            if (isFreeTier) {
                              handlePremiumAccessPrompt('UPI payment QR codes')
                              return
                            }
                            setIsUpiPayment(checked)
                          }}
                    />
                  </div>

                  {isUpiPayment && (
                    <>
                      <Separator />
                      
                      {/* UPI Format Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">QR Code Format</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={upiFormat === 'bharat-qr' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUpiFormat('bharat-qr')}
                            className="flex-1"
                          >
                            Bharat QR
                          </Button>
                          <Button
                            variant={upiFormat === 'upi-url' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUpiFormat('upi-url')}
                            className="flex-1"
                          >
                            UPI URL (Recommended)
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {upiFormat === 'bharat-qr' 
                            ? 'Uses official Bharat QR JSON format - try if UPI URL doesn\'t work' 
                            : 'Uses standard UPI URL format - best compatibility with all UPI apps'
                          }
                        </p>
                      </div>
                      
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
                              if (upiFormat === 'upi-url') {
                                // Try to open the UPI URL directly
                                window.open(upiUrl, '_blank')
                              } else {
                                // For Bharat QR, copy to clipboard
                                navigator.clipboard.writeText(upiUrl)
                                alert('Bharat QR data copied to clipboard. Paste it into a QR generator to test.')
                              }
                            }}
                            className="w-full"
                          >
                            {upiFormat === 'upi-url' ? 'Test UPI URL' : 'Copy Bharat QR Data'}
                          </Button>
                          
                          {/* Debug Information */}
                          <div className="space-y-1 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <div className="text-xs font-medium text-yellow-800">Debug Info:</div>
                            <div className="text-xs text-yellow-700">
                              <div>• Format: {upiFormat}</div>
                              <div>• UPI ID: {upiId}</div>
                              <div>• Currency: INR</div>
                              <div>• Amount: {upiAmount || 'Not specified'}</div>
                              <div>• Merchant: {upiMerchantName || upiId.split('@')[0]}</div>
                              <div>• Note: {upiTransactionNote || 'Not specified'}</div>
                            </div>
                          </div>
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
                              <li>• <strong>UPI URL format</strong> is recommended for best compatibility</li>
                              <li>• If you get alerts instead of payment intent, try switching formats</li>
                              <li>• Some UPI apps may show security alerts - this is normal</li>
                              <li>• Always verify the UPI ID before sharing</li>
                              <li>• Test with Google Pay, PhonePe, or Paytm QR scanner</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Troubleshooting Section */}
                      <div className="space-y-2 p-3 bg-red-50 rounded-md">
                        <div className="flex items-start gap-2">
                          <div className="text-red-600 text-sm">🔧</div>
                          <div className="text-xs text-red-800">
                            <p className="font-medium mb-1">Troubleshooting:</p>
                            <ul className="space-y-1 text-xs">
                              <li>• <strong>Getting alerts?</strong> Try UPI URL format instead of Bharat QR</li>
                              <li>• <strong>Not opening UPI app?</strong> Use a UPI app&apos;s built-in QR scanner</li>
                              <li>• <strong>Invalid UPI ID?</strong> Check format: username@bankname</li>
                              <li>• <strong>Amount issues?</strong> Leave amount empty to allow any amount</li>
                              <li>• <strong>Still not working?</strong> Try minimal UPI URL with just pa and cu</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="dynamic" className="space-y-4 mt-4">
                  {userPlan === 'FREE' && (
                    <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                            Pro Feature Available
                          </h4>
                          <p className="text-xs text-purple-700 dark:text-purple-300 mb-2 sm:mb-3">
                            Dynamic QR codes are available in paid plans. You can explore all features, but upgrading is required to generate and download.
                          </p>
                          <Button 
                            onClick={() => handlePremiumAccessPrompt('Dynamic QR codes')} 
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm w-full sm:w-auto"
                          >
                            Upgrade to Pro
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                      onCheckedChange={(checked) => {
                        if (!requirePlanResolution()) return
                        if (isFreeTier) {
                          handlePremiumAccessPrompt('Dynamic QR codes')
                          return
                        }
                        setIsDynamic(checked)
                      }}
                    />
                  </div>

                  {isDynamic && (
                    <>
                      <Separator />
                      
                      {/* Dynamic Content */}
                      <div className="space-y-2">
                        <Label htmlFor="dynamicContent">Dynamic Content (JSON)</Label>
                        <Textarea
                          id="dynamicContent"
                          placeholder='{"message": "Welcome!", "action": "redirect", "url": "https://example.com"}'
                          value={dynamicContent}
                          onChange={(e) => setDynamicContent(e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          JSON object containing dynamic content that can be updated later
                        </p>
                      </div>

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
              </Tabs>

              <Separator className="my-4" />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={handleGenerate} 
                  className="w-full" 
                  disabled={
                    (isUpiPayment ? 
                      (!upiId.trim() || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upiId.trim())) : 
                      !url.trim()
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
                  
                  {url && (
                    <div className="space-y-3">
                      {/* Quality Selector */}
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Download Quality:</label>
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
      </div>
      </div>

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
    </>
  )
}



