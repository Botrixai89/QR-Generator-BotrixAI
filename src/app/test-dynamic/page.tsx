"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  QrCode, 
  Scan, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react"
import QRScanner from "@/components/qr-scanner"

export default function TestDynamicPage() {
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [testUrl, setTestUrl] = useState("")
  const [showScanner, setShowScanner] = useState(false)

  const handleScan = (result: string) => {
    setScannedResult(result)
    setShowScanner(false)
  }

  const handleTestUrl = () => {
    if (testUrl.trim()) {
      window.open(testUrl, '_blank')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const sampleDynamicQRCodes = [
    {
      id: "sample-1",
      title: "Restaurant Menu",
      url: "/qr/sample-1",
      description: "Dynamic menu that updates daily",
      features: ["Real-time updates", "Analytics tracking", "Expires daily"]
    },
    {
      id: "sample-2", 
      title: "Event Information",
      url: "/qr/sample-2",
      description: "Event details that change based on time",
      features: ["Time-based content", "Location updates", "Social sharing"]
    },
    {
      id: "sample-3",
      title: "Product Information",
      url: "/qr/sample-3", 
      description: "Product details with inventory tracking",
      features: ["Inventory updates", "Price changes", "Availability status"]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
              <Zap className="h-10 w-10 text-yellow-500" />
              Dynamic QR Code Testing
            </h1>
            <p className="text-xl text-muted-foreground">
              Test and demonstrate dynamic QR code functionality
            </p>
          </div>

          {/* Scanner Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>
                Scan any QR code to test the functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showScanner ? (
                <div className="text-center space-y-4">
                  <Button onClick={() => setShowScanner(true)} size="lg">
                    <Scan className="h-5 w-5 mr-2" />
                    Open Scanner
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Click to open the camera scanner
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <QRScanner onScan={handleScan} />
                  <Button 
                    variant="outline" 
                    onClick={() => setShowScanner(false)}
                    className="w-full"
                  >
                    Close Scanner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scan Results */}
          {scannedResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Scan Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 break-all">
                      {scannedResult}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(scannedResult)}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Result
                    </Button>
                    
                    {scannedResult.startsWith('http') && (
                      <Button 
                        onClick={() => window.open(scannedResult, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Link
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test URL Section */}
          <Card>
            <CardHeader>
              <CardTitle>Test Dynamic QR Code</CardTitle>
              <CardDescription>
                Enter a QR code URL to test the redirect functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-url">QR Code URL</Label>
                  <Input
                    id="test-url"
                    placeholder="https://example.com/qr/your-qr-code-id"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleTestUrl}
                  disabled={!testUrl.trim()}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test QR Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sample Dynamic QR Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Dynamic QR Codes</CardTitle>
              <CardDescription>
                Examples of dynamic QR codes and their use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sampleDynamicQRCodes.map((qrCode) => (
                  <Card key={qrCode.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{qrCode.title}</CardTitle>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Zap className="h-3 w-3 mr-1" />
                          Dynamic
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {qrCode.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Features:</Label>
                        <div className="flex flex-wrap gap-1">
                          {qrCode.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Test URL:</Label>
                        <div className="flex gap-2">
                          <Input
                            value={qrCode.url}
                            readOnly
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(qrCode.url)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Dynamic QR Code Features</CardTitle>
              <CardDescription>
                What makes our dynamic QR codes special
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Dynamic Content
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Update content without changing the QR code</li>
                    <li>• Real-time content modifications</li>
                    <li>• JSON-based dynamic data structure</li>
                    <li>• Conditional content based on user data</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-blue-500" />
                    Analytics & Tracking
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time scan analytics</li>
                    <li>• Device and location tracking</li>
                    <li>• Scan count and frequency analysis</li>
                    <li>• User behavior insights</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Control & Management
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Set expiration dates</li>
                    <li>• Limit maximum scans</li>
                    <li>• Activate/deactivate codes</li>
                    <li>• Redirect URL management</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-green-500" />
                    Integration
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• API endpoints for updates</li>
                    <li>• Webhook support</li>
                    <li>• Third-party integrations</li>
                    <li>• Custom redirect logic</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
