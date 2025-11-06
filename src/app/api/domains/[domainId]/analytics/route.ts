import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET - Get analytics for a custom domain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { domainId } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Verify domain belongs to user
    const { data: domain, error: domainError } = await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .select('id, userId, domain')
      .eq('id', domainId)
      .eq('userId', session.user.id)
      .single()

    if (domainError || !domain) {
      return NextResponse.json(
        { error: "Domain not found or access denied" },
        { status: 404 }
      )
    }

    // Build date range query
    let analyticsQuery = supabaseAdmin!
      .from('QrCodeDomainAnalytics')
      .select('*')
      .eq('domainId', domainId)
      .order('date', { ascending: false })

    if (startDate) {
      analyticsQuery = analyticsQuery.gte('date', startDate)
    }
    if (endDate) {
      analyticsQuery = analyticsQuery.lte('date', endDate)
    }

    const { data: analytics, error: analyticsError } = await analyticsQuery

    if (analyticsError) {
      console.error("Error fetching domain analytics:", analyticsError)
      return NextResponse.json(
        { error: "Failed to fetch domain analytics" },
        { status: 500 }
      )
    }

    // Aggregate analytics data
    const aggregated = {
      totalScans: 0,
      totalUniqueVisitors: 0,
      countries: {} as Record<string, number>,
      devices: {} as Record<string, number>,
      browsers: {} as Record<string, number>,
      dailyStats: [] as Array<{ date: string; scans: number; uniqueVisitors: number }>,
      dateRange: {
        start: startDate || null,
        end: endDate || null
      }
    }

    for (const day of analytics || []) {
      aggregated.totalScans += day.totalScans || 0
      aggregated.totalUniqueVisitors += day.uniqueVisitors || 0
      
      // Aggregate countries
      if (day.countries) {
        const countries = typeof day.countries === 'string' 
          ? JSON.parse(day.countries) 
          : day.countries
        if (typeof countries === 'object') {
          for (const [country, count] of Object.entries(countries)) {
            aggregated.countries[country] = (aggregated.countries[country] || 0) + (count as number)
          }
        }
      }
      
      // Aggregate devices
      if (day.devices) {
        const devices = typeof day.devices === 'string' 
          ? JSON.parse(day.devices) 
          : day.devices
        if (typeof devices === 'object') {
          for (const [device, count] of Object.entries(devices)) {
            aggregated.devices[device] = (aggregated.devices[device] || 0) + (count as number)
          }
        }
      }
      
      // Aggregate browsers
      if (day.browsers) {
        const browsers = typeof day.browsers === 'string' 
          ? JSON.parse(day.browsers) 
          : day.browsers
        if (typeof browsers === 'object') {
          for (const [browser, count] of Object.entries(browsers)) {
            aggregated.browsers[browser] = (aggregated.browsers[browser] || 0) + (count as number)
          }
        }
      }
      
      aggregated.dailyStats.push({
        date: day.date,
        scans: day.totalScans || 0,
        uniqueVisitors: day.uniqueVisitors || 0
      })
    }

    return NextResponse.json({
      domain: {
        id: domain.id,
        domain: domain.domain
      },
      analytics: aggregated
    })
  } catch (error) {
    console.error("Error fetching domain analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST - Record analytics event for a domain
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const { domainId } = await params
    const body = await request.json()
    const { country, device, browser } = body

    // Verify domain exists and is active
    const { data: domain, error: domainError } = await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .select('id, isVerified, status')
      .eq('id', domainId)
      .eq('isVerified', true)
      .eq('status', 'active')
      .single()

    if (domainError || !domain) {
      return NextResponse.json(
        { error: "Domain not found or not active" },
        { status: 404 }
      )
    }

    // Update domain analytics using the database function
    const today = new Date().toISOString().split('T')[0]
    
    // Get or create today's analytics record
    const { data: existingRecord } = await supabaseAdmin!
      .from('QrCodeDomainAnalytics')
      .select('*')
      .eq('domainId', domainId)
      .eq('date', today)
      .single()

    if (existingRecord) {
      // Update existing record
      const updateData: {
        totalScans: number
        updatedAt: string
        countries?: Record<string, number>
        devices?: Record<string, number>
        browsers?: Record<string, number>
      } = {
        totalScans: (existingRecord.totalScans || 0) + 1,
        updatedAt: new Date().toISOString()
      }

      // Update countries
      const countries = typeof existingRecord.countries === 'string' 
        ? JSON.parse(existingRecord.countries) 
        : existingRecord.countries || {}
      if (country) {
        countries[country] = (countries[country] || 0) + 1
      }
      updateData.countries = countries

      // Update devices
      const devices = typeof existingRecord.devices === 'string' 
        ? JSON.parse(existingRecord.devices) 
        : existingRecord.devices || {}
      if (device) {
        devices[device] = (devices[device] || 0) + 1
      }
      updateData.devices = devices

      // Update browsers
      const browsers = typeof existingRecord.browsers === 'string' 
        ? JSON.parse(existingRecord.browsers) 
        : existingRecord.browsers || {}
      if (browser) {
        browsers[browser] = (browsers[browser] || 0) + 1
      }
      updateData.browsers = browsers

      await supabaseAdmin!
        .from('QrCodeDomainAnalytics')
        .update(updateData)
        .eq('id', existingRecord.id)
    } else {
      // Create new record
      const analyticsData: {
        domainId: string
        date: string
        totalScans: number
        uniqueVisitors: number
        countries: Record<string, number>
        devices: Record<string, number>
        browsers: Record<string, number>
      } = {
        domainId,
        date: today,
        totalScans: 1,
        uniqueVisitors: 1,
        countries: country ? { [country]: 1 } : {},
        devices: device ? { [device]: 1 } : {},
        browsers: browser ? { [browser]: 1 } : {}
      }

      await supabaseAdmin!
        .from('QrCodeDomainAnalytics')
        .insert(analyticsData)
    }

    return NextResponse.json({
      success: true,
      message: "Analytics recorded successfully"
    })
  } catch (error) {
    console.error("Error recording domain analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

