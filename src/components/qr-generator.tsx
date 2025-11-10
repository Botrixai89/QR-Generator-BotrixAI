"use client"

import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import type { QRTemplateConfig, QRStickerConfig } from "@/types/qr-code-advanced"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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

// Template preview component
function TemplatePreview({ template, isSelected, onClick }: { 
  template: QRTemplateConfig, 
  isSelected: boolean, 
  onClick: () => void 
}) {
  const [previewRef, setPreviewRef] = useState<HTMLDivElement | null>(null)
  
  // Generate a preview QR code for this template
  useEffect(() => {
    if (previewRef && template) {
      // Add timeout to prevent rapid re-renders
      const timeoutId = setTimeout(() => {
        try {
          // Create a simple preview using basic QR styling
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
          // Fallback: show a simple colored square
          if (previewRef) {
            previewRef.innerHTML = `
              <div style="width: 80px; height: 80px; background: ${template.colors?.background || '#ffffff'}; border: 2px solid ${template.colors?.foreground || '#000000'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: ${template.colors?.foreground || '#000000'};">QR</div>
            `
          }
        }
      }, 50) // Small delay to prevent rapid re-renders
      
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
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [downloadQuality, setDownloadQuality] = useState<'web' | 'print' | 'ultra-hd'>('ultra-hd')
  const [downloadMessage] = useState<string | null>(null)
  
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
  
  const qrRef = useRef<HTMLDivElement>(null)
  const qrGeneratorRef = useRef<{ 
    generate: (element: HTMLElement) => Promise<unknown>
    updateData?: (data: string) => void
    download?: (filename?: string, format?: "png" | "svg", quality?: "web" | "print" | "ultra-hd") => void
  } | null>(null)
  const retryOnceRef = useRef<boolean>(false)

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
      let qrData = url || "https://example.com"
      
      // If UPI payment is enabled, generate UPI URL
      if (isUpiPayment && upiId) {
        qrData = generateUpiUrl(upiId, upiAmount, upiMerchantName, upiTransactionNote)
      }
      
      const options = {
        ...qrOptions,
        data: qrData
      }
      
      // Add timeout to prevent infinite loops
      const timeoutId = setTimeout(() => {
        try {
          ;(async () => {
            if (!qrRef.current) return
            const getCreator = await loadAdvancedQR()
            qrGeneratorRef.current = getCreator(options) as typeof qrGeneratorRef.current
            const result = qrGeneratorRef.current?.generate(qrRef.current)
            Promise.resolve(result).then(() => {
              try {
                if (qrRef.current && (options.watermark || false)) {
                  const svg = qrRef.current.querySelector('svg') as unknown as SVGElement | null
                  if (svg) {
                    // Lazy import to avoid duplicate bundle cost on server
                    import('@/lib/qr-watermark').then(({ addBotrixLogoToQR }) => {
                      addBotrixLogoToQR(svg as unknown as SVGElement)
                    }).catch(() => { /* no-op */ })
                  }
                }
              } catch { /* no-op */ }
            })
          })()
        } catch (error) {
          console.error('Error generating QR code:', error)
        }
      }, 100) // Small delay to prevent rapid re-renders
      
      return () => clearTimeout(timeoutId)
    }
  }, [isClient, url, qrOptions, isUpiPayment, upiId, upiAmount, upiMerchantName, upiTransactionNote, generateUpiUrl])

  // Retry generation once if SVG didn't render (e.g., racing updates after logo upload)
  useEffect(() => {
    if (!isClient || !qrRef.current) return
    const checkId = setTimeout(() => {
      const hasSvg = !!qrRef.current!.querySelector('svg')
      if (!hasSvg && !retryOnceRef.current) {
        retryOnceRef.current = true
        // Trigger a soft re-render by nudging width (no visual change)
        setQrOptions(prev => ({ ...prev }))
      }
    }, 180)
    return () => clearTimeout(checkId)
  }, [isClient, qrOptions.logo, qrOptions.template, qrOptions.shape, url])

  // Ensure watermark persists after logo uploads or option changes
  useEffect(() => {
    if (!isClient || !qrRef.current) return
    if (!(qrOptions.watermark || false)) return
    // Re-apply watermark shortly after any logo change which may trigger re-render
    const tid = setTimeout(() => {
      try {
        const svg = qrRef.current!.querySelector('svg') as unknown as SVGElement | null
        if (svg) {
          import('@/lib/qr-watermark').then(({ addBotrixLogoToQR }) => {
            addBotrixLogoToQR(svg as unknown as SVGElement)
          }).catch(() => { /* no-op */ })
        }
      } catch { /* no-op */ }
    }, 120)
    return () => clearTimeout(tid)
  }, [isClient, qrOptions.logo, qrOptions.watermark])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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

  const handleGenerate = async () => {
    // Require authentication before generating any QR code
    if (!userId) {
      const { toast } = await import("sonner")
      toast.info("Please sign up to generate QR codes.")
      router.push("/auth/signup")
      return
    }
    // Validate input based on mode
    if (isUpiPayment) {
      if (!upiId.trim()) return
    } else {
      if (!url.trim()) return
    }
    
    setIsGenerating(true)
    
    try {
      // Save QR code to database if user is logged in
      if (userId) {
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
        if (logoFile) {
          formData.append("logo", logoFile)
        }

        const response = await fetch("/api/qr-codes", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const savedQrCode = await response.json()
          
          // For dynamic QR codes, update the QR code with the correct URL
          if (isDynamic && savedQrCode.id) {
            const qrCodeUrl = `${window.location.origin}/qr/${savedQrCode.id}`
            
            // Update the QR code data
            if (qrGeneratorRef.current?.updateData) {
              qrGeneratorRef.current.updateData(qrCodeUrl)
            }
          }
          
          // Show success message
          const { toast } = await import("sonner")
          toast.success("QR code saved successfully!")
          
          // Redirect to dashboard
          router.push("/dashboard")
        } else {
          const errorData = await response.json()
          const { toast } = await import("sonner")
          
          if (response.status === 402 && errorData.error === 'no_credits') {
            toast.error("You have no credits left. Please purchase more credits to continue.")
            router.push("/pricing")
          } else {
            toast.error(errorData.error || "Failed to save QR code")
          }
        }
      }
    } catch (error) {
      console.error("Error saving QR code:", error)
      const { toast } = await import("sonner")
      toast.error("Failed to save QR code")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (format: "png" | "svg") => {
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
      }
    })
    
    // Reset UPI payment fields
    setIsUpiPayment(false)
    setUpiId("")
    setUpiAmount("")
    setUpiMerchantName("")
    setUpiTransactionNote("")
    setUpiFormat('upi-url')
  }


  // Function to generate social media logo as base64 data URL
  const generateSocialMediaLogoDataUrl = (platform: SocialMediaPlatform): string => {
    const IconComponent = socialMediaIcons[platform]
    if (!IconComponent) return ""
    
    // Create a temporary SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '64')
    svg.setAttribute('height', '64')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none')
    
    // Create the SVG content directly
    let svgContent = ''
    
    switch (platform) {
      case 'instagram':
        return '/instagram-logo.png'
      case 'snapchat':
        return '/snapchat-logo.webp'
      case 'facebook':
        svgContent = `
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
        `
        break
      case 'twitter':
        svgContent = `
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000000" />
        `
        break
      case 'linkedin':
        svgContent = `
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0077B5" />
        `
        break
      case 'youtube':
        svgContent = `
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000" />
        `
        break
      case 'tiktok':
        svgContent = `
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#000000" />
        `
        break
      case 'whatsapp':
        svgContent = `
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#25D366" />
        `
        break
      case 'telegram':
        svgContent = `
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#0088CC" />
        `
        break
      case 'discord':
        svgContent = `
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2" />
        `
        break
      default:
        return ""
    }
    
    svg.innerHTML = svgContent
    
    // Convert SVG to data URL
    const svgString = new XMLSerializer().serializeToString(svg)
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`
    
    return dataUrl
  }

  const handleTemplateSelect = (templateId: QRTemplate) => {
    const template = QR_TEMPLATES[templateId]
    if (template) {
      // Check if this is a social media template
      const socialMediaPlatforms: SocialMediaPlatform[] = ['instagram', 'facebook', 'snapchat', 'twitter', 'linkedin', 'youtube', 'tiktok', 'whatsapp', 'telegram', 'discord']
      
      let logoConfig = qrOptions.logo
      
      // If it's a social media template, add the platform logo to the center
      if (socialMediaPlatforms.includes(templateId as SocialMediaPlatform)) {
        const logoDataUrl = generateSocialMediaLogoDataUrl(templateId as SocialMediaPlatform)
        if (logoDataUrl) {
          logoConfig = {
            image: logoDataUrl,
            size: 0.25, // 25% of QR code size
            margin: 5,
            opacity: 1
          }
        }
      } else {
        // Clear logo for non-social media templates unless user has uploaded a custom logo
        if (!qrOptions.logo?.image || !qrOptions.logo.image.startsWith('data:image/')) {
          logoConfig = undefined
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold">QR Code Generator</h1>
          <p className="text-muted-foreground">
            Create beautiful, customizable QR codes with advanced features
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Configuration Panel */}
          <div className="lg:w-1/2 qr-config-scroll">
            <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                QR Code Configuration
              </CardTitle>
              <CardDescription>
                Set up your QR code content and customize its appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 gap-1.5 p-1.5">
                  <TabsTrigger value="basic" className="px-2 py-1.5 text-xs sm:text-sm truncate min-w-0 flex-none">Basic</TabsTrigger>
                  <TabsTrigger value="social" className="px-2 py-1.5 text-xs sm:text-sm truncate min-w-0 flex-none">Social Media</TabsTrigger>
                  <TabsTrigger value="upi" className="px-2 py-1.5 text-xs sm:text-sm truncate min-w-0 flex-none">UPI Payment</TabsTrigger>
                  <TabsTrigger value="dynamic" className="px-2 py-1.5 text-xs sm:text-sm truncate min-w-0 flex-none">Dynamic</TabsTrigger>
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>BotrixAI Watermark</Label>
                      <p className="text-sm text-muted-foreground">
                        Add our watermark to your QR code
                      </p>
                    </div>
                    <Switch
                      checked={qrOptions.watermark || false}
                      onCheckedChange={(checked) => 
                        setQrOptions(prev => ({ ...prev, watermark: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  {/* Advanced Customization Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <Label className="text-base font-medium">Advanced Customization</Label>
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
                      <div className="grid grid-cols-6 gap-2">
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
                      <div className="grid grid-cols-3 gap-2">
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
                      <div className="grid grid-cols-4 gap-2">
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
                  {/* Social Media Platform Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Choose Social Media Platform</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={qrOptions.template === 'instagram' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('instagram')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.instagram size={20} />
                        </div>
                        <span className="text-sm">Instagram</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'facebook' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('facebook')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.facebook size={20} />
                        </div>
                        <span className="text-sm">Facebook</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'snapchat' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('snapchat')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.snapchat size={20} />
                        </div>
                        <span className="text-sm">Snapchat</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'twitter' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('twitter')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.twitter size={20} />
                        </div>
                        <span className="text-sm">X (Twitter)</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'linkedin' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('linkedin')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.linkedin size={20} />
                        </div>
                        <span className="text-sm">LinkedIn</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'youtube' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('youtube')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.youtube size={20} />
                        </div>
                        <span className="text-sm">YouTube</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'tiktok' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('tiktok')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.tiktok size={20} />
                        </div>
                        <span className="text-sm">TikTok</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'whatsapp' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('whatsapp')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.whatsapp size={20} />
                        </div>
                        <span className="text-sm">WhatsApp</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'telegram' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('telegram')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.telegram size={20} />
                        </div>
                        <span className="text-sm">Telegram</span>
                      </Button>
                      
                      <Button
                        variant={qrOptions.template === 'discord' ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect('discord')}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <socialMediaIcons.discord size={20} />
                        </div>
                        <span className="text-sm">Discord</span>
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
                      onCheckedChange={setIsUpiPayment}
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
                      onCheckedChange={setIsDynamic}
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
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownload('svg')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download SVG
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
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  Your QR code will appear here with real-time updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center space-y-4 min-h-[500px]">
                  <div className="relative flex items-center justify-center w-full">
                    {isClient ? (
                      <div 
                        ref={qrRef}
                        className="border rounded-lg p-4 bg-white qr-code-container"
                        style={{ 
                          minHeight: "400px", 
                          minWidth: "400px",
                          backgroundColor: "#ffffff"
                        }}
                      />
                    ) : (
                      <div 
                        className="border rounded-lg p-4 bg-white flex items-center justify-center"
                        style={{ minHeight: "400px", minWidth: "400px" }}
                      >
                        <p className="text-muted-foreground">Loading QR code preview...</p>
                      </div>
                    )}
                  </div>
                  
                  {url && (
                    <div className="space-y-3">
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
  )
}
