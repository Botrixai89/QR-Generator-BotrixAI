'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Key,
  Copy,
  Trash2,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  userId: string | null
  organizationId: string | null
}

export default function ApiKeysManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)

  useEffect(() => {
    loadApiKeys()
  }, [organizationId])

  const loadApiKeys = async () => {
    try {
      const url = organizationId
        ? `/api/api-keys?organizationId=${organizationId}`
        : '/api/api-keys'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load API keys')
      const data = await res.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error('Error loading API keys:', error)
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (name: string, scopes: string[], expiresAt?: string) => {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scopes, organizationId, expiresAt }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create API key')
      }

      const data = await res.json()
      setNewKeyValue(data.key)
      setNewKeyDialogOpen(true)
      toast.success('API key created successfully')
      await loadApiKeys()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create API key')
    }
  }

  const handleRotateKey = async (keyId: string, name?: string) => {
    try {
      const res = await fetch(`/api/api-keys/${keyId}/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, deactivateOld: true }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to rotate API key')
      }

      const data = await res.json()
      setNewKeyValue(data.key)
      setNewKeyDialogOpen(true)
      toast.success('API key rotated successfully')
      await loadApiKeys()
    } catch (error: any) {
      toast.error(error.message || 'Failed to rotate API key')
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete API key')

      toast.success('API key deleted')
      await loadApiKeys()
    } catch (error) {
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (loading) {
    return <div>Loading API keys...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your API keys for programmatic access
          </p>
        </div>
        <CreateApiKeyDialog onCreate={handleCreateKey} />
      </div>

      {newKeyValue && (
        <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Save this API key now. You will not be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <code className="flex-1 text-sm font-mono">{newKeyValue}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newKeyValue)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewKeyDialogOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No API keys yet</p>
            <CreateApiKeyDialog onCreate={handleCreateKey} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{key.name}</h3>
                      {key.isActive ? (
                        <Badge variant="default">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                      {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                        <Badge variant="destructive">
                          <Clock className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mb-2">
                      {key.keyPrefix}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {key.lastUsedAt && (
                        <p>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</p>
                      )}
                      {key.expiresAt && (
                        <p>
                          Expires: {new Date(key.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                      <p>Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <RotateKeyDialog
                      keyId={key.id}
                      name={key.name}
                      onRotate={handleRotateKey}
                    />
                    <ConfirmationDialog
                      title="Delete API Key"
                      description="Are you sure you want to delete this API key? This action cannot be undone."
                      onConfirm={() => handleDeleteKey(key.id)}
                    >
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ConfirmationDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateApiKeyDialog({
  onCreate,
}: {
  onCreate: (name: string, scopes: string[], expiresAt?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState('')

  const availableScopes = [
    { value: 'qr:read', label: 'QR Codes: Read' },
    { value: 'qr:write', label: 'QR Codes: Write' },
    { value: 'qr:delete', label: 'QR Codes: Delete' },
    { value: 'scan:read', label: 'Scans: Read' },
    { value: 'webhook:read', label: 'Webhooks: Read' },
    { value: 'webhook:write', label: 'Webhooks: Write' },
    { value: 'webhook:delete', label: 'Webhooks: Delete' },
    { value: '*', label: 'All Permissions (Admin)' },
  ]

  const toggleScope = (scope: string) => {
    if (scope === '*') {
      setScopes(['*'])
    } else if (scopes.includes('*')) {
      setScopes([scope])
    } else if (scopes.includes(scope)) {
      setScopes(scopes.filter((s) => s !== scope))
    } else {
      setScopes([...scopes, scope])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || scopes.length === 0) {
      toast.error('Please provide a name and select at least one scope')
      return
    }
    onCreate(name, scopes, expiresAt || undefined)
    setName('')
    setScopes([])
    setExpiresAt('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key with specific permissions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API Key"
              required
            />
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="mt-2 space-y-2">
              {availableScopes.map((scope) => (
                <div key={scope.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={scope.value}
                    checked={scopes.includes(scope.value) || scopes.includes('*')}
                    onCheckedChange={() => toggleScope(scope.value)}
                  />
                  <Label htmlFor={scope.value} className="font-normal cursor-pointer">
                    {scope.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create API Key</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RotateKeyDialog({
  keyId,
  name,
  onRotate,
}: {
  keyId: string
  name: string
  onRotate: (keyId: string, name?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState(name)

  const handleRotate = () => {
    onRotate(keyId, newName !== name ? newName : undefined)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Rotate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rotate API Key</DialogTitle>
          <DialogDescription>
            This will create a new API key and deactivate the old one
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="newName">New Key Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={name}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleRotate}>
            Rotate Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

