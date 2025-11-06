import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { addSecurityHeaders } from '@/lib/security-headers'
import { logAuditEvent, extractRequestInfo } from '@/lib/audit-log'

const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

/**
 * POST /api/auth/verify-email
 * Verifies email address using token
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateJsonBody(verifyEmailSchema, request)
    if (!validation.success) {
      return validation.response
    }

    const { token } = validation.data

    // Get verification token
    const { data: verificationToken, error: tokenError } = await supabaseAdmin!
      .from('EmailVerificationToken')
      .select('*, User(*)')
      .eq('token', token)
      .eq('verifiedAt', null)
      .maybeSingle()

    if (tokenError || !verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date(verificationToken.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 410 })
    }

    // Mark token as verified
    await supabaseAdmin!
      .from('EmailVerificationToken')
      .update({ verifiedAt: new Date().toISOString() })
      .eq('id', verificationToken.id)

    // Update user email verification status
    await supabaseAdmin!
      .from('User')
      .update({ emailVerified: new Date().toISOString() })
      .eq('id', verificationToken.userId)

    // Log audit event
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await logAuditEvent({
      userId: verificationToken.userId,
      action: 'email_verified',
      resourceType: 'user',
      resourceId: verificationToken.userId,
      ipAddress,
      userAgent,
      requestMethod: 'POST',
      requestPath: '/api/auth/verify-email',
      metadata: { email: (verificationToken.User as { email?: string } | null)?.email },
      success: true,
    })

    const response = NextResponse.json({ success: true, message: 'Email verified successfully' })
    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in POST /api/auth/verify-email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Re-import validateJsonBody
import { validateJsonBody } from '@/lib/validation'

