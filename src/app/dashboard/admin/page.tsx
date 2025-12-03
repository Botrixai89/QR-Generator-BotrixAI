/**
 * Admin Dashboard Main Page
 * Overview and navigation hub for admin features
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Button not used
import {
  Users,
  DollarSign,
  Flag,
  Mail,
  Lock,
  UserCheck,
  FileText,
  Settings,
  Activity,
  Building,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  lockedUsers: number
  totalOrganizations: number
  totalRevenue: number
  pendingRefunds: number
  activeFeatureFlags: number
  pendingEmails: number
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session) {
      ;(async () => {
        try {
          const response = await fetch('/api/admin/stats')
          if (!response.ok) {
            if (response.status === 403) {
              toast.error('Access denied - Admin access required')
              router.push('/dashboard')
              return
            }
            throw new Error('Failed to fetch stats')
          }
          const data = await response.json()
          setStats(data)
        } catch (error) {
          console.error('Error fetching admin stats:', error)
          toast.error('Failed to load admin stats')
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [status, session, router])

  // fetchStats inlined in useEffect to satisfy exhaustive-deps

  if (status === 'loading' || !session || loading) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const adminSections = [
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/dashboard/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Building,
      title: 'Organizations',
      description: 'Manage organizations and members',
      href: '/dashboard/admin/organizations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: DollarSign,
      title: 'Billing & Refunds',
      description: 'Manage billing, refunds, and credits',
      href: '/dashboard/admin/billing',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Flag,
      title: 'Feature Flags',
      description: 'Manage feature flags and rollouts',
      href: '/dashboard/admin/feature-flags',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Mail,
      title: 'Email Management',
      description: 'View and manage email sends',
      href: '/dashboard/admin/emails',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Lock,
      title: 'User Lockouts',
      description: 'Manage account lockouts',
      href: '/dashboard/admin/lockouts',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: UserCheck,
      title: 'Impersonation',
      description: 'Impersonate users (with audit trail)',
      href: '/dashboard/admin/impersonate',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: FileText,
      title: 'Content Management',
      description: 'Manage templates and announcements',
      href: '/dashboard/admin/content',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      icon: Activity,
      title: 'System Health',
      description: 'Monitor system health and queues',
      href: '/dashboard/admin/system-health',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      icon: Settings,
      title: 'Admin Settings',
      description: 'Configure admin preferences',
      href: '/dashboard/admin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
    },
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Console</h1>
        <p className="text-muted-foreground">
          Manage users, billing, features, and system configuration
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {stats.activeUsers} active, {stats.lockedUsers} locked
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Organizations</CardDescription>
              <CardTitle className="text-3xl">{stats.totalOrganizations}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-3xl">₹{stats.totalRevenue.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Refunds</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingRefunds}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Admin Sections Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section, index) => {
          const Icon = section.icon
          return (
            <Link key={index} href={section.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 ${section.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

