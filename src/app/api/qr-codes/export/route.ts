import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// Analytics export endpoints
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      qrCodeIds, // Array of QR code IDs to export
      format = 'json', // 'json', 'csv', 'xlsx'
      dateRange, // { start: '2024-01-01', end: '2024-12-31' }
      includeAnalytics = true,
      includeScans = false
    } = body

    if (!qrCodeIds || !Array.isArray(qrCodeIds) || qrCodeIds.length === 0) {
      return NextResponse.json(
        { error: "QR code IDs are required" },
        { status: 400 }
      )
    }

    // Get QR codes with analytics
    const { data: qrCodes, error: qrError } = await supabaseAdmin!
      .from('QrCode')
      .select(`
        *,
        QrCodeScan(
          id,
          scannedAt,
          userAgent,
          ipAddress,
          country,
          city,
          device,
          browser,
          os,
          latitude,
          longitude,
          abTestVariant
        )
      `)
      .in('id', qrCodeIds)
      .eq('userId', session.user.id)

    if (qrError) {
      console.error("Error fetching QR codes:", qrError)
      return NextResponse.json(
        { error: "Failed to fetch QR codes" },
        { status: 500 }
      )
    }

    // Filter scans by date range if provided
    let filteredQrCodes = qrCodes
    if (dateRange && dateRange.start && dateRange.end) {
      filteredQrCodes = qrCodes.map(qrCode => ({
        ...qrCode,
        QrCodeScan: qrCode.QrCodeScan.filter((scan: any) => {
          const scanDate = new Date(scan.scannedAt)
          const startDate = new Date(dateRange.start)
          const endDate = new Date(dateRange.end)
          return scanDate >= startDate && scanDate <= endDate
        })
      }))
    }

    // Generate export data
    const exportData = generateExportData(filteredQrCodes, includeAnalytics, includeScans)

    // Generate file based on format
    let fileContent: string | Buffer
    let contentType: string
    let fileName: string

    switch (format) {
      case 'csv':
        fileContent = generateCSV(exportData)
        contentType = 'text/csv'
        fileName = `qr-codes-analytics-${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'xlsx':
        fileContent = await generateExcel(exportData)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileName = `qr-codes-analytics-${new Date().toISOString().split('T')[0]}.xlsx`
        break
      default:
        fileContent = JSON.stringify(exportData, null, 2)
        contentType = 'application/json'
        fileName = `qr-codes-analytics-${new Date().toISOString().split('T')[0]}.json`
    }

    // Return file as response
    return new NextResponse(fileContent as string, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileContent.length.toString()
      }
    })
  } catch (error) {
    console.error("Error exporting analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Generate export data structure
function generateExportData(qrCodes: any[], includeAnalytics: boolean, includeScans: boolean) {
  return qrCodes.map(qrCode => {
    const scans = qrCode.QrCodeScan || []
    
    const baseData = {
      id: qrCode.id,
      title: qrCode.title,
      url: qrCode.url,
      isDynamic: qrCode.isDynamic,
      isActive: qrCode.isActive,
      createdAt: qrCode.createdAt,
      lastScannedAt: qrCode.lastScannedAt,
      customDomain: qrCode.customDomain,
      redirectUrl: qrCode.redirectUrl
    }

    if (includeAnalytics) {
      const analytics = {
        totalScans: scans.length,
        uniqueDevices: new Set(scans.map((s: any) => s.device)).size,
        uniqueCountries: new Set(scans.map((s: any) => s.country).filter(Boolean)).size,
        uniqueCities: new Set(scans.map((s: any) => s.city).filter(Boolean)).size,
        scansByDevice: scans.reduce((acc: any, scan: any) => {
          acc[scan.device || 'Unknown'] = (acc[scan.device || 'Unknown'] || 0) + 1
          return acc
        }, {}),
        scansByCountry: scans.reduce((acc: any, scan: any) => {
          if (scan.country) {
            acc[scan.country] = (acc[scan.country] || 0) + 1
          }
          return acc
        }, {}),
        scansByBrowser: scans.reduce((acc: any, scan: any) => {
          acc[scan.browser || 'Unknown'] = (acc[scan.browser || 'Unknown'] || 0) + 1
          return acc
        }, {}),
        scansByOS: scans.reduce((acc: any, scan: any) => {
          acc[scan.os || 'Unknown'] = (acc[scan.os || 'Unknown'] || 0) + 1
          return acc
        }, {}),
        scansByDate: scans.reduce((acc: any, scan: any) => {
          const date = new Date(scan.scannedAt).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {}),
        abTestResults: scans.reduce((acc: any, scan: any) => {
          if (scan.abTestVariant) {
            acc[scan.abTestVariant] = (acc[scan.abTestVariant] || 0) + 1
          }
          return acc
        }, {})
      }

      return {
        ...baseData,
        analytics,
        ...(includeScans && { scans: scans.map((scan: any) => ({
          scannedAt: scan.scannedAt,
          device: scan.device,
          browser: scan.browser,
          os: scan.os,
          country: scan.country,
          city: scan.city,
          ipAddress: scan.ipAddress,
          abTestVariant: scan.abTestVariant
        })) })
      }
    }

    return baseData
  })
}

// Generate CSV content
function generateCSV(exportData: any[]): string {
  const headers = [
    'QR Code ID',
    'Title',
    'URL',
    'Is Dynamic',
    'Is Active',
    'Created At',
    'Last Scanned At',
    'Total Scans',
    'Unique Devices',
    'Unique Countries',
    'Unique Cities',
    'Top Device',
    'Top Country',
    'Top Browser',
    'Top OS'
  ]

  const rows = exportData.map(qrCode => {
    const analytics = qrCode.analytics || {}
    return [
      qrCode.id,
      qrCode.title,
      qrCode.url,
      qrCode.isDynamic,
      qrCode.isActive,
      qrCode.createdAt,
      qrCode.lastScannedAt || 'Never',
      analytics.totalScans || 0,
      analytics.uniqueDevices || 0,
      analytics.uniqueCountries || 0,
      analytics.uniqueCities || 0,
      getTopItem(analytics.scansByDevice),
      getTopItem(analytics.scansByCountry),
      getTopItem(analytics.scansByBrowser),
      getTopItem(analytics.scansByOS)
    ]
  })

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csvContent
}

// Generate Excel content
async function generateExcel(exportData: any[]): Promise<Buffer> {
  const XLSX = require('xlsx')
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const summaryData = exportData.map(qrCode => {
    const analytics = qrCode.analytics || {}
    return {
      'QR Code ID': qrCode.id,
      'Title': qrCode.title,
      'URL': qrCode.url,
      'Is Dynamic': qrCode.isDynamic,
      'Is Active': qrCode.isActive,
      'Created At': qrCode.createdAt,
      'Last Scanned At': qrCode.lastScannedAt || 'Never',
      'Total Scans': analytics.totalScans || 0,
      'Unique Devices': analytics.uniqueDevices || 0,
      'Unique Countries': analytics.uniqueCountries || 0,
      'Unique Cities': analytics.uniqueCities || 0,
      'Top Device': getTopItem(analytics.scansByDevice),
      'Top Country': getTopItem(analytics.scansByCountry),
      'Top Browser': getTopItem(analytics.scansByBrowser),
      'Top OS': getTopItem(analytics.scansByOS)
    }
  })
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  
  // Detailed scans sheet (if any QR code has scans)
  const allScans = exportData
    .filter(qrCode => qrCode.scans && qrCode.scans.length > 0)
    .flatMap(qrCode => 
      qrCode.scans.map((scan: any) => ({
        'QR Code ID': qrCode.id,
        'QR Code Title': qrCode.title,
        'Scanned At': scan.scannedAt,
        'Device': scan.device,
        'Browser': scan.browser,
        'OS': scan.os,
        'Country': scan.country,
        'City': scan.city,
        'AB Test Variant': scan.abTestVariant
      }))
    )
  
  if (allScans.length > 0) {
    const scansSheet = XLSX.utils.json_to_sheet(allScans)
    XLSX.utils.book_append_sheet(workbook, scansSheet, 'Detailed Scans')
  }
  
  // Generate Excel buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

// Helper function to get top item from analytics object
function getTopItem(analyticsObject: any): string {
  if (!analyticsObject || typeof analyticsObject !== 'object') {
    return 'N/A'
  }
  
  const entries = Object.entries(analyticsObject)
  if (entries.length === 0) {
    return 'N/A'
  }
  
  const sorted = entries.sort((a: any, b: any) => b[1] - a[1])
  return sorted[0][0]
}
