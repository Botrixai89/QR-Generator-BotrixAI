"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function BillingSettingsPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [profile, setProfile] = useState<any | null>(null)
  const [subscription, setSubscription] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      void load()
    }
  }, [status])

  async function load() {
    setLoading(true)
    try {
      const [invRes, profRes, subRes] = await Promise.all([
        fetch('/api/billing/invoices'),
        fetch('/api/billing/profile'),
        fetch('/api/billing/subscriptions/current'),
      ])
      if (invRes.ok) {
        const { invoices } = await invRes.json()
        setInvoices(invoices || [])
      }
      if (profRes.ok) {
        const { profile } = await profRes.json()
        setProfile(profile)
      }
      if (subRes.ok) {
        const { subscription } = await subRes.json()
        setSubscription(subscription)
      }
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelSubscription(cancelImmediately: boolean = false) {
    if (!subscription) return
    if (!confirm(cancelImmediately ? 'Cancel subscription immediately? This cannot be undone.' : 'Cancel subscription at period end?')) return

    setCanceling(true)
    try {
      const res = await fetch(`/api/billing/subscriptions/${subscription.id}`, {
        method: cancelImmediately ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: cancelImmediately ? undefined : JSON.stringify({ action: 'cancel' }),
      })
      if (res.ok) {
        toast.success(cancelImmediately ? 'Subscription canceled' : 'Subscription will cancel at period end')
        await load()
      } else {
        toast.error('Failed to cancel subscription')
      }
    } finally {
      setCanceling(false)
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/billing/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile || {}),
      })
      if (res.ok) {
        toast.success('Billing profile saved')
      } else {
        toast.error('Failed to save billing profile')
      }
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading billing…</p>
        </div>
      </div>
    )
  }

  const isInGracePeriod = subscription?.graceUntil && new Date(subscription.graceUntil) > new Date()
  const isLockedOut = subscription && ['canceled', 'incomplete'].includes(subscription.status) && !isInGracePeriod

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing & Invoices</h1>
            <p className="text-muted-foreground">Manage your subscription, invoices, and billing details.</p>
          </div>
          <Button asChild>
            <Link href="/pricing">Change Plan</Link>
          </Button>
        </div>

        {(isInGracePeriod || isLockedOut) && (
          <Alert variant={isLockedOut ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {isLockedOut ? "Subscription Locked Out" : "Grace Period Active"}
            </AlertTitle>
            <AlertDescription>
              {isLockedOut
                ? "Your subscription has been canceled and access will be limited. Please update your payment method to restore access."
                : `Your subscription is in grace period until ${new Date(subscription.graceUntil).toLocaleDateString()}. Please update your payment method.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Manage your active subscription</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{subscription.plan} Plan</div>
                    <div className="text-sm text-muted-foreground">
                      Status: <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>{subscription.status}</Badge>
                      {subscription.cancelAtPeriodEnd && (
                        <Badge variant="outline" className="ml-2">Cancels at period end</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {subscription.currentPeriodEnd && (
                      <>
                        <div>Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</div>
                        {subscription.graceUntil && (
                          <div className="text-amber-600">Grace until: {new Date(subscription.graceUntil).toLocaleDateString()}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {subscription.status === 'active' && (
                  <div className="flex gap-2">
                    {subscription.cancelAtPeriodEnd ? (
                      <Button variant="outline" onClick={() => handleCancelSubscription(false)} disabled={canceling}>
                        Resume Subscription
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => handleCancelSubscription(false)} disabled={canceling}>
                          Cancel at Period End
                        </Button>
                        <Button variant="destructive" onClick={() => handleCancelSubscription(true)} disabled={canceling}>
                          Cancel Immediately
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No active subscription</p>
                <Button asChild>
                  <Link href="/pricing">Subscribe Now</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Your recent invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-sm text-muted-foreground">No invoices yet.</div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between border rounded p-3">
                      <div className="text-sm">
                        <div className="font-medium">{(inv.amountCents/100).toFixed(2)} {inv.currency}</div>
                        <div className="text-muted-foreground">{inv.status} · {new Date(inv.createdAt).toLocaleDateString()}</div>
                      </div>
                      {inv.pdfUrl ? (
                        <Button variant="outline" asChild>
                          <a href={inv.pdfUrl} target="_blank" rel="noreferrer">PDF</a>
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Details</CardTitle>
              <CardDescription>Billing address and tax info</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={saveProfile}>
                <div>
                  <Label>Email</Label>
                  <Input value={profile?.billingEmail || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), billingEmail: e.target.value }))} />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={profile?.billingName || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), billingName: e.target.value }))} />
                </div>
                <div>
                  <Label>Tax ID</Label>
                  <Input value={profile?.taxId || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), taxId: e.target.value }))} />
                </div>
                <div>
                  <Label>Address Line 1</Label>
                  <Input value={profile?.addressLine1 || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), addressLine1: e.target.value }))} />
                </div>
                <div>
                  <Label>Address Line 2</Label>
                  <Input value={profile?.addressLine2 || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), addressLine2: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input value={profile?.city || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), city: e.target.value }))} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={profile?.state || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), state: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Postal Code</Label>
                    <Input value={profile?.postalCode || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), postalCode: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input value={profile?.country || ''} onChange={e => setProfile((p: any) => ({ ...(p||{}), country: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Managed via Razorpay customer portal (coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>Open Customer Portal</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


