"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  File, 
  Trash2, 
  Download,
  HardDrive,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface FileData {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  publicUrl: string
  downloadCount: number
  createdAt: string
  qrCodeId?: string | null
}

interface StorageUsage {
  usedBytes: number
  usedMB: number
  limitMB: number
  limitBytes: number
}

interface FileManagerProps {
  onFileSelect?: (fileId: string | null) => void
  selectedFileId?: string | null
  qrCodeId?: string | null
}

export default function FileManager({ onFileSelect, selectedFileId, qrCodeId }: FileManagerProps) {
  const [files, setFiles] = useState<FileData[]>([])
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeId])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const url = qrCodeId 
        ? `/api/files?qrCodeId=${qrCodeId}`
        : "/api/files"
      
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to load files")
      
      const data = await response.json()
      setFiles(data.files || [])
      setStorageUsage(data.storageUsage || null)
    } catch (error) {
      console.error("Error loading files:", error)
      toast.error("Failed to load files")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 50MB limit")
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append("file", file)
      if (qrCodeId) {
        formData.append("qrCodeId", qrCodeId)
      }

      // Simulate progress (actual upload progress would need XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload file")
      }

      toast.success("File uploaded successfully")
      loadFiles()
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteFile = async () => {
    if (!deleteFileId) return

    try {
      const response = await fetch(`/api/files/${deleteFileId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete file")
      }

      toast.success("File deleted successfully")
      setDeleteFileId(null)
      loadFiles()
      
      // Clear selection if deleted file was selected
      if (selectedFileId === deleteFileId && onFileSelect) {
        onFileSelect(null)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete file")
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️"
    if (mimeType.startsWith("video/")) return "🎥"
    if (mimeType.includes("pdf")) return "📄"
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝"
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊"
    return "📎"
  }

  const storagePercentage = storageUsage
    ? Math.round((storageUsage.usedBytes / storageUsage.limitBytes) * 100)
    : 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading files...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Files</CardTitle>
              <CardDescription>Upload and manage files for your QR codes</CardDescription>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="*/*"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Usage */}
          {storageUsage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span>Storage Usage</span>
                </div>
                <span className="font-medium">
                  {storageUsage.usedMB.toFixed(2)} MB / {storageUsage.limitMB} MB
                </span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
              {storagePercentage >= 90 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Storage almost full. Consider upgrading your plan.</span>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Files List */}
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload files to link them to your QR codes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    selectedFileId === file.id
                      ? "bg-primary/10 border-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => onFileSelect?.(file.id)}
                        className="text-left w-full"
                      >
                        <div className="font-medium truncate">{file.originalName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.mimeType}
                        </div>
                      </button>
                    </div>
                    {file.downloadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {file.downloadCount} downloads
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.publicUrl, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteFileId(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteFileId !== null}
        onOpenChange={(open) => !open && setDeleteFileId(null)}
        onConfirm={handleDeleteFile}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone. If this file is linked to any QR codes, make sure to unlink it first."
      />
    </>
  )
}

