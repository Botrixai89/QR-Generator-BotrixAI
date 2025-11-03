'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Book, Download, Code } from 'lucide-react'
import Link from 'next/link'

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
            <p className="text-muted-foreground">
              Complete reference for the QR Generator REST API
            </p>
          </div>
          <Link href="/dashboard/developers">
            <Button variant="outline">Back to Developer Portal</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
          <TabsTrigger value="scans">Scans</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Overview</CardTitle>
              <CardDescription>
                The QR Generator API provides programmatic access to manage QR codes, view
                scan analytics, and configure webhooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Base URL</h3>
                <code className="bg-muted px-2 py-1 rounded">
                  https://your-domain.com/api/v1
                </code>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Download OpenAPI Spec</h3>
                <a href="/api/openapi.json" download>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download openapi.json
                  </Button>
                </a>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Rate Limits</h3>
                <p className="text-sm text-muted-foreground">
                  API requests are rate-limited per API key. Check the{' '}
                  <code className="bg-muted px-1 rounded">X-RateLimit-*</code> headers in
                  responses for current limits.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                All API requests must include a valid API key in the Authorization header.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">API Keys</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create API keys from the{' '}
                  <Link href="/dashboard/developers" className="underline">
                    Developer Portal
                  </Link>
                  . API keys support scopes to limit permissions.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-sm">
                    Authorization: Bearer sk_live_...
                  </code>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Scopes</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">qr:read</Badge>
                    <span className="text-sm">Read QR codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">qr:write</Badge>
                    <span className="text-sm">Create and update QR codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">qr:delete</Badge>
                    <span className="text-sm">Delete QR codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">scan:read</Badge>
                    <span className="text-sm">Read scan analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">webhook:read</Badge>
                    <span className="text-sm">Read webhook configurations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">webhook:write</Badge>
                    <span className="text-sm">Create and update webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">webhook:delete</Badge>
                    <span className="text-sm">Delete webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">*</Badge>
                    <span className="text-sm">All permissions (admin)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-codes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Codes API</CardTitle>
              <CardDescription>
                Create, read, update, and delete QR codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">List QR Codes</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  GET /api/v1/qr-codes
                </code>
                <p className="text-sm text-muted-foreground mb-2">
                  Returns a paginated list of QR codes. Requires{' '}
                  <code className="bg-muted px-1 rounded">qr:read</code> scope.
                </p>
                <p className="text-sm font-semibold">Query Parameters:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                  <li>limit: Number of results (default: 50, max: 100)</li>
                  <li>offset: Number of results to skip</li>
                  <li>search: Search query</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Get QR Code</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  GET /api/v1/qr-codes/:id
                </code>
                <p className="text-sm text-muted-foreground">
                  Returns details for a specific QR code. Requires{' '}
                  <code className="bg-muted px-1 rounded">qr:read</code> scope.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Create QR Code</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  POST /api/v1/qr-codes
                </code>
                <p className="text-sm text-muted-foreground mb-2">
                  Creates a new QR code. Requires{' '}
                  <code className="bg-muted px-1 rounded">qr:write</code> scope.
                </p>
                <p className="text-sm font-semibold">Required Fields:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                  <li>url: The URL for the QR code</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Update QR Code</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  PUT /api/v1/qr-codes/:id
                </code>
                <p className="text-sm text-muted-foreground">
                  Updates an existing QR code. Requires{' '}
                  <code className="bg-muted px-1 rounded">qr:write</code> scope.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Delete QR Code</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  DELETE /api/v1/qr-codes/:id
                </code>
                <p className="text-sm text-muted-foreground">
                  Deletes a QR code. Requires{' '}
                  <code className="bg-muted px-1 rounded">qr:delete</code> scope.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scans API</CardTitle>
              <CardDescription>View scan analytics for QR codes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-semibold mb-2">List Scans</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  GET /api/v1/qr-codes/:id/scans
                </code>
                <p className="text-sm text-muted-foreground mb-2">
                  Returns scan history for a QR code. Requires{' '}
                  <code className="bg-muted px-1 rounded">scan:read</code> scope.
                </p>
                <p className="text-sm font-semibold">Query Parameters:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                  <li>limit: Number of results (default: 50, max: 100)</li>
                  <li>offset: Number of results to skip</li>
                  <li>startDate: Filter from date (ISO 8601)</li>
                  <li>endDate: Filter to date (ISO 8601)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks API</CardTitle>
              <CardDescription>
                Configure webhooks to receive notifications when QR codes are scanned.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">List Webhooks</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  GET /api/v1/webhooks
                </code>
                <p className="text-sm text-muted-foreground">
                  Returns all webhook configurations. Requires{' '}
                  <code className="bg-muted px-1 rounded">webhook:read</code> scope.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Create/Update Webhook</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  POST /api/v1/webhooks
                </code>
                <p className="text-sm text-muted-foreground mb-2">
                  Creates or updates a webhook configuration. Requires{' '}
                  <code className="bg-muted px-1 rounded">webhook:write</code> scope.
                </p>
                <p className="text-sm font-semibold">Request Body:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                  <li>qrCodeId: The QR code ID</li>
                  <li>webhookUrl: The webhook endpoint URL</li>
                  <li>regenerateSecret: Whether to regenerate the signing secret</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Get Webhook Logs</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  GET /api/v1/webhooks/:qrCodeId/logs
                </code>
                <p className="text-sm text-muted-foreground">
                  Returns delivery logs for a webhook. Requires{' '}
                  <code className="bg-muted px-1 rounded">webhook:read</code> scope.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Retry Failed Webhook</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  POST /api/v1/webhooks/:qrCodeId/logs
                </code>
                <p className="text-sm text-muted-foreground">
                  Retries a failed webhook delivery. Requires{' '}
                  <code className="bg-muted px-1 rounded">webhook:write</code> scope.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage API</CardTitle>
              <CardDescription>
                View API usage statistics and analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-semibold mb-2">Get Usage Stats</h3>
                <code className="block bg-muted p-4 rounded mb-2">
                  GET /api/v1/usage
                </code>
                <p className="text-sm text-muted-foreground mb-2">
                  Returns usage statistics including request counts, error rates, and
                  response times.
                </p>
                <p className="text-sm font-semibold">Query Parameters:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                  <li>apiKeyId: Filter by specific API key (optional)</li>
                  <li>startDate: Start date for period (ISO 8601)</li>
                  <li>endDate: End date for period (ISO 8601)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

