"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Crown, UserPlus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrganizationDetailPage() {
  const { status } = useSession()
  const params = useParams()
  const router = useRouter()
  const orgId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<{ name?: string; description?: string; slug?: string } | null>(null)
  const [members, setMembers] = useState<Array<{ id: string; role: string; user?: { name?: string; email?: string } }>>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Member")
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && orgId) {
      const load = async () => {
        setLoading(true)
        try {
          const [orgRes, membersRes] = await Promise.all([
            fetch(`/api/organizations/${orgId}`),
            fetch(`/api/organizations/${orgId}/members`)
          ])
          
          if (orgRes.ok) {
            const { organization, userRole } = await orgRes.json()
            setOrganization(organization)
            setUserRole(userRole)
          }
          if (membersRes.ok) {
            const { members } = await membersRes.json()
            setMembers(members || [])
          }
        } catch {
          // noop
        } finally {
          setLoading(false)
        }
      }
      
      void load()
    }
  }, [status, orgId])

  async function load() {
    setLoading(true)
    try {
      const [orgRes, membersRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}`),
        fetch(`/api/organizations/${orgId}/members`),
      ])
      if (orgRes.ok) {
        const { organization, userRole } = await orgRes.json()
        setOrganization(organization)
        setUserRole(userRole)
      }
      if (membersRes.ok) {
        const { members } = await membersRes.json()
        setMembers(members || [])
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (res.ok) {
        toast.success('Invitation sent')
        setInviteOpen(false)
        setInviteEmail("")
        setInviteRole("Member")
      } else {
        const { error } = await res.json()
        toast.error(error || 'Failed to send invitation')
      }
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member from the organization?')) return
    try {
      const res = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Member removed')
        await load()
      } else {
        toast.error('Failed to remove member')
      }
    } catch {
      toast.error('Failed to remove member')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading organization…</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Organization not found</p>
          <Button onClick={() => router.push('/dashboard/organizations')} className="mt-4">Back to Organizations</Button>
        </div>
      </div>
    )
  }

  const canManage = userRole === 'Owner' || userRole === 'Admin'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{organization.name || 'Organization'}</h1>
            <p className="text-muted-foreground">{organization.description || `@${organization.slug || ''}`}</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard/organizations')}>
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
              <CardDescription>Manage organization members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManage && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <Button onClick={() => setInviteOpen(true)} className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Member</DialogTitle>
                      <DialogDescription>Send an invitation to join this organization</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={inviteMember} className="space-y-4">
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Member">Member</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={inviting}>{inviting ? 'Sending…' : 'Send Invitation'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between border rounded p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {member.role === 'Owner' && <Crown className="h-4 w-4 text-amber-500" />}
                        <span className="font-medium">{member.user?.name || member.user?.email || 'Unknown'}</span>
                      </div>
                      <Badge variant={member.role === 'Owner' ? 'default' : member.role === 'Admin' ? 'secondary' : 'outline'}>
                        {member.role}
                      </Badge>
                    </div>
                    {canManage && member.role !== 'Owner' && (
                      <Button variant="outline" size="sm" onClick={() => removeMember(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Organization settings (Owner only)</CardDescription>
            </CardHeader>
            <CardContent>
              {userRole === 'Owner' ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Organization settings coming soon</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Only owners can manage organization settings</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

