"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface QRAdDisplayProps {
  qrCodeId: string
  onClose: () => void
  onContinue: () => void
  adType?: 'banner' | 'interstitial'
}

/**
 * Ad display component shown to users scanning QR codes created by free plan users
 * Similar to ME-QR's ad-supported model
 */
export default function QRAdDisplay({ 
  qrCodeId, 
  onClose, 
  onContinue,
  adType = 'interstitial'
}: QRAdDisplayProps) {
  const [countdown, setCountdown] = useState(3)
  const [canContinue, setCanContinue] = useState(false)

  useEffect(() => {
    // Record ad view
    const recordAdView = async () => {
      try {
        await fetch(`/api/qr-codes/${qrCodeId}/ad-view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adType,
            adProvider: 'custom'
          })
        })
      } catch (error) {
        console.error('Failed to record ad view:', error)
      }
    }

    recordAdView()

    // Countdown timer - user must wait before continuing
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanContinue(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [qrCodeId, adType])

  if (adType === 'banner') {
    return (
      <Card className="w-full border-yellow-400 bg-yellow-50 dark:bg-yellow-950">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Ad
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                This QR code is ad-supported
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Interstitial ad (full screen overlay)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 border-2 border-yellow-400">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Advertisement</h3>
              <p className="text-sm text-muted-foreground">
                This QR code is ad-supported. Please wait a moment to continue.
              </p>
            </div>

            {/* Ad placeholder - Replace with actual ad content */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Ad Space</p>
                <p className="text-xs text-muted-foreground">
                  Your advertisement would appear here
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              {!canContinue ? (
                <div className="text-sm text-muted-foreground">
                  Continue in {countdown} second{countdown !== 1 ? 's' : ''}...
                </div>
              ) : (
                <Button onClick={onContinue} className="w-full">
                  Continue to Content
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Upgrade to remove ads from your QR codes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

