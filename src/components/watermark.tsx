"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface WatermarkProps {
  hasWatermark: boolean
  qrRef: React.RefObject<HTMLDivElement | null>
}

export default function Watermark({ hasWatermark, qrRef }: WatermarkProps) {
  const watermarkRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && qrRef.current && watermarkRef.current) {
      const qrElement = qrRef.current
      const watermarkElement = watermarkRef.current

      if (hasWatermark) {
        // Position watermark at bottom right corner
        watermarkElement.style.position = "absolute"
        watermarkElement.style.bottom = "0px"
        watermarkElement.style.right = "0px"
        watermarkElement.style.backgroundColor = "#ffffff"
        watermarkElement.style.padding = "4px 8px"
        watermarkElement.style.borderRadius = "4px"
        watermarkElement.style.zIndex = "10"
        watermarkElement.style.display = "flex"
        watermarkElement.style.alignItems = "center"
        watermarkElement.style.gap = "4px"
        watermarkElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"
        watermarkElement.innerHTML = `
          <img src="/botrix-logo01.png" alt="Botrix Logo" style="width: 55px; height: 27px; object-fit: contain;" onerror="this.style.display='none'" />
        `
      } else {
        watermarkElement.style.display = "none"
      }
    }
  }, [isClient, hasWatermark, qrRef])

  if (!isClient) {
    return null
  }

  return (
    <div
      ref={watermarkRef}
      style={{ display: "none" }}
    />
  )
}
