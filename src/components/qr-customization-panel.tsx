"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Palette, 
  Sparkles, 
  Sticker, 
  Download, 
  RotateCcw,
  Settings,
  Eye,
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
  Leaf
} from "lucide-react"
import { 
  AdvancedQROptions, 
  QRTemplate, 
  QRSticker, 
  QR_TEMPLATES,
  QR_STICKERS
} from "@/types/qr-code-advanced"

interface QRCustomizationPanelProps {
  options: AdvancedQROptions
  onOptionsChange: (options: AdvancedQROptions) => void
  onDownload: (format: 'png' | 'svg') => void
  onReset: () => void
}

// Template preview component
function TemplatePreview({ template, isSelected, onClick }: { 
  template: { name: string; description?: string }
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

// Sticker preview component
function StickerPreview({ sticker, isSelected, onClick }: { 
  sticker: { type: string }
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

// Color picker component
function ColorPicker({ 
  label, 
  value, 
  onChange, 
  showGradient = false 
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  showGradient?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
      {showGradient && (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="text-xs">
            Gradient
          </Button>
        </div>
      )}
    </div>
  )
}

export default function QRCustomizationPanel({ 
  options, 
  onOptionsChange, 
  onDownload, 
  onReset 
}: QRCustomizationPanelProps) {
  const [activeTab, setActiveTab] = useState("templates")

  const handleOptionChange = (key: keyof AdvancedQROptions, value: unknown) => {
    onOptionsChange({
      ...options,
      [key]: value
    })
  }

  const handleTemplateSelect = (templateId: QRTemplate) => {
    const template = QR_TEMPLATES[templateId]
    if (template) {
      onOptionsChange({
        ...options,
        template: templateId,
        foregroundColor: template.colors.foreground,
        backgroundColor: template.colors.background,
        gradient: template.colors.gradient,
        dotType: template.styles.dotType,
        cornerType: template.styles.cornerType,
        eyePattern: template.styles.eyePattern,
        sticker: template.sticker,
      })
    }
  }

  const handleStickerSelect = (stickerId: QRSticker) => {
    const sticker = QR_STICKERS[stickerId]
    if (sticker) {
      handleOptionChange('sticker', sticker)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Customize QR Code
        </CardTitle>
        <CardDescription>
          Advanced customization options for your QR code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="stickers" className="text-xs">
              <Sticker className="h-3 w-3 mr-1" />
              Stickers
            </TabsTrigger>
            <TabsTrigger value="colors" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="styles" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Styles
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(QR_TEMPLATES).map(([id, template]) => (
                <TemplatePreview
                  key={id}
                  template={template}
                  isSelected={options.template === id}
                  onClick={() => handleTemplateSelect(id as QRTemplate)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Stickers Tab */}
          <TabsContent value="stickers" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(QR_STICKERS).map(([id, sticker]) => (
                <StickerPreview
                  key={id}
                  sticker={sticker}
                  isSelected={options.sticker?.type === id}
                  onClick={() => handleStickerSelect(id as QRSticker)}
                />
              ))}
            </div>
            <Button variant="outline" className="w-full">
              + Add Your Own Sticker
            </Button>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4 mt-4">
            <ColorPicker
              label="Foreground Color"
              value={options.foregroundColor || '#000000'}
              onChange={(value) => handleOptionChange('foregroundColor', value)}
              showGradient={true}
            />
            <ColorPicker
              label="Background Color"
              value={options.backgroundColor || '#ffffff'}
              onChange={(value) => handleOptionChange('backgroundColor', value)}
            />
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Gradient Colors</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value="#ff6b6b"
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="color"
                  value="#4ecdc4"
                  className="w-12 h-10 p-1"
                />
                <Button variant="outline" size="sm">
                  Add Color
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Styles Tab */}
          <TabsContent value="styles" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dot Style</Label>
                <Select 
                  value={options.dotType || 'square'} 
                  onValueChange={(value) => handleOptionChange('dotType', value)}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Corner Style</Label>
                <Select 
                  value={options.cornerType || 'square'} 
                  onValueChange={(value) => handleOptionChange('cornerType', value)}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Eye Pattern</Label>
                <Select 
                  value={options.eyePattern || 'square'} 
                  onValueChange={(value) => handleOptionChange('eyePattern', value)}
                >
                  <SelectTrigger>
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

            <Separator />

            <div className="space-y-3">
              <Label>Effects</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">3D Effect</Label>
                  <Switch 
                    checked={options.effects?.threeD || false}
                    onCheckedChange={(checked) => 
                      handleOptionChange('effects', { ...options.effects, threeD: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Shadow</Label>
                  <Switch 
                    checked={options.effects?.shadow || false}
                    onCheckedChange={(checked) => 
                      handleOptionChange('effects', { ...options.effects, shadow: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Glow</Label>
                  <Switch 
                    checked={options.effects?.glow || false}
                    onCheckedChange={(checked) => 
                      handleOptionChange('effects', { ...options.effects, glow: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onReset}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={() => onDownload('png')}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => onDownload('svg')}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download SVG
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
