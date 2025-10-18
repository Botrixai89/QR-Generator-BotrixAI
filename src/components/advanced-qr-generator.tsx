"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Upload, 
  Settings, 
  Zap, 
  Calendar, 
  Users, 
  Link,
  Eye,
  Palette,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"
import { 
  AdvancedQROptions, 
  QRTemplate,
  QR_TEMPLATES 
} from "@/types/qr-code-advanced"
import { createAdvancedQR } from "@/lib/qr-code-advanced"
import QRCustomizationPanel from "./qr-customization-panel"

interface AdvancedQRGeneratorProps {
  userId?: string
}

export default function AdvancedQRGenerator({ userId }: AdvancedQRGeneratorProps) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Dynamic QR code states
  const [isDynamic, setIsDynamic] = useState(false)
  const [dynamicContent, setDynamicContent] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [maxScans, setMaxScans] = useState("")
  const [redirectUrl, setRedirectUrl] = useState("")
  
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

  // Ensure we're on the client side and auto-fill URL
  useEffect(() => {
    setIsClient(true)
    
    // Auto-fill the URL field with the current website URL
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.origin
      setUrl(currentUrl)
    }
  }, [])

  // Initialize QR code
  useEffect(() => {
    if (isClient && qrRef.current && url) {
      const options = {
        ...qrOptions,
        data: url || "https://example.com"
      }
      
      qrGeneratorRef.current = createAdvancedQR(options)
      qrGeneratorRef.current.generate(qrRef.current)
    }
  }, [isClient, url, qrOptions])

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
    if (!url.trim()) return
    
    setIsGenerating(true)
    
    try {
      // Save QR code to database if user is logged in
      if (userId) {
        const formData = new FormData()
        formData.append("url", url)
        formData.append("title", title || url)
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
          
          toast.success("QR code saved successfully!")
          router.push("/dashboard")
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || "Failed to save QR code")
        }
      }
    } catch (error) {
      console.error("Error saving QR code:", error)
      toast.error("Failed to save QR code")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (format: "png" | "svg") => {
    if (qrGeneratorRef.current) {
      qrGeneratorRef.current.download(title || "qr-code", format)
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
  }

  const handleOptionsChange = (newOptions: AdvancedQROptions) => {
    setQrOptions(newOptions)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">QR Code Generator</h1>
        <p className="text-muted-foreground">
          Create beautiful, customizable QR codes with advanced features
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Configuration
              </CardTitle>
              <CardDescription>
                Set up your QR code content and basic settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
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

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                className="w-full" 
                disabled={!url.trim() || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate QR Code"}
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Customization Panel */}
          <QRCustomizationPanel
            options={qrOptions}
            onOptionsChange={handleOptionsChange}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        </div>

        {/* Preview Panel */}
        <div className="xl:col-span-2">
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
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {isClient ? (
                    <div 
                      ref={qrRef}
                      className="border rounded-lg p-4 bg-white"
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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownload("png")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PNG
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownload("svg")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download SVG
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
