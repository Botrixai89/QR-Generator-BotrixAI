"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Folder, 
  FolderPlus, 
  Edit, 
  Trash2, 
  FolderOpen
} from "lucide-react"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface FolderData {
  id: string
  name: string
  description?: string | null
  color?: string | null
  parentFolderId?: string | null
  createdAt: string
  updatedAt: string
}

interface FolderManagerProps {
  onFolderSelect?: (folderId: string | null) => void
  selectedFolderId?: string | null
}

export default function FolderManager({ onFolderSelect, selectedFolderId }: FolderManagerProps) {
  const [folders, setFolders] = useState<FolderData[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null)
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  })

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/folders")
      if (!response.ok) throw new Error("Failed to load folders")
      
      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error("Error loading folders:", error)
      toast.error("Failed to load folders")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      toast.error("Folder name is required")
      return
    }

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create folder")
      }

      toast.success("Folder created successfully")
      setIsCreateDialogOpen(false)
      setFormData({ name: "", description: "", color: "#3b82f6" })
      loadFolders()
    } catch (error) {
      console.error("Error creating folder:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create folder")
    }
  }

  const handleEditFolder = async () => {
    if (!editingFolder || !formData.name.trim()) {
      toast.error("Folder name is required")
      return
    }

    try {
      const response = await fetch(`/api/folders/${editingFolder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update folder")
      }

      toast.success("Folder updated successfully")
      setIsEditDialogOpen(false)
      setEditingFolder(null)
      setFormData({ name: "", description: "", color: "#3b82f6" })
      loadFolders()
    } catch (error) {
      console.error("Error updating folder:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update folder")
    }
  }

  const handleDeleteFolder = async () => {
    if (!deleteFolderId) return

    try {
      const response = await fetch(`/api/folders/${deleteFolderId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete folder")
      }

      toast.success("Folder deleted successfully")
      setDeleteFolderId(null)
      loadFolders()
      
      // Clear selection if deleted folder was selected
      if (selectedFolderId === deleteFolderId && onFolderSelect) {
        onFolderSelect(null)
      }
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete folder")
    }
  }

  const openEditDialog = (folder: FolderData) => {
    setEditingFolder(folder)
    setFormData({
      name: folder.name,
      description: folder.description || "",
      color: folder.color || "#3b82f6"
    })
    setIsEditDialogOpen(true)
  }

  const rootFolders = folders.filter(f => !f.parentFolderId)

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading folders...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-gray-100">Folders</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Organize your QR codes into folders</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rootFolders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400 dark:text-gray-500" />
              <p>No folders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {onFolderSelect && (
                <Button
                  variant={selectedFolderId === null ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => onFolderSelect(null)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  All QR Codes
                </Button>
              )}
              {rootFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    selectedFolderId === folder.id
                      ? "bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600"
                      : "bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: folder.color || "#3b82f6" }}
                    />
                    <button
                      onClick={() => onFolderSelect?.(folder.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <Folder className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{folder.name}</span>
                      {folder.description && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          - {folder.description}
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(folder)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteFolderId(folder.id)}
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

      {/* Create Folder Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your QR codes by creating folders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name *</Label>
              <Input
                id="folder-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Marketing, Events, Products"
              />
            </div>
            <div>
              <Label htmlFor="folder-description">Description</Label>
              <Textarea
                id="folder-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="folder-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="folder-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-folder-name">Folder Name *</Label>
              <Input
                id="edit-folder-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Marketing, Events, Products"
              />
            </div>
            <div>
              <Label htmlFor="edit-folder-description">Description</Label>
              <Textarea
                id="edit-folder-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-folder-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-folder-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditFolder}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteFolderId !== null}
        onOpenChange={(open) => !open && setDeleteFolderId(null)}
        onConfirm={handleDeleteFolder}
        title="Delete Folder"
        description="Are you sure you want to delete this folder? This action cannot be undone. Make sure the folder is empty (no QR codes or subfolders)."
      />
    </>
  )
}

