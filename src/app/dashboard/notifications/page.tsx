'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Bell,
  Check,
  CheckCheck,
  Settings,
  Mail,
  Smartphone,
  Clock,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  isRead: boolean
  createdAt: string
}

interface NotificationPreferences {
  emailEnabled: boolean
  inAppEnabled: boolean
  emailFrequency: 'immediate' | 'daily' | 'weekly'
  notificationTypes: Record<string, any>
  thresholds: Record<string, number>
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      loadNotifications()
      loadPreferences()
    }
  }, [status, router])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications?limit=100')
      if (!res.ok) throw new Error('Failed to load notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async () => {
    try {
      const res = await fetch('/api/notifications/preferences')
      if (!res.ok) throw new Error('Failed to load preferences')
      const data = await res.json()
      setPreferences(data.preferences)
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Failed to mark as read')
      setNotifications((notifications) =>
        notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
      if (!res.ok) throw new Error('Failed to mark all as read')
      setNotifications((notifications) =>
        notifications.map((n) => ({ ...n, isRead: true }))
      )
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, ...updates }),
      })
      if (!res.ok) throw new Error('Failed to update preferences')
      const data = await res.json()
      setPreferences(data.preferences)
      toast.success('Preferences updated')
    } catch (error) {
      toast.error('Failed to update preferences')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
      case 'domain_verified':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'warning':
      case 'credit_low':
      case 'threshold_crossed':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  if (status === 'loading' || !session) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          Manage your notifications and preferences
        </p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">All Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p>Loading notifications...</p>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    'hover:bg-muted/50 transition-colors',
                    !notification.isRead && 'border-primary'
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {!notification.isRead && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="ml-2"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {notification.actionUrl && (
                          <div className="mt-3">
                            <Link href={notification.actionUrl}>
                              <Button variant="outline" size="sm">
                                {notification.actionLabel || 'View'}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {preferences ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-enabled">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="email-enabled"
                        checked={preferences.emailEnabled}
                        onCheckedChange={(checked) =>
                          updatePreferences({ emailEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="inapp-enabled">In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Show notifications in the app
                        </p>
                      </div>
                      <Switch
                        id="inapp-enabled"
                        checked={preferences.inAppEnabled}
                        onCheckedChange={(checked) =>
                          updatePreferences({ inAppEnabled: checked })
                        }
                      />
                    </div>

                    {preferences.emailEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="email-frequency">Email Frequency</Label>
                        <select
                          id="email-frequency"
                          value={preferences.emailFrequency}
                          onChange={(e) =>
                            updatePreferences({
                              emailFrequency: e.target.value as 'immediate' | 'daily' | 'weekly',
                            })
                          }
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                        </select>
                        <p className="text-sm text-muted-foreground">
                          {preferences.emailFrequency === 'immediate' &&
                            'Receive notifications as they happen'}
                          {preferences.emailFrequency === 'daily' &&
                            'Receive a daily summary of notifications'}
                          {preferences.emailFrequency === 'weekly' &&
                            'Receive a weekly summary of notifications'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Alert Thresholds</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="credits-threshold">Low Credits Threshold</Label>
                        <input
                          id="credits-threshold"
                          type="number"
                          min="0"
                          max="100"
                          value={preferences.thresholds?.credits_low || 10}
                          onChange={(e) =>
                            updatePreferences({
                              thresholds: {
                                ...preferences.thresholds,
                                credits_low: parseInt(e.target.value) || 10,
                              },
                            })
                          }
                          className="w-20 p-2 border rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p>Loading preferences...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

