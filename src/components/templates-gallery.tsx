"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  UtensilsCrossed, 
  CreditCard, 
  Contact, 
  Briefcase, 
  Palette,
  CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdvancedQROptions } from "@/types/qr-code-advanced"

export interface QRTemplate {
  id: string
  name: string
  category: 'event' | 'menu' | 'payment' | 'vcard' | 'business' | 'creative'
  description: string
  preview?: string
  config: Partial<AdvancedQROptions>
  popular?: boolean
}

const TEMPLATES: QRTemplate[] = [
  {
    id: 'event',
    name: 'Event',
    category: 'event',
    description: 'Perfect for events, conferences, and gatherings',
    popular: true,
    config: {
      foregroundColor: '#1a365d',
      backgroundColor: '#ffffff',
      dotType: 'rounded',
      cornerType: 'rounded',
      eyePattern: 'rounded',
    },
  },
  {
    id: 'menu',
    name: 'Restaurant Menu',
    category: 'menu',
    description: 'Ideal for restaurants and cafes',
    popular: true,
    config: {
      foregroundColor: '#2d3748',
      backgroundColor: '#f7fafc',
      dotType: 'classy',
      cornerType: 'classy',
      eyePattern: 'rounded',
    },
  },
  {
    id: 'payment',
    name: 'Payment',
    category: 'payment',
    description: 'Professional payment QR codes',
    config: {
      foregroundColor: '#1a202c',
      backgroundColor: '#ffffff',
      dotType: 'square',
      cornerType: 'square',
      eyePattern: 'square',
    },
  },
  {
    id: 'vcard',
    name: 'vCard',
    category: 'vcard',
    description: 'Digital business cards',
    popular: true,
    config: {
      foregroundColor: '#4a5568',
      backgroundColor: '#edf2f7',
      dotType: 'rounded',
      cornerType: 'rounded',
      eyePattern: 'rounded',
    },
  },
  {
    id: 'business',
    name: 'Business',
    category: 'business',
    description: 'Professional business QR codes',
    config: {
      foregroundColor: '#1a365d',
      backgroundColor: '#ffffff',
      dotType: 'rounded',
      cornerType: 'rounded',
      eyePattern: 'rounded',
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    category: 'creative',
    description: 'Vibrant and artistic designs',
    config: {
      foregroundColor: '#e53e3e',
      backgroundColor: '#ffffff',
      dotType: 'extra-rounded',
      cornerType: 'extra-rounded',
      eyePattern: 'extra-rounded',
    },
  },
]

const CATEGORY_ICONS = {
  event: Calendar,
  menu: UtensilsCrossed,
  payment: CreditCard,
  vcard: Contact,
  business: Briefcase,
  creative: Palette,
}

interface TemplatesGalleryProps {
  onSelectTemplate: (template: QRTemplate) => void
  selectedTemplateId?: string
  className?: string
}

export function TemplatesGallery({
  onSelectTemplate,
  selectedTemplateId,
  className,
}: TemplatesGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(TEMPLATES.map(t => t.category)))]

  const filteredTemplates = selectedCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory)

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-bold mb-2">QR Code Templates</h2>
        <p className="text-muted-foreground">
          Choose a template to get started quickly
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.filter(c => c !== 'all').map(category => {
            const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
            return (
              <TabsTrigger key={category} value={category} className="capitalize">
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {category}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const Icon = CATEGORY_ICONS[template.category]
              const isSelected = selectedTemplateId === template.id

              return (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => onSelectTemplate(template)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectTemplate(template)
                    }
                  }}
                  aria-label={`Select ${template.name} template`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      {template.popular && (
                        <Badge variant="secondary">Popular</Badge>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Template Preview Placeholder */}
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center mb-4">
                      <div
                        className="w-24 h-24 rounded"
                        style={{
                          backgroundColor: template.config.backgroundColor || '#ffffff',
                          border: `2px solid ${template.config.foregroundColor || '#000000'}`,
                        }}
                      >
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ color: template.config.foregroundColor || '#000000' }}
                        >
                          QR
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant={isSelected ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectTemplate(template)
                      }}
                    >
                      {isSelected ? "Selected" : "Use Template"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

