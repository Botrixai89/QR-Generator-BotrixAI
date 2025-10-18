"use client"

import { useState, useRef, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  Upload, 
  Palette, 
  Settings, 
  Zap, 
  Calendar, 
  Users, 
  Link, 
  Sparkles,
  Shapes,
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
import QRCodeStyling from "qr-code-styling"
import { addBotrixLogoToQR } from "@/lib/qr-watermark"
import { 
  AdvancedQROptions, 
  QRShape, 
  QRTemplate, 
  QRSticker, 
  QRGradient,
  QR_TEMPLATES,
  QR_STICKERS
} from "@/types/qr-code-advanced"
import { createAdvancedQR } from "@/lib/qr-code-advanced"

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
  template: any, 
  isSelected: boolean, 
  onClick: () => void 
}) {
  return (
    <div 
      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <div className="aspect-square w-full rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-xs text-gray-500">{template.name}</div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium">{template.name}</div>
        <div className="text-xs text-muted-foreground">{template.description}</div>
      </div>
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
  sticker: any, 
  isSelected: boolean, 
  onClick: () => void 
}) {
  return (
    <div 
      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <div className="aspect-square w-full rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <Sticker className="h-6 w-6 text-gray-600" />
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
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  
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
  const [upiFormat, setUpiFormat] = useState<'bharat-qr' | 'upi-url'>('bharat-qr')
  
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
  
  const qrRef = useRef<HTMLDivElement>(null)
  const qrGeneratorRef = useRef<any>(null)

  // Function to generate UPI payment URL using Bharat QR standard or UPI URL format
  const generateUpiUrl = (upiId: string, amount?: string, merchantName?: string, transactionNote?: string, format: 'bharat-qr' | 'upi-url' = upiFormat) => {
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
      // Generate UPI URL format
      let upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpiId)}`
      
      // Add merchant name (required for better recognition)
      if (merchantName?.trim()) {
        upiUrl += `&pn=${encodeURIComponent(merchantName.trim())}`
      } else {
        // Use UPI ID username as fallback merchant name
        const username = cleanUpiId.split('@')[0]
        upiUrl += `&pn=${encodeURIComponent(username)}`
      }
      
      // Add amount if specified
      if (amount?.trim() && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
        upiUrl += `&am=${parseFloat(amount)}`
      }
      
      // Add currency (INR is default for India)
      upiUrl += `&cu=INR`
      
      // Add transaction note if specified
      if (transactionNote?.trim()) {
        upiUrl += `&tn=${encodeURIComponent(transactionNote.trim())}`
      }
      
      // Add transaction reference for better tracking
      const transactionRef = `TXN${Date.now()}`
      upiUrl += `&tr=${transactionRef}`
      
      return upiUrl
    }
  }

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
      
      qrGeneratorRef.current = createAdvancedQR(options)
      qrGeneratorRef.current.generate(qrRef.current)
    }
  }, [isClient, url, qrOptions, isUpiPayment, upiId, upiAmount, upiMerchantName, upiTransactionNote])

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
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
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
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
            if (qrGeneratorRef.current) {
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
          toast.error(errorData.error || "Failed to save QR code")
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
    if (qrGeneratorRef.current) {
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
    setUpiFormat('bharat-qr')
  }

  const handleOptionsChange = (newOptions: AdvancedQROptions) => {
    setQrOptions(newOptions)
  }

  const handleTemplateSelect = (templateId: QRTemplate) => {
    const template = QR_TEMPLATES[templateId]
    if (template) {
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="upi">UPI Payment</TabsTrigger>
                  <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="url">URL or Text</Label>
                    <Input
                      id="url"
                      placeholder="https://example.com or UPI ID or any text"
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
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Templates</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(QR_TEMPLATES).slice(0, 6).map(([id, template]) => (
                          <TemplatePreview
                            key={id}
                            template={template}
                            isSelected={qrOptions.template === id}
                            onClick={() => handleTemplateSelect(id as QRTemplate)}
                          />
                        ))}
                      </div>
                      {Object.entries(QR_TEMPLATES).length > 6 && (
                        <Button variant="outline" size="sm" className="w-full">
                          View All Templates
                        </Button>
                      )}
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
                            onValueChange={(value) => setQrOptions(prev => ({ ...prev, dotType: value as any }))}
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
                            onValueChange={(value) => setQrOptions(prev => ({ ...prev, cornerType: value as any }))}
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
                            onValueChange={(value) => setQrOptions(prev => ({ ...prev, eyePattern: value as any }))}
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
                            isSelected={qrOptions.sticker?.type === id}
                            onClick={() => handleStickerSelect(id as QRSticker)}
                          />
                        ))}
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
                            Bharat QR (Recommended)
                          </Button>
                          <Button
                            variant={upiFormat === 'upi-url' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUpiFormat('upi-url')}
                            className="flex-1"
                          >
                            UPI URL
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {upiFormat === 'bharat-qr' 
                            ? 'Uses official Bharat QR JSON format - better compatibility' 
                            : 'Uses traditional UPI URL format - try if Bharat QR doesn\'t work'
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
                              <li>• <strong>Bharat QR format</strong> is the official standard and recommended</li>
                              <li>• If you get alerts, try switching to <strong>UPI URL format</strong></li>
                              <li>• Some UPI apps may show security alerts - this is normal</li>
                              <li>• Always verify the UPI ID before sharing</li>
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
                        />
                        <p className="text-xs text-muted-foreground">
                          QR code will become inactive after this date
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
                          backgroundColor: "transparent"
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
