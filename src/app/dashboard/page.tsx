"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  QrCode, 
  Download, 
  Calendar, 
  BarChart3, 
  Plus,
  Trash2,
  Eye,
  Zap
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type QRCodeStyling from "qr-code-styling"
import { loadQRCodeStyling } from "@/lib/qr-loader"
import DynamicQRManager from "@/components/dynamic-qr-manager"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { addBotrixLogoToQR } from "@/lib/qr-watermark"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FolderManager from "@/components/folder-manager"
import FileManager from "@/components/file-manager"

interface QRCodeData {
  id: string
  url: string
  originalUrl?: string
  title: string
  foregroundColor: string
  backgroundColor: string
  dotType: string
  cornerType: string
  hasWatermark: boolean
  downloadCount: number
  createdAt: string
  updatedAt: string
  logoUrl?: string
  isDynamic?: boolean
  isActive?: boolean
  scanCount?: number
  lastScannedAt?: string | null
  dynamicContent?: Record<string, unknown>
  redirectUrl?: string
  expiresAt?: string
  maxScans?: number
  folderId?: string | null
  fileId?: string | null
  // Advanced features
  shape?: string
  template?: string
  eyePattern?: string
  gradient?: Record<string, unknown>
  sticker?: Record<string, unknown>
  effects?: Record<string, unknown>
  customStyling?: Record<string, unknown>
}

