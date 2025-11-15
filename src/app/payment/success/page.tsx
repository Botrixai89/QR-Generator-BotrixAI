"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')
  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'error'>('checking')
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    if (!orderId) {
      setStatus('error')
      return
    }

    // Poll for payment status
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/razorpay/status?order_id=${orderId}`)
        const data = await response.json()

        if (data.paid) {
          setStatus('success')
          setCredits(data.credits)
          toast.success(`Payment successful! ${data.credits} credits added to your account`)
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        } else {
          // Keep checking if still pending
          setStatus('pending')
          // Poll again after 3 seconds
          setTimeout(checkPaymentStatus, 3000)
        }
      } catch (error) {
        console.error("Error checking payment status:", error)
        setStatus('error')
      }
    }

    // Start checking immediately
    checkPaymentStatus()

    // Set maximum polling time (2 minutes)
    const timeout = setTimeout(() => {
      if (status === 'pending') {
        setStatus('error')
        toast.error("Payment verification is taking longer than expected. Please check your dashboard.")
      }
    }, 120000) // 2 minutes

    return () => clearTimeout(timeout)
  }, [orderId, router, status])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Payment Status</CardTitle>
          <CardDescription className="text-center">
            Verifying your payment...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'checking' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Checking payment status...
              </p>
            </div>
          )}

          {status === 'pending' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
              <p className="text-sm text-muted-foreground text-center">
                Payment is being processed. Please wait...
              </p>
              <p className="text-xs text-muted-foreground text-center">
                This page will automatically update when payment is confirmed.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-green-600">
                  Payment Successful!
                </p>
                {credits && (
                  <p className="text-sm text-muted-foreground">
                    {credits} credits have been added to your account
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-red-600">
                  Payment Verification Failed
                </p>
                <p className="text-sm text-muted-foreground">
                  Unable to verify payment status. Please check your dashboard or contact support.
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/pricing">Back to Pricing</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

