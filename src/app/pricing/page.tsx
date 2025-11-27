"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Star } from "lucide-react"
import { toast } from "sonner"
import { useEffectiveSession } from "@/hooks/use-effective-session"
import { getE2ETestSession, saveE2ETestSession } from "@/lib/e2e-test-session"

interface RazorpayOptions {
  key?: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayPaymentResponse) => Promise<void>
  prefill?: {
    name?: string
    email?: string
  }
  theme?: {
    color: string
  }
  modal?: {
    ondismiss: () => void
  }
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const isClientTestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true"

export default function PricingPage() {
  const { session, status } = useEffectiveSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    setIsLoading(true)

    if (isClientTestMode) {
      const existingSession = getE2ETestSession()
      if (!existingSession) {
        router.push("/auth/signin")
        setIsLoading(false)
        return
      }
      saveE2ETestSession({ ...existingSession, plan: "PRO" })
      toast.success("Payment successful! 100 credits added to your account (test mode)")
      router.push("/dashboard")
      setIsLoading(false)
      return
    }

    try {
      // Create Razorpay order
      const response = await fetch("/api/razorpay/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: "FLEX" }),
      })

      if (!response.ok) {
        // Surface server-provided error to help debugging (e.g., Razorpay auth failure)
        let message = 'Failed to create order'
        try {
          const data = await response.json()
          if (data?.error) message = data.error
        } catch {
          try {
            message = await response.text()
          } catch {}
        }
        throw new Error(message || 'Failed to create order')
      }

      const { order_id } = await response.json()

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        document.head.appendChild(script)
        
        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      // Open Razorpay checkout
      // TESTING MODE: Amount set to ₹1 (100 paise) for testing payment flow
      // TODO: Change back to 30000 (₹300) for production
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 100, // ₹1 in paise (TESTING - change to 30000 for production)
        currency: "INR",
        name: "QR Generator",
        description: "Pro Plan - 100 Credits",
        order_id: order_id,
        handler: async function (response: RazorpayPaymentResponse) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed")
            }

            const result = await verifyResponse.json()
            
            toast.success(`Payment successful! ${result.credits} credits added to your account`)
            router.push("/dashboard")
          } catch (error) {
            console.error("Payment verification error:", error)
            toast.error("Payment verification failed. Please contact support.")
          }
        },
        prefill: {
          name: session.user?.name || "",
          email: session.user?.email || "",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false)
          }
        }
      }

      // Store polling interval reference
      let pollInterval: NodeJS.Timeout | null = null
      let pollCount = 0
      const maxPolls = 40 // Poll for 2 minutes (40 * 3 seconds)
      
      const pollPaymentStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/razorpay/status?order_id=${order_id}`)
          const statusData = await statusResponse.json()
          
          if (statusData.paid) {
            // Payment completed
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
            }
            toast.success(`Payment successful! ${statusData.credits} credits added to your account`)
            setIsLoading(false)
            router.push("/dashboard")
            return
          }
          
          pollCount++
          if (pollCount >= maxPolls) {
            // Stop polling after max attempts
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
            }
            // Redirect to success page for manual check
            setIsLoading(false)
            router.push(`/payment/success?order_id=${order_id}`)
          }
        } catch (error) {
          console.error("Error polling payment status:", error)
        }
      }
      
      // Update modal onDismiss to clean up polling
      const originalOndismiss = options.modal?.ondismiss
      options.modal = {
        ...options.modal,
        ondismiss: function() {
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
          }
          setIsLoading(false)
          if (originalOndismiss) {
            originalOndismiss()
          }
        }
      }
      
      const razorpay = new window.Razorpay(options)
      
      // Start polling after modal opens (for UPI QR payments that complete outside modal)
      setTimeout(() => {
        if (!pollInterval) {
          pollInterval = setInterval(pollPaymentStatus, 3000) // Poll every 3 seconds
        }
      }, 2000)
      
      razorpay.open()
    } catch (error: unknown) {
      console.error("Payment error:", error)
      const message = error instanceof Error ? error.message : "Failed to initiate payment. Please try again."
      toast.error(message)
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-800"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with free credits or upgrade to our Pro plan for unlimited QR code generation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Zap className="h-5 w-5 text-gray-700" />
                Free Plan
              </CardTitle>
              <CardDescription className="text-gray-500">
                Perfect for getting started
              </CardDescription>
              <div className="text-3xl font-bold text-gray-900">
                ₹0
                <span className="text-lg font-normal text-gray-500">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6 text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>10 free credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Basic QR customization</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>PNG & SVG downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>QR analytics</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full text-gray-500 border-gray-300"
                disabled
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative bg-white border-gray-300 shadow-lg">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gray-800 text-white px-4 py-1">
                <Star className="h-3 w-3 mr-1" />
                Save ₹100 vs competitor
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Star className="h-5 w-5 text-gray-700" />
                Pro Plan
              </CardTitle>
              <CardDescription className="text-gray-500">
                Most popular choice
              </CardDescription>
              <div className="text-3xl font-bold text-gray-900">
                ₹1
                <span className="text-lg font-normal text-gray-500">/one-time</span>
                <span className="ml-2 text-xs font-normal text-amber-600">(Testing Mode)</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6 text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>100 credits included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>All Free plan features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Advanced QR customization</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Dynamic QR codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Social Media QR codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>UPI Payment QR codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Bulk QR generation</span>
                </li>
              </ul>
              <Button 
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isLoading ? "Processing..." : "Buy now"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            Need more credits? Purchase additional credits anytime from your dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
