import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { markNotificationRead } from '@/lib/notifications'
import { addSecurityHeaders } from '@/lib/security-headers'

// PATCH - Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const success = await markNotificationRead(id, session.user.id)

    if (!success) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const response = NextResponse.json({ success: true })
    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in PATCH /api/notifications/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

