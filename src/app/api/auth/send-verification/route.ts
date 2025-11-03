import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmailVerification } from '@/lib/transactional-emails'
import { supabaseAdmin } from '@/lib/supabase'
import { addSecurityHeaders } from '@/lib/security-headers'

/**
 * POST /api/auth/send-verification
 * Resends email verification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user email
    const { data: user } = await supabaseAdmin!
      .from('User')
      .select('email, name, emailVerified')
      .eq('id', session.user.id)
      .single()

    if (!user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Send verification email
    const result = await sendEmailVerification(session.user.id, user.email, user.name || undefined)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send verification email' }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    })

    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in POST /api/auth/send-verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

