"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { 
  Edit, 
  Eye, 
  Trash2, 
  BarChart3, 
  Copy, 
  ExternalLink, 
  Calendar,
  Users,
  Zap,
  Link
} from "lucide-react"

interface DynamicQRCode {
  id: string
  title: string
  url: string
  isDynamic?: boolean
  isActive?: boolean
  scanCount?: number
  createdAt: string
  lastScannedAt?: string | null
  dynamicContent?: any
  redirectUrl?: string
  expiresAt?: string
  maxScans?: number
}

interface DynamicQRManagerProps {
  qrCode: DynamicQRCode
  onUpdate: () => void
}

export default function DynamicQRManager({ qrCode, onUpdate }: DynamicQRManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editData, setEditData] = useState({
    title: qrCode.title,
    url: qrCode.url,
    redirectUrl: qrCode.redirectUrl || "",
    dynamicContent: qrCode.dynamicContent ? JSON.stringify(qrCode.dynamicContent, null, 2) : "",
    isActive: qrCode.isActive ?? true,
    expiresAt: qrCode.expiresAt ? new Date(qrCode.expiresAt).toISOString().slice(0, 16) : "",
    maxScans: qrCode.maxScans?.toString() || ""
  })

  const [analytics, setAnalytics] = useState<any>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    isDeleting: boolean
  }>({
    open: false,
    isDeleting: false
  })

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/qr-codes/${qrCode.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editData.title,
          url: editData.url,
          redirectUrl: editData.redirectUrl,
          dynamicContent: editData.dynamicContent,
          isActive: editData.isActive,
          expiresAt: editData.expiresAt,
          maxScans: editData.maxScans ? parseInt(editData.maxScans) : null
        })
      })

      if (response.ok) {
        const { toast } = await import("sonner")
        toast.success("QR code updated successfully!")
        setIsEditing(false)
        onUpdate()
      } else {
        const errorData = await response.json()
        const { toast } = await import("sonner")
        toast.error(errorData.error || "Failed to update QR code")
      }
    } catch (error) {
      console.error("Error updating QR code:", error)
      const { toast } = await import("sonner")
      toast.error("Failed to update QR code")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClick = () => {
    setDeleteDialog({
      open: true,
      isDeleting: false
    })
  }

  const handleDeleteConfirm = async () => {
    setDeleteDialog(prev => ({ ...prev, isDeleting: true }))

    try {
      const response = await fetch(`/api/qr-codes/${qrCode.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const { toast } = await import("sonner")
        toast.success("QR code deleted successfully!")
        setDeleteDialog({
          open: false,
          isDeleting: false
        })
        onUpdate()
      } else {
        const errorData = await response.json()
        const { toast } = await import("sonner")
        toast.error(errorData.error || "Failed to delete QR code")
        setDeleteDialog(prev => ({ ...prev, isDeleting: false }))
      }
    } catch (error) {
      console.error("Error deleting QR code:", error)
      const { toast } = await import("sonner")
      toast.error("Failed to delete QR code")
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleCopyLink = async () => {
    const qrLink = `${window.location.origin}/qr/${qrCode.id}`
    navigator.clipboard.writeText(qrLink)
    const { toast } = await import("sonner")
    toast.success("QR code link copied to clipboard!")
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/qr-codes/${qrCode.id}/scan`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const getStatusBadge = () => {
    if (!qrCode.isActive) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (qrCode.maxScans && (qrCode.scanCount ?? 0) >= qrCode.maxScans) {
      return <Badge variant="destructive">Limit Reached</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {qrCode.isDynamic && <Zap className="h-4 w-4 text-yellow-500" />}
              {qrCode.title}
            </CardTitle>
            <CardDescription>
              Created {new Date(qrCode.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {qrCode.isDynamic && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Dynamic
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* QR Code Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Scans</div>
              <div className="font-medium">{qrCode.scanCount ?? 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Type</div>
              <div className="font-medium">{qrCode.isDynamic ? 'Dynamic' : 'Static'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium">{qrCode.isActive ? 'Active' : 'Inactive'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Scanned</div>
              <div className="font-medium">
                {qrCode.lastScannedAt 
                  ? new Date(qrCode.lastScannedAt).toLocaleDateString()
                  : 'Never'
                }
              </div>
            </div>
          </div>

          {/* Dynamic QR Code Specific Info */}
          {qrCode.isDynamic && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Link className="h-4 w-4" />
                Dynamic Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {qrCode.redirectUrl && (
                  <div>
                    <div className="text-muted-foreground">Redirect URL</div>
                    <div className="font-medium truncate">{qrCode.redirectUrl}</div>
                  </div>
                )}
                {qrCode.expiresAt && (
                  <div>
                    <div className="text-muted-foreground">Expires</div>
                    <div className="font-medium">{new Date(qrCode.expiresAt).toLocaleDateString()}</div>
                  </div>
                )}
                {qrCode.maxScans && (
                  <div>
                    <div className="text-muted-foreground">Max Scans</div>
                    <div className="font-medium">{qrCode.maxScans}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/qr/${qrCode.id}?preview=true`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Preview
            </Button>

            {qrCode.isDynamic && (
              <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>QR Code Analytics</DialogTitle>
                    <DialogDescription>
                      Detailed analytics for {qrCode.title}
                    </DialogDescription>
                  </DialogHeader>
                  {analytics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{analytics.totalScans}</div>
                          <div className="text-sm text-muted-foreground">Total Scans</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{analytics.uniqueDevices}</div>
                          <div className="text-sm text-muted-foreground">Unique Devices</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{analytics.uniqueCountries}</div>
                          <div className="text-sm text-muted-foreground">Countries</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{analytics.uniqueCities}</div>
                          <div className="text-sm text-muted-foreground">Cities</div>
                        </div>
                      </div>
                      
                      {Object.keys(analytics.scansByDevice).length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Scans by Device</h4>
                          <div className="space-y-1">
                            {Object.entries(analytics.scansByDevice).map(([device, count]) => (
                              <div key={device} className="flex justify-between text-sm">
                                <span>{device}</span>
                                <span className="font-medium">{count as number}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit QR Code</DialogTitle>
                  <DialogDescription>
                    Update the settings for {qrCode.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editData.title}
                      onChange={(e) => setEditData({...editData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-url">URL</Label>
                    <Input
                      id="edit-url"
                      value={editData.url}
                      onChange={(e) => setEditData({...editData, url: e.target.value})}
                    />
                  </div>

                  {qrCode.isDynamic && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="edit-redirect">Redirect URL</Label>
                        <Input
                          id="edit-redirect"
                          value={editData.redirectUrl}
                          onChange={(e) => setEditData({...editData, redirectUrl: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-content">Dynamic Content (JSON)</Label>
                        <Textarea
                          id="edit-content"
                          value={editData.dynamicContent}
                          onChange={(e) => setEditData({...editData, dynamicContent: e.target.value})}
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-expires">Expiration Date</Label>
                          <Input
                            id="edit-expires"
                            type="datetime-local"
                            value={editData.expiresAt}
                            onChange={(e) => setEditData({...editData, expiresAt: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-max-scans">Max Scans</Label>
                          <Input
                            id="edit-max-scans"
                            type="number"
                            value={editData.maxScans}
                            onChange={(e) => setEditData({...editData, maxScans: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">
                        QR code is active and can be scanned
                      </p>
                    </div>
                    <Switch
                      checked={editData.isActive}
                      onCheckedChange={(checked) => setEditData({...editData, isActive: checked})}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleUpdate} disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Update QR Code"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClick}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete QR Code"
        description={`Are you sure you want to delete "${qrCode.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteDialog.isDeleting}
        variant="destructive"
      />
    </Card>
  )
}
