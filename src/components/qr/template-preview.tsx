"use client"

import { useState, useEffect, memo } from "react"
import type { QRTemplateConfig } from "@/types/qr-code-advanced"
import { loadAdvancedQR } from "@/lib/qr-loader"

interface TemplatePreviewProps {
  template: QRTemplateConfig
  isSelected: boolean
  onClick: () => void
}

// Memoized for performance - only re-renders when props change
const TemplatePreviewComponent = ({ template, isSelected, onClick }: TemplatePreviewProps) => {
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

// Memoize the component to prevent unnecessary re-renders
// Only re-renders when template, isSelected, or onClick changes
export const TemplatePreview = memo(TemplatePreviewComponent)
TemplatePreview.displayName = 'TemplatePreview'

