'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Webhook,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface WebhookConfig {
  qrCodeId: string
  qrCodeTitle: string | null
  webhookUrl: string | null
  hasSecret: boolean
  createdAt: string
}

interface WebhookLog {
  id: string
  qrCodeId: string
  webhookUrl: string
  payload: Record<string, unknown>
  responseStatus: number | null
  responseBody: string | null
  attempts: number
  lastAttemptAt: string
  isSuccessful: boolean
  createdAt: string
}

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [selectedQrCodeId, setSelectedQrCodeId] = useState<string | null>(null)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)

  const loadWebhooks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/webhooks', {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      })

      if (!res.ok) {
        throw new Error('Failed to load webhooks')
      }

      const data = (await res.json()) as { webhooks?: WebhookConfig[] }
      setWebhooks(data.webhooks || [])
    } catch {
      console.error('Error loading webhooks')
      toast.error('Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  const loadWebhookLogs = useCallback(async (qrCodeId: string) => {
    try {
      const res = await fetch(`/api/v1/webhooks/${qrCodeId}/logs`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      })

      if (!res.ok) {
        throw new Error('Failed to load webhook logs')
      }

      const data = (await res.json()) as { logs?: WebhookLog[] }
      setLogs(data.logs || [])
    } catch {
      console.error('Error loading webhook logs')
      toast.error('Failed to load webhook logs')
    }
  }, [apiKey])

  useEffect(() => {
    loadWebhooks()
  }, [loadWebhooks])

  useEffect(() => {
    if (selectedQrCodeId) {
      loadWebhookLogs(selectedQrCodeId)
    }
  }, [selectedQrCodeId, loadWebhookLogs])

  const handleCreateWebhook = async (qrCodeId: string, webhookUrl: string) => {
    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ qrCodeId, webhookUrl, regenerateSecret: true }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create webhook')
      }

      const data = await res.json()
      toast.success('Webhook created successfully')
      if (data.secret) {
        toast.info(`Secret: ${data.secret}`, { duration: 10000 })
      }
      await loadWebhooks()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create webhook'
      toast.error(message)
    }
  }

  const handleUpdateWebhook = async (
    qrCodeId: string,
    webhookUrl: string,
    regenerateSecret: boolean = false
  ) => {
    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ qrCodeId, webhookUrl, regenerateSecret }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update webhook')
      }

      const data = await res.json()
      toast.success('Webhook updated successfully')
      if (data.secret && regenerateSecret) {
        toast.info(`New secret: ${data.secret}`, { duration: 10000 })
      }
      await loadWebhooks()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update webhook'
      toast.error(message)
    }
  }

  const handleDeleteWebhook = async (qrCodeId: string) => {
    try {
      const res = await fetch(`/api/v1/webhooks?qrCodeId=${qrCodeId}`, {
        method: 'DELETE',
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      })

      if (!res.ok) throw new Error('Failed to delete webhook')

      toast.success('Webhook deleted')
      await loadWebhooks()
      if (selectedQrCodeId === qrCodeId) {
        setSelectedQrCodeId(null)
        setLogs([])
      }
    } catch {
      toast.error('Failed to delete webhook')
    }
  }

  const handleRetryWebhook = async (logId: string) => {
    if (!selectedQrCodeId) return

    try {
      const res = await fetch(`/api/v1/webhooks/${selectedQrCodeId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ logId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to retry webhook')
      }

      toast.success('Webhook retry queued')
      await loadWebhookLogs(selectedQrCodeId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry webhook'
      toast.error(message)
    }
  }

  if (loading) {
    return <div>Loading webhooks...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Webhook Management</h2>
          <p className="text-muted-foreground">
            Configure webhooks for your QR codes and monitor delivery
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="password"
            placeholder="API Key (optional)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No webhooks configured</p>
            <p className="text-sm text-muted-foreground">
              Create webhooks to receive real-time notifications when QR codes are scanned
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Webhook Configurations</h3>
            {webhooks.map((webhook) => (
              <Card key={webhook.qrCodeId}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{webhook.qrCodeTitle || 'Untitled QR Code'}</span>
                    <Badge variant={webhook.webhookUrl ? 'default' : 'secondary'}>
                      {webhook.webhookUrl ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {webhook.webhookUrl && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                      <p className="text-sm font-mono break-all">{webhook.webhookUrl}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <WebhookConfigDialog
                      qrCodeId={webhook.qrCodeId}
                      initialUrl={webhook.webhookUrl || ''}
                      hasSecret={webhook.hasSecret}
                      onSave={webhook.webhookUrl ? handleUpdateWebhook : handleCreateWebhook}
                    />
                    {webhook.webhookUrl && (
                      <>
                        <RegenerateSecretDialog
                          qrCodeId={webhook.qrCodeId}
                          onRegenerate={handleUpdateWebhook}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteDialogOpen(webhook.qrCodeId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQrCodeId(webhook.qrCodeId)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delivery Logs</h3>
            {selectedQrCodeId ? (
              <WebhookLogsView
                logs={logs}
                onRetry={handleRetryWebhook}
                onClose={() => setSelectedQrCodeId(null)}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a webhook to view delivery logs
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {webhooks.map((webhook) => (
        <ConfirmationDialog
          key={`delete-${webhook.qrCodeId}`}
          open={deleteDialogOpen === webhook.qrCodeId}
          onOpenChange={(open) => setDeleteDialogOpen(open ? webhook.qrCodeId : null)}
          title="Delete Webhook"
          description="Are you sure you want to remove this webhook configuration?"
          onConfirm={() => handleDeleteWebhook(webhook.qrCodeId)}
          variant="destructive"
        />
      ))}
    </div>
  )
}

function WebhookConfigDialog({
  qrCodeId,
  initialUrl,
  hasSecret,
  onSave,
}: {
  qrCodeId: string
  initialUrl: string
  hasSecret: boolean
  onSave: (qrCodeId: string, webhookUrl: string, regenerateSecret?: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState(initialUrl)
  const [regenerateSecret, setRegenerateSecret] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!webhookUrl) {
      toast.error('Webhook URL is required')
      return
    }
    try {
      new URL(webhookUrl)
      onSave(qrCodeId, webhookUrl, regenerateSecret)
      setOpen(false)
    } catch {
      toast.error('Invalid URL')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {initialUrl ? 'Edit' : 'Configure'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialUrl ? 'Edit Webhook' : 'Configure Webhook'}</DialogTitle>
          <DialogDescription>
            Set up a webhook URL to receive notifications when this QR code is scanned
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/webhook"
              required
            />
          </div>
          {initialUrl && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="regenerateSecret"
                checked={regenerateSecret}
                onChange={(e) => setRegenerateSecret(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="regenerateSecret" className="font-normal cursor-pointer">
                Regenerate signing secret
              </Label>
            </div>
          )}
          {hasSecret && (
            <div className="text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Note: If you regenerate the secret, update your webhook endpoint with the new
              secret.
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RegenerateSecretDialog({
  qrCodeId,
  onRegenerate,
}: {
  qrCodeId: string
  onRegenerate: (
    qrCodeId: string,
    webhookUrl: string,
    regenerateSecret: boolean
  ) => void
}) {
  const [open, setOpen] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => {
    // Fetch current webhook URL
    fetch(`/api/v1/webhooks?qrCodeId=${qrCodeId}`)
      .then((res) => res.json())
      .then((data) => {
        const webhook = (data.webhooks as WebhookConfig[] | undefined)?.find((w) => w.qrCodeId === qrCodeId)
        if (webhook) {
          setWebhookUrl(webhook.webhookUrl || '')
        }
      })
      .catch(console.error)
  }, [qrCodeId])

  const handleRegenerate = () => {
    if (webhookUrl) {
      onRegenerate(qrCodeId, webhookUrl, true)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Rotate Secret
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate Webhook Secret</DialogTitle>
          <DialogDescription>
            This will generate a new signing secret. Make sure to update your webhook endpoint
            with the new secret.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleRegenerate}>
            Regenerate Secret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WebhookLogsView({
  logs,
  onRetry,
  onClose,
}: {
  logs: WebhookLog[]
  onRetry: (logId: string) => void
  onClose: () => void
}) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No delivery logs yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Delivery Logs</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {log.isSuccessful ? (
                    <Badge variant="default">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  {log.responseStatus && (
                    <Badge variant="outline">{log.responseStatus}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {log.attempts} {log.attempts === 1 ? 'attempt' : 'attempts'}
                  </span>
                </div>
                {!log.isSuccessful && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(log.id)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
                {log.webhookUrl && (
                  <p className="font-mono text-xs break-all mt-1">{log.webhookUrl}</p>
                )}
                {log.responseBody && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Response
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {log.responseBody}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

