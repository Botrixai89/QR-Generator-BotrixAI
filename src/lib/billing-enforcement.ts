import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActiveSubscription, isLockedOut, isInGracePeriod } from "@/lib/billing"

export async function checkBillingAccess(request: NextRequest): Promise<{
  allowed: boolean
  reason?: string
  redirect?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { allowed: false, reason: "Unauthorized" }
    }

    const sub = await getActiveSubscription(session.user.id)
    
    // Check lockout first
    if (isLockedOut(sub)) {
      return {
        allowed: false,
        reason: "Subscription locked out. Please update your payment method.",
        redirect: "/dashboard/settings/billing"
      }
    }

    // If in grace period, allow access but could show warning banner
    if (sub && isInGracePeriod(sub)) {
      return {
        allowed: true,
        reason: "grace_period",
      }
    }

    return { allowed: true }
  } catch (e) {
    console.error('Billing access check error:', e)
    // On error, allow access (fail open for now)
    return { allowed: true }
  }
}

