import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { checkCreditsThreshold } from '@/lib/threshold-monitoring'
import { addSecurityHeaders } from '@/lib/security-headers'

export async function GET(request: NextRequest) {
  try {
    const isTestMode = process.env.E2E_TEST_MODE === 'true'
    if (isTestMode) {
      const response = NextResponse.json({
        credits: 999,
        plan: 'PRO'
      })
      return addSecurityHeaders(response, request)
    }

    const session = await getServerSession(authOptions) as { user?: { id: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: user, error } = await supabaseAdmin!
      .from('User')
      .select('credits, plan')
      .eq('id', session.user.id)
      .single()

    if (error || !user) {
      console.error("Error fetching user:", error)
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      )
    }

    // Check credits threshold (async, don't block response)
    try {
      checkCreditsThreshold(session.user.id).catch(console.error)
    } catch (error) {
      // Don't fail request if threshold check fails
      console.error('Error checking credits threshold:', error)
    }

    const response = NextResponse.json({
      credits: user.credits || 0,
      plan: user.plan || 'FREE'
    })

    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error("Error fetching user credits:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
