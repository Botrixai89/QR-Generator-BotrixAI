"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Building2, Plus, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function OrganizationsPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; slug: string; description?: string }>>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (status === 'authenticated') {
      void load()
    }
  }, [status])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/organizations')
      if (res.ok) {
        const { organizations } = await res.json()
        setOrganizations(organizations || [])
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  async function createOrganization(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: slug.toLowerCase(), description }),
      })
      if (res.ok) {
        toast.success('Organization created')
        setCreateOpen(false)
        setName("")
        setSlug("")
        setDescription("")
        await load()
      } else {
        const { error } = await res.json()
        toast.error(error || 'Failed to create organization')
      }
    } finally {
      setCreating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading organizations…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organizations</h1>
            <p className="text-muted-foreground">Manage your teams and organizations</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>Create a new organization for your team</DialogDescription>
              </DialogHeader>
              <form onSubmit={createOrganization} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-z0-9-_]/g, ''))} required placeholder="my-org" />
                  <p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers, hyphens, and underscores only</p>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No organizations yet</h3>
              <p className="text-muted-foreground mb-4">Create your first organization to get started</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {org.name}
                    </CardTitle>
                    <Badge variant="secondary">{org.slug}</Badge>
                  </div>
                  {org.description && (
                    <CardDescription>{org.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/organizations/${org.id}`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

