'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  // DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

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

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  useEffect(() => {
    // Load unread count on mount
    loadUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount()
      if (open) {
        loadNotifications()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [open])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications?limit=10&unreadOnly=false')
      if (!res.ok) throw new Error('Failed to load notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications?limit=1')
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // Silently fail
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
    } catch {
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
    } catch {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'credit_low':
        return '💳'
      case 'threshold_crossed':
        return '📊'
      case 'domain_verified':
        return '✓'
      default:
        return 'ℹ️'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
      case 'domain_verified':
        return 'text-green-600'
      case 'warning':
      case 'credit_low':
      case 'threshold_crossed':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 pb-2">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 hover:bg-muted/50 transition-colors',
                    !notification.isRead && 'bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'font-medium text-sm',
                          getNotificationColor(notification.type)
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            onClick={() => setOpen(false)}
                            className="text-xs text-primary hover:underline"
                          >
                            {notification.actionLabel || 'View'}
                          </Link>
                        )}
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-auto p-0 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full">
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