// QR Code Preview Component
function QRCodePreview({ qrCode }: { qrCode: QRCodeData }) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && qrRef.current) {
      const formattedBackgroundColor = qrCode.backgroundColor.startsWith('#') 
        ? qrCode.backgroundColor 
        : `#${qrCode.backgroundColor}`
      
      if (qrCodeRef.current) {
        qrCodeRef.current = null
      }
      
      qrRef.current.innerHTML = ""
      
      // Load QRCodeStyling dynamically
      loadQRCodeStyling()
        .then((QRCodeStylingClass) => {
          if (!QRCodeStylingClass) {
            throw new Error('QRCodeStyling not available on server')
          }
          
          // For dynamic QR codes, use the redirect URL if available, otherwise use the QR code URL
          const qrData = qrCode.isDynamic 
            ? (qrCode.redirectUrl || `${window.location.origin}/qr/${qrCode.id}`)
            : qrCode.url

          qrCodeRef.current = new QRCodeStylingClass({
            width: 80,
            height: 80,
            type: "svg",
            data: qrData,
            image: qrCode.logoUrl || undefined,
            dotsOptions: {
              color: qrCode.foregroundColor,
              type: qrCode.dotType as 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded',
            },
            backgroundOptions: {
              color: formattedBackgroundColor,
            },
            cornersSquareOptions: {
              color: qrCode.foregroundColor,
              type: qrCode.cornerType as 'square' | 'dot' | 'extra-rounded',
            },
            cornersDotOptions: {
              color: qrCode.foregroundColor,
              type: qrCode.dotType as 'square' | 'dot',
            },
          })
          
          if (qrCodeRef.current && qrRef.current) {
            qrCodeRef.current.append(qrRef.current)
            
            // Add watermark after QR code is rendered
            setTimeout(() => {
              if (qrRef.current && qrCode.hasWatermark) {
                const svg = qrRef.current.querySelector('svg')
                if (svg) {
                  addBotrixLogoToQR(svg)
                }
              }
            }, 200)
          }
        })
        .catch((error) => {
          console.error("Error creating QR code preview:", error)
          if (qrRef.current) {
            qrRef.current.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 80px; color: #666; font-size: 12px;">Error</div>`
          }
        })
    }
  }, [isClient, qrCode])

  if (!isClient) {
    return <div className="w-20 h-20 bg-gray-100 rounded animate-pulse" />
  }

  return (
    <div 
      ref={qrRef}
      className="w-20 h-20 border rounded bg-white flex-shrink-0"
    />
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [stats, setStats] = useState({
    totalCodes: 0,
    totalDownloads: 0,
    thisMonth: 0,
    lastMonth: 0
  })
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [userPlan, setUserPlan] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    qrCode: QRCodeData | null
    isDeleting: boolean
  }>({
    open: false,
    qrCode: null,
    isDeleting: false
  })
  const [analyticsDialog, setAnalyticsDialog] = useState<{
    open: boolean
    qrCode: QRCodeData | null
    isLoading: boolean
    data: Record<string, unknown> | null
  }>({ open: false, qrCode: null, isLoading: false, data: null })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    const user = session?.user as { id?: string } | undefined
    if (user?.id) {
      fetchQrCodes()
      fetchUserCredits()
    }
  }, [session])

  const fetchQrCodes = async () => {
    try {
      const response = await fetch("/api/qr-codes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json() as QRCodeData[]
        setQrCodes(data)
        
        // Calculate stats
        const totalCodes = data.length
        const totalDownloads = data.reduce((sum: number, code: QRCodeData) => sum + code.downloadCount, 0)
        const thisMonth = data.filter((code: QRCodeData) => {
          const createdDate = new Date(code.createdAt)
          const now = new Date()
          return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
        }).length
        
        const lastMonth = data.filter((code: QRCodeData) => {
          const createdDate = new Date(code.createdAt)
          const now = new Date()
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1)
          return createdDate.getMonth() === lastMonthDate.getMonth() && createdDate.getFullYear() === lastMonthDate.getFullYear()
        }).length

        setStats({
          totalCodes,
          totalDownloads,
          thisMonth,
          lastMonth
        })
      } else {
        const errorData = await response.json() as { error?: string }
        toast.error(errorData.error || "Failed to load QR codes")
      }
    } catch (error) {
      console.error("Error fetching QR codes:", error)
      toast.error("Failed to load QR codes")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const response = await fetch("/api/user/credits", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json() as { credits?: number; plan?: string }
        setUserCredits(data.credits ?? null)
        setUserPlan(data.plan || 'FREE')
      } else {
        console.error("Failed to fetch user credits")
      }
    } catch (error) {
      console.error("Error fetching user credits:", error)
    }
  }

  const handleDeleteClick = (qrCode: QRCodeData) => {
    setDeleteDialog({
      open: true,
      qrCode,
      isDeleting: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.qrCode) return

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }))

    try {
      const response = await fetch(`/api/qr-codes/${deleteDialog.qrCode.id}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        setQrCodes(qrCodes.filter(code => code.id !== deleteDialog.qrCode!.id))
        toast.success("QR code deleted successfully")
        setDeleteDialog({
          open: false,
          qrCode: null,
          isDeleting: false
        })
      } else {
        toast.error("Failed to delete QR code")
        setDeleteDialog(prev => ({ ...prev, isDeleting: false }))
      }
    } catch (error) {
      console.error("Error deleting QR code:", error)
      toast.error("Failed to delete QR code")
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const openAnalytics = async (qrCode: QRCodeData) => {
    setAnalyticsDialog({ open: true, qrCode, isLoading: true, data: null })
    try {
      const res = await fetch(`/api/qr-codes/${qrCode.id}/scan`)
      if (res.ok) {
        const data = await res.json() as Record<string, unknown>
        setAnalyticsDialog(prev => ({ ...prev, isLoading: false, data }))
      } else {
        setAnalyticsDialog(prev => ({ ...prev, isLoading: false }))
        toast.error("Failed to load analytics")
      }
    } catch {
      setAnalyticsDialog(prev => ({ ...prev, isLoading: false }))
      toast.error("Failed to load analytics")
    }
  }

  if (!isClient || status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user?.name || session.user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {userCredits !== null && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Credits: {userCredits}
                </span>
                {userCredits <= 5 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/pricing">
                      Buy More
                    </Link>
                  </Button>
                )}
              </div>
            )}
            {userPlan && (
              <div className="hidden sm:flex flex-col gap-1 bg-amber-50 px-3 py-2 rounded-lg min-w-[220px]">
                <div className="flex items-center justify-between text-xs text-amber-900">
                  <span>Plan: <strong>{userPlan}</strong></span>
                  <Link className="underline" href="/pricing">Upgrade</Link>
                </div>
                {(() => {
                  const maxByPlan: Record<string, number> = { FREE: 10, FLEX: 100, PRO: 1000, BUSINESS: 10000 }
                  const max = maxByPlan[userPlan] ?? 10
                  const used = stats.totalCodes
                  const pct = Math.min(100, Math.round((used / max) * 100))
                  return (
                    <div className="space-y-1">
                      <Progress value={pct} />
                      <div className="text-[11px] text-amber-900">{used} / {max} QR codes</div>
                    </div>
                  )
                })()}
              </div>
            )}
            <Button asChild>
              <Link href="/">
                <Plus className="h-4 w-4 mr-2" />
                Create QR Code
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCodes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.thisMonth} created this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">
                Across all your codes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                QR codes created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastMonth > 0 
                  ? `${Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)}%`
                  : "0%"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                vs last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="qr-codes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          {/* QR Codes Tab */}
          <TabsContent value="qr-codes" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Folder Manager Sidebar */}
              <div className="lg:col-span-1">
                <FolderManager
                  onFolderSelect={setSelectedFolderId}
                  selectedFolderId={selectedFolderId}
                />
              </div>

              {/* QR Codes List */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Your QR Codes</CardTitle>
                        <CardDescription>
                          {selectedFolderId 
                            ? "QR codes in selected folder"
                            : "Manage and track all your generated QR codes"
                          }
                        </CardDescription>
                      </div>
                      <Button asChild>
                        <Link href="/">
                          <Plus className="h-4 w-4 mr-2" />
                          Create QR Code
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const filteredCodes = selectedFolderId
                        ? qrCodes.filter(code => code.folderId === selectedFolderId)
                        : qrCodes

                      return filteredCodes.length === 0 ? (
                        <div className="text-center py-12">
                          <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">
                            {selectedFolderId ? "No QR codes in this folder" : "No QR codes yet"}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {selectedFolderId 
                              ? "Move QR codes to this folder or create new ones"
                              : "Create your first QR code to get started"
                            }
                          </p>
                          <Button asChild>
                            <Link href="/">
                              <Plus className="h-4 w-4 mr-2" />
                              Create QR Code
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredCodes.map((qrCode) => (
                  qrCode.isDynamic ? (
                    <DynamicQRManager 
                      key={qrCode.id} 
                      qrCode={qrCode} 
                      onUpdate={fetchQrCodes}
                    />
                  ) : (
                    <div key={qrCode.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-4 flex-1 min-w-0">
                          <QRCodePreview qrCode={qrCode} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-medium truncate">{qrCode.title}</h3>
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {qrCode.dotType}
                                </Badge>
                                {qrCode.hasWatermark && (
                                  <Badge variant="outline" className="text-xs">Watermarked</Badge>
                                )}
                                {qrCode.template && (
                                  <Badge variant="outline" className="text-xs">Template</Badge>
                                )}
                                {qrCode.shape && qrCode.shape !== 'square' && (
                                  <Badge variant="outline" className="text-xs">{qrCode.shape}</Badge>
                                )}
                                {qrCode.gradient && (
                                  <Badge variant="outline" className="text-xs">Gradient</Badge>
                                )}
                                {qrCode.sticker && (
                                  <Badge variant="outline" className="text-xs">Sticker</Badge>
                                )}
                                {qrCode.effects && (
                                  <Badge variant="outline" className="text-xs">Effects</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {qrCode.downloadCount} downloads
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(qrCode.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/qr/${qrCode.id}?preview=true`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openAnalytics(qrCode)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openAnalytics(qrCode)}
                          >
                            Download Stats
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(qrCode)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                          )
                        ))}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Folders Tab */}
          <TabsContent value="folders">
            <FolderManager />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <FileManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete QR Code"
        description={`Are you sure you want to delete "${deleteDialog.qrCode?.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteDialog.isDeleting}
        variant="destructive"
      />

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialog.open} onOpenChange={(open) => setAnalyticsDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analytics</DialogTitle>
            <DialogDescription>
              {analyticsDialog.qrCode ? analyticsDialog.qrCode.title : "Loading..."}
            </DialogDescription>
          </DialogHeader>
          {analyticsDialog.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading analytics…</div>
          ) : analyticsDialog.data ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <span>Downloads: <strong>{analyticsDialog.qrCode?.downloadCount ?? 0}</strong></span>
                <span>Scans: <strong>{((analyticsDialog.data.qrCode as { scanCount?: number } | undefined)?.scanCount) ?? ((analyticsDialog.data.analytics as { totalScans?: number } | undefined)?.totalScans) ?? 0}</strong></span>
                <span>Last Scanned: <strong>{analyticsDialog.qrCode?.lastScannedAt ? new Date(analyticsDialog.qrCode.lastScannedAt).toLocaleString() : "Never"}</strong></span>
              </div>
              {((analyticsDialog.data.analytics as { scans?: unknown[] } | undefined)?.scans?.length) ? (
                <div className="max-h-64 overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="p-2">Time</th>
                        <th className="p-2">Device</th>
                        <th className="p-2">Browser</th>
                        <th className="p-2">Country</th>
                        <th className="p-2">City</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((analyticsDialog.data.analytics as { scans?: Array<{ createdAt?: string; device?: string; browser?: string; country?: string; city?: string }> })?.scans || []).map((s, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}</td>
                          <td className="p-2">{s.device || "-"}</td>
                          <td className="p-2">{s.browser || "-"}</td>
                          <td className="p-2">{s.country || "-"}</td>
                          <td className="p-2">{s.city || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No scans yet.</div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">No analytics available.</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyticsDialog(prev => ({ ...prev, open: false }))}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
