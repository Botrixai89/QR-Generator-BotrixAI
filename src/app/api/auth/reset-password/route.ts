import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateJsonBody } from '@/lib/validation'
import { z } from 'zod'
import { addSecurityHeaders } from '@/lib/security-headers'
import { logAuditEvent, extractRequestInfo } from '@/lib/audit-log'
import bcrypt from 'bcryptjs'

const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
})

const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

/**
 * POST /api/auth/reset-password
 * Request password reset (sends email)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if it's a request or confirmation
    if (body.email) {
      // Password reset request
      const validation = await validateJsonBody(resetPasswordRequestSchema, request)
      if (!validation.success) {
        return validation.response
      }

      const { email } = validation.data

      // Get user
      const { data: user } = await supabaseAdmin!
        .from('User')
        .select('id, email, name')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      // Always return success (don't reveal if email exists)
      if (user) {
        // Send password reset email
        const { sendPasswordReset } = await import('@/lib/transactional-emails')
        await sendPasswordReset(user.id, user.email || email, user.name || undefined)
      }

      const response = NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
      return addSecurityHeaders(response, request)
    } else if (body.token && body.newPassword) {
      // Password reset confirmation
      const validation = await validateJsonBody(resetPasswordConfirmSchema, request)
      if (!validation.success) {
        return validation.response
      }

      const { token, newPassword } = validation.data

      // Get reset token
      const { data: resetToken, error: tokenError } = await supabaseAdmin!
        .from('PasswordResetToken')
        .select('*, User(*)')
        .eq('token', token)
        .eq('usedAt', null)
        .maybeSingle()

      if (tokenError || !resetToken) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }

      // Check if token is expired
      if (new Date(resetToken.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Reset token has expired' }, { status: 410 })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // Update user password
      await supabaseAdmin!
        .from('User')
        .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
        .eq('id', resetToken.userId)

      // Mark token as used
      await supabaseAdmin!
        .from('PasswordResetToken')
        .update({ usedAt: new Date().toISOString() })
        .eq('id', resetToken.id)

      // Log audit event
      const { ipAddress, userAgent } = extractRequestInfo(request)
      await logAuditEvent({
        userId: resetToken.userId,
        action: 'password_change',
        resourceType: 'user',
        resourceId: resetToken.userId,
        ipAddress,
        userAgent,
        requestMethod: 'POST',
        requestPath: '/api/auth/reset-password',
        success: true,
      })

      const response = NextResponse.json({
        success: true,
        message: 'Password reset successfully',
      })
      return addSecurityHeaders(response, request)
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide email or token+newPassword' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

