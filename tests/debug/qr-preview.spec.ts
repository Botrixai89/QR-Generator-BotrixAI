import { test, expect } from "@playwright/test"

const mockQrResponse = {
  qrCode: {
    id: "mock-preview",
    title: "Mock Preview QR",
    url: "https://example.com",
    isDynamic: false,
    isActive: true,
    scanCount: 42,
    createdAt: new Date().toISOString(),
    lastScannedAt: null,
    foregroundColor: "#0A66C2",
    backgroundColor: "#FFFFFF",
    dotType: "classy",
    cornerType: "classy",
    hasWatermark: true,
    logoUrl: null,
    template: "linkedin",
    shape: "square",
    eyePattern: "classy",
    gradient: null,
    sticker: null,
    effects: null,
    redirectUrl: "https://example.com",
    dynamicContent: null,
  },
  analytics: {
    totalScans: 42,
    uniqueDevices: 10,
    uniqueCountries: 5,
    uniqueCities: 8,
    scansByDate: {},
    scansByDevice: {},
    scansByCountry: {},
    recentScans: []
  }
}

test.describe.configure({ mode: "serial" })

test("qr preview renders mock data", async ({ page }) => {
  await page.route("**/api/qr-codes/mock-preview/scan", route => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockQrResponse)
    })
  })

  await page.goto("http://localhost:3000/qr/mock-preview?preview=true")

  const qrContainer = page.locator("div").filter({ hasText: "Download Quality" }).locator(".." )
  await expect(qrContainer).toBeVisible()

  await page.waitForTimeout(2000)

  await page.screenshot({ path: "qr-preview-basic.png", fullPage: true })
})

const conicGradientResponse = {
  ...mockQrResponse,
  qrCode: {
    ...mockQrResponse.qrCode,
    title: "Conic Gradient QR",
    gradient: {
      type: "conic",
      colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF6B6B"],
      centerX: 50,
      centerY: 50
    },
    shape: "circle",
    template: "gradient"
  }
}

test("qr preview with conic gradient", async ({ page }) => {
  await page.route("**/api/qr-codes/mock-conic/scan", route => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(conicGradientResponse)
    })
  })

  await page.goto("http://localhost:3000/qr/mock-conic?preview=true")
  await expect(page.getByText("Conic Gradient QR")).toBeVisible()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "qr-preview-conic.png", fullPage: true })
})
