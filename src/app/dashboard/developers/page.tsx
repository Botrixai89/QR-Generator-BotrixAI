'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Key,
  Activity,
  Book,
  Webhook,
  Copy,
  Trash2,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import ApiKeysManager from '@/components/api-keys-manager'
import ApiUsageStats from '@/components/api-usage-stats'
import WebhookManager from '@/components/webhook-manager'

export default function DevelopersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading' || !session) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Developer Platform</h1>
        <p className="text-muted-foreground">
          Manage your API keys, monitor usage, and configure webhooks
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="usage">
            <Activity className="w-4 h-4 mr-2" />
            Usage & Analytics
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysManager />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <ApiUsageStats />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <WebhookManager />
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            API Documentation
          </CardTitle>
          <CardDescription>
            Complete API reference with examples and SDKs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Link href="/dashboard/developers/docs">
              <Button variant="outline">
                <Book className="w-4 h-4 mr-2" />
                View API Docs
              </Button>
            </Link>
            <Link href="/dashboard/developers/sdks">
              <Button variant="outline">
                <Code className="w-4 h-4 mr-2" />
                Download SDKs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Code({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  )
}

