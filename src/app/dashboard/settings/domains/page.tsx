"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  Globe, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Trash2,
  Settings,
  BarChart3
} from "lucide-react"
import Link from "next/link"

interface CustomDomain {
  id: string
  domain: string
  isVerified: boolean
  status: string
  sslEnabled: boolean
  sslStatus: string
  sslExpiresAt?: string
  verifiedAt?: string
  createdAt: string
  lastDnsCheck?: string
  errorMessage?: string
  routingConfig?: Record<string, unknown>
  custom404Page?: string
  customExpiryPage?: string
}

export default function DomainsSettingsPage() {
  const { status } = useSession()
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [addingDomain, setAddingDomain] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verificationInstructions, setVerificationInstructions] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      loadDomains()
    }
  }, [status])

  async function loadDomains() {
    setLoading(true)
    try {
      const response = await fetch('/api/custom-domains')
      if (response.ok) {
        const data = await response.json() as CustomDomain[] | CustomDomain
        setDomains(Array.isArray(data) ? data : [data].filter(Boolean))
      } else {
        toast.error('Failed to load domains')
      }
    } catch (error) {
      console.error('Error loading domains:', error)
      toast.error('Failed to load domains')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddDomain() {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    setAddingDomain(true)
    try {
      const response = await fetch('/api/custom-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim(),
          action: 'add'
        })
      })

      const data = await response.json() as { verificationInstructions?: Record<string, unknown>; error?: string }

      if (response.ok) {
        toast.success('Domain added successfully')
        setNewDomain("")
        setVerificationInstructions(data.verificationInstructions || null)
        await loadDomains()
      } else {
        toast.error(data.error || 'Failed to add domain')
      }
    } catch (error) {
      console.error('Error adding domain:', error)
      toast.error('Failed to add domain')
    } finally {
      setAddingDomain(false)
    }
  }

  async function handleVerifyDomain(domain: string) {
    setVerifying(domain)
    try {
      const response = await fetch('/api/custom-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          action: 'verify'
        })
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        toast.success('Domain verified successfully')
        await loadDomains()
      } else {
        toast.error(data.error || 'Failed to verify domain')
      }
    } catch (error) {
      console.error('Error verifying domain:', error)
      toast.error('Failed to verify domain')
    } finally {
      setVerifying(null)
    }
  }

  async function handleCheckStatus(domain: string) {
    try {
      const response = await fetch('/api/custom-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          action: 'check-status'
        })
      })

      if (response.ok) {
        toast.success('Status updated')
        await loadDomains()
      } else {
        toast.error('Failed to check status')
      }
    } catch (error) {
      console.error('Error checking status:', error)
      toast.error('Failed to check status')
    }
  }

  async function handleRemoveDomain(domain: string) {
    if (!confirm(`Are you sure you want to remove ${domain}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/custom-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          action: 'remove'
        })
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        toast.success('Domain removed successfully')
        await loadDomains()
      } else {
        toast.error(data.error || 'Failed to remove domain')
      }
    } catch (error) {
      console.error('Error removing domain:', error)
      toast.error('Failed to remove domain')
    }
  }

  function getStatusBadge(domain: CustomDomain) {
    if (domain.status === 'active' && domain.isVerified && domain.sslStatus === 'active') {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
    }
    if (domain.status === 'verified' && domain.isVerified) {
      return <Badge className="bg-blue-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>
    }
    if (domain.status === 'error' || !domain.isVerified) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>
    }
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading domains...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Custom Domains</h1>
        <p className="text-muted-foreground">
          Manage your custom domains for QR code vanity URLs and branded links
        </p>
      </div>

      <Tabs defaultValue="domains" className="w-full">
        <TabsList>
          <TabsTrigger value="domains">
            <Globe className="w-4 h-4 mr-2" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-6">
          {/* Add Domain Card */}
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Domain</CardTitle>
              <CardDescription>
                Add a custom domain to use with your QR codes. You&apos;ll need to verify ownership via DNS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                />
                <Button onClick={handleAddDomain} disabled={addingDomain}>
                  {addingDomain ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Domain
                    </>
                  )}
                </Button>
              </div>

              {verificationInstructions && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2 mt-2">
                      <p className="font-medium">DNS Verification Required</p>
                      <p className="text-sm">
                        Add the following TXT record to your DNS settings:
                      </p>
                      <div className="bg-muted p-3 rounded-md text-sm font-mono">
                        <div><strong>Type:</strong> {String(verificationInstructions.recordType || '')}</div>
                        <div><strong>Name:</strong> {String(verificationInstructions.recordName || '')}</div>
                        <div><strong>Value:</strong> {String(verificationInstructions.recordValue || '')}</div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        DNS propagation can take up to 24-48 hours. Click &quot;Verify&quot; after adding the record.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Domains List */}
          <div className="space-y-4">
            {domains.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No domains added yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add a custom domain to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              domains.map((domain) => (
                <Card key={domain.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5" />
                        <div>
                          <CardTitle className="text-lg">{domain.domain}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            {getStatusBadge(domain)}
                            {domain.sslEnabled && domain.sslStatus === 'active' && (
                              <Badge variant="outline" className="bg-green-50">
                                SSL Active
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckStatus(domain.domain)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveDomain(domain.domain)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!domain.isVerified && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Verification Required</p>
                              <p className="text-sm text-muted-foreground">
                                Add the DNS TXT record to verify ownership
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDomain(domain.domain)}
                              disabled={verifying === domain.domain}
                            >
                              {verifying === domain.domain ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                'Verify'
                              )}
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {domain.errorMessage && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium">Error</p>
                          <p className="text-sm">{domain.errorMessage}</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{domain.status}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SSL Status</p>
                        <p className="font-medium capitalize">{domain.sslStatus || 'pending'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {domain.verifiedAt && (
                        <div>
                          <p className="text-muted-foreground">Verified</p>
                          <p className="font-medium">
                            {new Date(domain.verifiedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {domain.isVerified && domain.status === 'active' && (
                      <div className="flex gap-2">
                        <Link href={`/dashboard/settings/domains/${domain.id}/analytics`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Analytics
                          </Button>
                        </Link>
                        <Link href={`/dashboard/settings/domains/${domain.id}/settings`}>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Analytics</CardTitle>
              <CardDescription>
                View analytics for all your custom domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Analytics will be displayed here for your verified domains
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click on a domain to view detailed analytics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

