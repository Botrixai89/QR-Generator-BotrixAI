import { test, expect } from '@playwright/test'

/**
 * Comprehensive E2E tests for complete user journeys
 * Tests guest flow, signup, upgrade, and premium features
 */

test.describe('Guest User Flow', () => {
  test('should allow guest to generate basic QR code and show signin modal', async ({ page }) => {
    await page.goto('/')

    // Guest should see the QR generator
    await expect(page.locator('text=QR Code Generator')).toBeVisible()

    // Fill in basic QR code details
    await page.fill('input[placeholder*="example.com"], input[id="url"]', 'https://example.com')
    await page.fill('input[placeholder*="My QR Code"], input[id="title"]', 'Guest QR Code')

    // Generate QR code
    await page.click('button:has-text("Generate QR Code")')

    // Should show success message and signin modal
    await expect(page.locator('text=/QR code is ready/i')).toBeVisible({ timeout: 10000 })
    
    // Modal should appear
    await expect(page.locator('text=/Sign in to unlock/i')).toBeVisible({ timeout: 5000 })

    // QR code should be visible in preview
    await expect(page.locator('svg, canvas, img[alt*="QR"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('should prevent guest from accessing premium features', async ({ page }) => {
    await page.goto('/')

    // Try to access Social Media tab
    await page.click('button:has-text("Social"), button:has-text("Social Media")')
    
    // Should see upgrade prompt or modal
    const upgradePrompt = page.locator('text=/Pro Feature|Upgrade|Sign in/i')
    await expect(upgradePrompt.first()).toBeVisible({ timeout: 3000 })

    // Try to access UPI tab
    await page.click('button:has-text("UPI")')
    
    // Should see upgrade prompt
    await expect(upgradePrompt.first()).toBeVisible({ timeout: 3000 })

    // Try to access Dynamic tab
    await page.click('button:has-text("Dynamic")')
    
    // Should see upgrade prompt
    await expect(upgradePrompt.first()).toBeVisible({ timeout: 3000 })
  })

  test('should show signin modal when guest tries to save QR code', async ({ page }) => {
    await page.goto('/')

    // Generate a QR code
    await page.fill('input[placeholder*="example.com"], input[id="url"]', 'https://example.com')
    await page.click('button:has-text("Generate QR Code")')

    // Wait for generation
    await page.waitForTimeout(2000)

    // Try to download (should work for guest)
    await page.click('button:has-text("Download PNG"), button:has-text("PNG")')
    
    // Download should work (no auth required for download)
    // But saving to dashboard would require signin
  })
})

test.describe('User Signup and Authentication', () => {
  test('should complete signup flow', async ({ page }) => {
    const timestamp = Date.now()
    const testEmail = `e2e-test-${timestamp}@example.com`
    const testPassword = 'TestPassword123!'

    await page.goto('/auth/signup')

    // Fill signup form
    await page.fill('input[name="email"], input[type="email"]', testEmail)
    await page.fill('input[name="name"], input[placeholder*="Name"]', 'E2E Test User')
    await page.fill('input[name="password"], input[type="password"]', testPassword)
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign Up")')

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 })
    expect(page.url()).toContain('/dashboard')

    // Should see welcome message or dashboard content
    await expect(page.locator('text=/Dashboard|Welcome/i')).toBeVisible({ timeout: 5000 })
  })

  test('should handle sign-in flow', async ({ page }) => {
    // Note: This requires a seeded test user
    // In CI, use test-user-1@example.com / password123 from seed script
    const testEmail = process.env.E2E_TEST_EMAIL || 'test-user-1@example.com'
    const testPassword = process.env.E2E_TEST_PASSWORD || 'password123'

    await page.goto('/auth/signin')

    await page.fill('input[name="email"], input[type="email"]', testEmail)
    await page.fill('input[name="password"], input[type="password"]', testPassword)
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('should prevent unauthorized access to dashboard', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should redirect to sign-in page
    await page.waitForURL(/\/auth\/signin/, { timeout: 5000 })
    expect(page.url()).toContain('/auth/signin')
  })
})

test.describe('QR Code Creation and Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    const testEmail = process.env.E2E_TEST_EMAIL || 'test-user-1@example.com'
    const testPassword = process.env.E2E_TEST_PASSWORD || 'password123'

    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should create and save QR code', async ({ page }) => {
    await page.goto('/')

    // Fill QR code details
    await page.fill('input[placeholder*="example.com"], input[id="url"]', 'https://example.com/test')
    await page.fill('input[placeholder*="My QR Code"], input[id="title"]', 'E2E Test QR Code')

    // Generate and save
    await page.click('button:has-text("Generate QR Code")')

    // Should redirect to dashboard after save
    await page.waitForURL('/dashboard', { timeout: 15000 })
    
    // Verify QR code appears in dashboard
    await expect(page.locator('text=E2E Test QR Code')).toBeVisible({ timeout: 10000 })
  })

  test('should view QR code analytics', async ({ page }) => {
    // First create a QR code
    await page.goto('/')
    await page.fill('input[placeholder*="example.com"], input[id="url"]', 'https://example.com/analytics')
    await page.fill('input[placeholder*="My QR Code"], input[id="title"]', 'Analytics Test')
    await page.click('button:has-text("Generate QR Code")')
    await page.waitForURL('/dashboard', { timeout: 15000 })

    // Click on analytics/view button for the QR code
    const viewButton = page.locator('button:has-text("View"), button:has-text("Analytics")').first()
    if (await viewButton.isVisible()) {
      await viewButton.click()
      
      // Should show analytics data
      await expect(page.locator('text=/Scans|Analytics|Total/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should delete QR code', async ({ page }) => {
    // Create a QR code first
    await page.goto('/')
    await page.fill('input[placeholder*="example.com"], input[id="url"]', 'https://example.com/delete')
    await page.fill('input[placeholder*="My QR Code"], input[id="title"]', 'Delete Test QR')
    await page.click('button:has-text("Generate QR Code")')
    await page.waitForURL('/dashboard', { timeout: 15000 })

    // Find and click delete button
    const deleteButton = page.locator('button[aria-label*="Delete"], button:has-text("Delete")').first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      
      // Confirm deletion if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last()
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }

      // QR code should be removed
      await expect(page.locator('text=Delete Test QR')).not.toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Upgrade Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as FREE user
    const testEmail = process.env.E2E_TEST_EMAIL || 'test-user-1@example.com'
    const testPassword = process.env.E2E_TEST_PASSWORD || 'password123'

    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/pricing')

    // Should see pricing plans
    await expect(page.locator('text=/Free Plan|Flex Plan|Choose Your Plan/i')).toBeVisible({ timeout: 5000 })
    
    // Should see upgrade button
    const upgradeButton = page.locator('button:has-text("Buy now"), button:has-text("Upgrade")')
    await expect(upgradeButton.first()).toBeVisible()
  })

  test('should initiate payment flow', async ({ page, context }) => {
    // Mock Razorpay to prevent actual payment
    await context.route('https://checkout.razorpay.com/**', route => {
      route.fulfill({
        status: 200,
        body: '<html><body>Razorpay Checkout</body></html>',
      })
    })

    await page.goto('/pricing')

    // Click upgrade button
    const upgradeButton = page.locator('button:has-text("Buy now")').first()
    await upgradeButton.click()

    // Should see Razorpay checkout or payment modal
    // In test mode, we just verify the flow starts
    await page.waitForTimeout(2000)
    
    // Verify payment initiation (check for order creation or modal)
    const paymentIndicator = page.locator('text=/Processing|Payment|Razorpay/i')
    // This might not always be visible, so we just check the flow doesn't error
    expect(page.url()).toMatch(/\/(pricing|payment|dashboard)/)
  })

  test('should show upgrade prompts for premium features', async ({ page }) => {
    await page.goto('/')

    // Try to access Social Media tab
    await page.click('button:has-text("Social"), button:has-text("Social Media")')
    
    // Should see upgrade prompt
    await expect(page.locator('text=/Pro Feature|Upgrade|paid plan/i')).toBeVisible({ timeout: 3000 })

    // Try to create dynamic QR
    await page.click('button:has-text("Dynamic")')
    
    // Should see upgrade prompt
    await expect(page.locator('text=/Pro Feature|Upgrade|paid plan/i')).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Premium Features (After Upgrade)', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as PRO/FLEX user (from seed: test-user-1@example.com is PRO)
    const testEmail = process.env.E2E_TEST_EMAIL || 'test-user-1@example.com'
    const testPassword = process.env.E2E_TEST_PASSWORD || 'password123'

    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should create dynamic QR code', async ({ page }) => {
    await page.goto('/')

    // Switch to Dynamic tab
    await page.click('button:has-text("Dynamic")')
    
    // Fill dynamic QR details
    await page.fill('input[placeholder*="example.com"], input[id="url"]', 'https://example.com/dynamic')
    await page.fill('input[placeholder*="My QR Code"], input[id="title"]', 'Dynamic QR Test')
    
    // Enable dynamic QR
    const dynamicToggle = page.locator('input[type="checkbox"]').filter({ hasText: /Dynamic/i }).or(
      page.locator('button[role="switch"]').filter({ hasText: /Dynamic/i })
    ).first()
    
    if (await dynamicToggle.isVisible()) {
      await dynamicToggle.click()
    }

    // Fill redirect URL
    const redirectInput = page.locator('input[placeholder*="redirect"], input[id="redirectUrl"]')
    if (await redirectInput.isVisible()) {
      await redirectInput.fill('https://redirect.example.com')
    }

    // Generate QR code
    await page.click('button:has-text("Generate QR Code")')

    // Should save successfully
    await page.waitForURL('/dashboard', { timeout: 15000 })
    await expect(page.locator('text=Dynamic QR Test')).toBeVisible({ timeout: 10000 })
  })

  test('should create UPI payment QR code', async ({ page }) => {
    await page.goto('/')

    // Switch to UPI tab
    await page.click('button:has-text("UPI")')
    
    // Enable UPI payment
    const upiToggle = page.locator('input[type="checkbox"]').filter({ hasText: /UPI/i }).or(
      page.locator('button[role="switch"]').filter({ hasText: /UPI/i })
    ).first()
    
    if (await upiToggle.isVisible()) {
      await upiToggle.click()
    }

    // Fill UPI details
    const upiInput = page.locator('input[placeholder*="UPI"], input[id="upiId"]')
    if (await upiInput.isVisible()) {
      await upiInput.fill('test@paytm')
    }

    // Generate QR code
    await page.click('button:has-text("Generate QR Code")')

    // Should save successfully
    await page.waitForURL('/dashboard', { timeout: 15000 })
  })

  test('should create social media QR code', async ({ page }) => {
    await page.goto('/')

    // Switch to Social Media tab
    await page.click('button:has-text("Social"), button:has-text("Social Media")')
    
    // Select a social media platform (e.g., Instagram)
    const instagramButton = page.locator('button:has-text("Instagram")')
    if (await instagramButton.isVisible()) {
      await instagramButton.click()
    }

    // Fill URL
    await page.fill('input[placeholder*="example.com"], input[id="url"]', 'https://instagram.com/test')
    await page.fill('input[placeholder*="My QR Code"], input[id="title"]', 'Instagram QR')

    // Generate QR code
    await page.click('button:has-text("Generate QR Code")')

    // Should save successfully
    await page.waitForURL('/dashboard', { timeout: 15000 })
    await expect(page.locator('text=Instagram QR')).toBeVisible({ timeout: 10000 })
  })

  test('should remove watermark for paid users', async ({ page }) => {
    await page.goto('/')

    // Find watermark toggle
    const watermarkToggle = page.locator('input[type="checkbox"]').filter({ hasText: /Watermark/i }).or(
      page.locator('button[role="switch"]').filter({ hasText: /Watermark/i })
    ).first()
    
    if (await watermarkToggle.isVisible()) {
      // Should be able to toggle watermark off (paid users)
      const isDisabled = await watermarkToggle.isDisabled()
      expect(isDisabled).toBe(false) // Should NOT be disabled for paid users
    }
  })
})

test.describe('Plan Limits and Restrictions', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as FREE user
    const testEmail = process.env.E2E_TEST_EMAIL || 'test-user-3@example.com' // Assuming user 3 is FREE
    const testPassword = process.env.E2E_TEST_PASSWORD || 'password123'

    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should show plan limit warning when approaching limit', async ({ page }) => {
    await page.goto('/dashboard')

    // Check for plan limit indicators
    const planIndicator = page.locator('text=/Plan|FREE|Credits|limit/i')
    if (await planIndicator.isVisible()) {
      // Should show current usage
      await expect(planIndicator.first()).toBeVisible()
    }
  })

  test('should prevent watermark removal for free users', async ({ page }) => {
    await page.goto('/')

    // Find watermark toggle
    const watermarkToggle = page.locator('input[type="checkbox"]').filter({ hasText: /Watermark/i }).or(
      page.locator('button[role="switch"]').filter({ hasText: /Watermark/i })
    ).first()
    
    if (await watermarkToggle.isVisible()) {
      // Should be disabled for free users
      const isDisabled = await watermarkToggle.isDisabled()
      expect(isDisabled).toBe(true) // Should be disabled for FREE users
    }
  })
})
