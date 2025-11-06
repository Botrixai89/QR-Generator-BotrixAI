import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/notifications'
import { validateJsonBody } from '@/lib/validation'
import { z } from 'zod'
import { addSecurityHeaders } from '@/lib/security-headers'

const preferencesUpdateSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  emailFrequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
  notificationTypes: z.record(z.string(), z.any()).optional(),
  thresholds: z.record(z.string(), z.number()).optional(),
})

// GET - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await getNotificationPreferences(session.user.id)

    if (!preferences) {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    const response = NextResponse.json({ preferences })
    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateJsonBody(preferencesUpdateSchema, request)

    if (!validation.success) {
      return validation.response
    }

    const success = await updateNotificationPreferences(session.user.id, validation.data)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    const preferences = await getNotificationPreferences(session.user.id)
    const response = NextResponse.json({ preferences })
    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in PUT /api/notifications/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

