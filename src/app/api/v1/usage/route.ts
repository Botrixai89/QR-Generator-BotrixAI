import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'
import { withUsageMetering } from '@/lib/api-usage'
import { getApiUsageStats } from '@/lib/api-keys'

// GET - Get API usage statistics
async function handleGet(
  request: NextRequest,
  context: any,
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { searchParams } = new URL(request.url)
  const apiKeyId = searchParams.get('apiKeyId')
  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : undefined
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : undefined

  // If apiKeyId is provided, verify it belongs to user/org
  if (apiKeyId && apiKeyId !== authContext.apiKeyId) {
    // Verify access to this API key
    // This would require fetching the API key and checking ownership
    // For now, only allow querying own key
    if (apiKeyId !== authContext.apiKeyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const stats = await getApiUsageStats(
    apiKeyId || authContext.apiKeyId,
    authContext.organizationId ? null : authContext.userId,
    authContext.organizationId,
    startDate,
    endDate
  )

  return NextResponse.json({
    usage: stats,
    period: {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    },
  })
}

export const GET = withUsageMetering((req, ctx, auth) =>
  authenticateApiRequest(req).then((result) => {
    if (!result.success) return result.response
    return handleGet(req, ctx, result.context)
  })
)

