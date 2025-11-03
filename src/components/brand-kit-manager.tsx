"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Upload, Palette, Image as ImageIcon, Save, Trash2 } from "lucide-react"
import { InlineHelper } from "@/components/inline-helper"
import { applyBrandTheme, type BrandTheme } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

interface BrandKit {
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  presets?: {
    default?: { foregroundColor: string; backgroundColor: string }
    event?: { foregroundColor: string; backgroundColor: string }
    menu?: { foregroundColor: string; backgroundColor: string }
    payment?: { foregroundColor: string; backgroundColor: string }
    vcard?: { foregroundColor: string; backgroundColor: string }
  }
}

interface BrandKitManagerProps {
  organizationId?: string
  onUpdate?: (brandKit: BrandKit) => void
  className?: string
}

export function BrandKitManager({
  organizationId,
  onUpdate,
  className,
}: BrandKitManagerProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [brandKit, setBrandKit] = useState<BrandKit>({
    primaryColor: '#1a365d',
    secondaryColor: '#edf2f7',
    accentColor: '#4299e1',
    presets: {},
  })

  useEffect(() => {
    if (organizationId) {
      loadBrandKit()
    }
  }, [organizationId])

  async function loadBrandKit() {
    if (!organizationId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.organization?.brandKit) {
          setBrandKit(data.organization.brandKit)
          applyBrandTheme(data.organization.brandKit as BrandTheme, organizationId)
        }
      }
    } catch (error) {
      console.error('Error loading brand kit:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveBrandKit() {
    if (!organizationId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandKit }),
      })

      if (response.ok) {
        toast.success('Brand kit saved successfully')
        applyBrandTheme(brandKit as BrandTheme, organizationId)
        onUpdate?.(brandKit)
      } else {
        toast.error('Failed to save brand kit')
      }
    } catch (error) {
      console.error('Error saving brand kit:', error)
      toast.error('Failed to save brand kit')
    } finally {
      setLoading(false)
    }
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // In production, upload to storage and get URL
    // For now, create object URL for preview
    const objectUrl = URL.createObjectURL(file)
    setBrandKit(prev => ({ ...prev, logoUrl: objectUrl }))
    toast.info('Logo uploaded (preview only - implement file upload in production)')
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-bold mb-2">Brand Kit</h2>
        <p className="text-muted-foreground">
          Customize your organization's branding for QR codes
        </p>
      </div>

      <Tabs defaultValue="logo" className="w-full">
        <TabsList>
          <TabsTrigger value="logo">
            <ImageIcon className="h-4 w-4 mr-2" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="presets">
            <Palette className="h-4 w-4 mr-2" />
            QR Presets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Logo</CardTitle>
              <CardDescription>
                Upload your logo to use in QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandKit.logoUrl && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <img
                    src={brandKit.logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setBrandKit(prev => ({ ...prev, logoUrl: undefined }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div>
                <Label htmlFor="logo-upload">Upload Logo</Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: Square logo, transparent background, PNG format
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Define your organization's color palette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary-color">
                    Primary Color
                    <InlineHelper content="Main brand color used in QR codes" />
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={brandKit.primaryColor}
                      onChange={(e) =>
                        setBrandKit(prev => ({ ...prev, primaryColor: e.target.value }))
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={brandKit.primaryColor}
                      onChange={(e) =>
                        setBrandKit(prev => ({ ...prev, primaryColor: e.target.value }))
                      }
                      placeholder="#1a365d"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary-color">
                    Secondary Color
                    <InlineHelper content="Secondary brand color for backgrounds" />
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={brandKit.secondaryColor}
                      onChange={(e) =>
                        setBrandKit(prev => ({ ...prev, secondaryColor: e.target.value }))
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={brandKit.secondaryColor}
                      onChange={(e) =>
                        setBrandKit(prev => ({ ...prev, secondaryColor: e.target.value }))
                      }
                      placeholder="#edf2f7"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent-color">
                    Accent Color
                    <InlineHelper content="Accent color for highlights" />
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={brandKit.accentColor}
                      onChange={(e) =>
                        setBrandKit(prev => ({ ...prev, accentColor: e.target.value }))
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={brandKit.accentColor}
                      onChange={(e) =>
                        setBrandKit(prev => ({ ...prev, accentColor: e.target.value }))
                      }
                      placeholder="#4299e1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Presets</CardTitle>
              <CardDescription>
                Define default QR code styles for different use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['default', 'event', 'menu', 'payment', 'vcard'] as const).map((preset) => (
                <div key={preset} className="border rounded-lg p-4 space-y-3">
                  <Label className="capitalize">{preset} Preset</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Foreground Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={brandKit.presets?.[preset]?.foregroundColor || '#000000'}
                          onChange={(e) =>
                            setBrandKit(prev => ({
                              ...prev,
                              presets: {
                                ...prev.presets,
                                [preset]: {
                                  ...prev.presets?.[preset],
                                  foregroundColor: e.target.value,
                                  backgroundColor: prev.presets?.[preset]?.backgroundColor || '#ffffff',
                                },
                              },
                            }))
                          }
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={brandKit.presets?.[preset]?.foregroundColor || '#000000'}
                          onChange={(e) =>
                            setBrandKit(prev => ({
                              ...prev,
                              presets: {
                                ...prev.presets,
                                [preset]: {
                                  ...prev.presets?.[preset],
                                  foregroundColor: e.target.value,
                                  backgroundColor: prev.presets?.[preset]?.backgroundColor || '#ffffff',
                                },
                              },
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={brandKit.presets?.[preset]?.backgroundColor || '#ffffff'}
                          onChange={(e) =>
                            setBrandKit(prev => ({
                              ...prev,
                              presets: {
                                ...prev.presets,
                                [preset]: {
                                  ...prev.presets?.[preset],
                                  foregroundColor: prev.presets?.[preset]?.foregroundColor || '#000000',
                                  backgroundColor: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={brandKit.presets?.[preset]?.backgroundColor || '#ffffff'}
                          onChange={(e) =>
                            setBrandKit(prev => ({
                              ...prev,
                              presets: {
                                ...prev.presets,
                                [preset]: {
                                  ...prev.presets?.[preset],
                                  foregroundColor: prev.presets?.[preset]?.foregroundColor || '#000000',
                                  backgroundColor: e.target.value,
                                },
                              },
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => loadBrandKit()}
          disabled={loading}
        >
          Reset
        </Button>
        <Button onClick={saveBrandKit} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Save Brand Kit
        </Button>
      </div>
    </div>
  )
}

