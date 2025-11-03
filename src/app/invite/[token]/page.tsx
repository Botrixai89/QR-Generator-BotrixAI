"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Building2, CheckCircle, XCircle } from "lucide-react"

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const token = params?.token as string
  
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invitation, setInvitation] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      void loadInvitation()
    }
  }, [token])

  useEffect(() => {
    if (status === 'authenticated' && invitation && !invitation.acceptedAt) {
      // Auto-accept if user is logged in
      void acceptInvitation()
    }
  }, [status, invitation])

  async function loadInvitation() {
    setLoading(true)
    try {
      const res = await fetch(`/api/invitations/${token}`)
      if (res.ok) {
        const { invitation } = await res.json()
        setInvitation(invitation)
      } else {
        const { error } = await res.json()
        setError(error || 'Invitation not found')
      }
    } catch (e) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  async function acceptInvitation() {
    setAccepting(true)
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Invitation accepted!')
        router.push('/dashboard/organizations')
      } else {
        const { error } = await res.json()
        toast.error(error || 'Failed to accept invitation')
        setError(error || 'Failed to accept invitation')
      }
    } catch (e) {
      toast.error('Failed to accept invitation')
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invitation…</p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>{error || 'Invitation not found or expired'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.acceptedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Invitation Accepted
            </CardTitle>
            <CardDescription>This invitation has already been accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/organizations')} className="w-full">
              Go to Organizations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const org = invitation.Organization || {}

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Invitation
          </CardTitle>
          <CardDescription>
            You've been invited to join <strong>{org.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p><strong>Role:</strong> {invitation.role}</p>
            {org.description && <p><strong>Description:</strong> {org.description}</p>}
          </div>
          {status === 'unauthenticated' ? (
            <>
              <p className="text-sm text-muted-foreground">Please sign in to accept this invitation</p>
              <Button onClick={() => router.push(`/auth/signin?callbackUrl=/invite/${token}`)} className="w-full">
                Sign In to Accept
              </Button>
            </>
          ) : (
            <Button onClick={acceptInvitation} disabled={accepting} className="w-full">
              {accepting ? 'Accepting…' : 'Accept Invitation'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

