import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  getUserNotifications,
  getUnreadCount,
  markAllNotificationsRead,
} from '@/lib/notifications'
import { validateQuery } from '@/lib/validation'
import { z } from 'zod'
import { addSecurityHeaders } from '@/lib/security-headers'

const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  unreadOnly: z.coerce.boolean().optional(),
})

// Helper function to safely add security headers and always return a response
function withSecurityHeaders(response: NextResponse | undefined | null, request: NextRequest): NextResponse {
  try {
    if (!response) {
      // Ensure route always returns a valid response
      return NextResponse.json({ notifications: [], total: 0, unreadCount: 0, limit: 0, offset: 0 })
    }
    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error adding security headers:', error)
    // Fallback to original response if header injection fails; never error out the API
    return response ?? NextResponse.json({ notifications: [], total: 0, unreadCount: 0, limit: 0, offset: 0 })
  }
}

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
    let session: { user?: { id?: string | null } | null } | null = null
    try {
      session = await getServerSession(authOptions) as { user?: { id?: string | null } | null } | null
    } catch {
      // In dev or if auth is not configured, fail soft and return empty set
      console.warn('getServerSession failed in /api/notifications, returning empty set')
    }

    if (!session?.user?.id) {
      const response = NextResponse.json({ notifications: [], total: 0, unreadCount: 0, limit: 0, offset: 0 })
      return withSecurityHeaders(response, request)
    }

    const { searchParams } = new URL(request.url)
    const validation = await validateQuery(notificationQuerySchema, searchParams)

    if (!validation.success) {
      return withSecurityHeaders(validation.response, request)
    }

    const { limit, offset, unreadOnly } = validation.data

    const result = await getUserNotifications(session.user.id, limit, offset, !!unreadOnly)
    const unreadCount = await getUnreadCount(session.user.id)

    const response = NextResponse.json({
      notifications: result.notifications || [],
      total: result.total || 0,
      unreadCount: unreadCount || 0,
      limit,
      offset,
    })

    return withSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    const errorResponse = NextResponse.json({ notifications: [], total: 0, unreadCount: 0 }, { status: 200 })
    return withSecurityHeaders(errorResponse, request)
  }
}

// PATCH - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return withSecurityHeaders(response, request)
    }

    const body = await request.json().catch(() => ({}))
    const { action } = body

    if (action === 'mark_all_read') {
      const success = await markAllNotificationsRead(session.user.id)
      if (!success) {
        const errorResponse = NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
        return withSecurityHeaders(errorResponse, request)
      }

      const response = NextResponse.json({ success: true })
      return withSecurityHeaders(response, request)
    }

    const invalidResponse = NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    return withSecurityHeaders(invalidResponse, request)
  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error)
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return withSecurityHeaders(errorResponse, request)
  }
}

