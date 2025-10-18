"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Camera, CameraOff, CheckCircle, XCircle } from "lucide-react"
import jsQR from "jsqr"

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastScanResult, setLastScanResult] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setError(null)
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setHasPermission(true)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setIsScanning(true)
      
      // Start scanning for QR codes
      scanIntervalRef.current = setInterval(scanForQRCode, 100)
      
    } catch (err) {
      console.error('Error accessing camera:', err)
      setHasPermission(false)
      setError('Camera access denied or not available')
      onError?.('Camera access denied or not available')
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Simple QR code detection (this is a basic implementation)
    // In a real app, you'd use a proper QR code library like jsQR
    try {
      // For now, we'll simulate QR code detection
      // You can integrate jsQR library for actual QR code detection
      const result = detectQRCode(imageData)
      
      if (result) {
        setLastScanResult(result)
        onScan(result)
        stopScanning()
      }
    } catch (err) {
      console.error('Error scanning QR code:', err)
    }
  }

  // QR code detection using jsQR
  const detectQRCode = (imageData: ImageData): string | null => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      return code ? code.data : null
    } catch (error) {
      console.error('Error detecting QR code:', error)
      return null
    }
  }

  const handleScanResult = (result: string) => {
    setLastScanResult(result)
    onScan(result)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Scan QR codes using your device camera
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Camera Status:</span>
          {hasPermission === null && (
            <Badge variant="secondary">Not Started</Badge>
          )}
          {hasPermission === false && (
            <Badge variant="destructive">No Permission</Badge>
          )}
          {hasPermission === true && !isScanning && (
            <Badge variant="secondary">Ready</Badge>
          )}
          {isScanning && (
            <Badge variant="default" className="animate-pulse">Scanning</Badge>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Video Preview */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <QrCode className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Position QR code here</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Last Scan Result */}
        {lastScanResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Last Scan Result:</span>
            </div>
            <p className="text-sm text-green-700 break-all">{lastScanResult}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button 
              onClick={startScanning}
              className="flex-1"
              disabled={hasPermission === false}
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button 
              onClick={stopScanning}
              variant="destructive"
              className="flex-1"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Make sure your camera has permission to access</p>
          <p>• Point your camera at a QR code</p>
          <p>• The scanner will automatically detect and process the code</p>
        </div>
      </CardContent>
    </Card>
  )
}
