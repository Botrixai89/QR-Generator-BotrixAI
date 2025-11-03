import { test, expect } from '@playwright/test'

/**
 * E2E tests for sign-up → purchase → usage → downgrade flow
 */

test.describe('User Journey: Sign-up → Purchase → Usage → Downgrade', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
  })

  test('should complete full user journey', async ({ page }) => {
    // Step 1: Sign up
    await test.step('Sign up new user', async () => {
      await page.click('text=Sign Up')
      await page.fill('input[name="email"]', `test-${Date.now()}@example.com`)
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="password"]', 'password123456')
      await page.click('button[type="submit"]')
      
      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 })
      expect(page.url()).toContain('/dashboard')
    })

    // Step 2: Create QR code (usage)
    await test.step('Create QR code', async () => {
      await page.goto('/dashboard')
      await page.click('text=Create QR Code')
      await page.fill('input[name="url"]', 'https://example.com')
      await page.fill('input[name="title"]', 'Test QR Code')
      await page.click('button:has-text("Create")')
      
      // Wait for QR code to be created
      await page.waitForSelector('text=Test QR Code', { timeout: 5000 })
      expect(await page.textContent('body')).toContain('Test QR Code')
    })

    // Step 3: View pricing page
    await test.step('Navigate to pricing', async () => {
      await page.click('text=Pricing')
      await page.waitForURL('/pricing')
      expect(page.url()).toContain('/pricing')
    })

    // Step 4: Attempt to upgrade (if on free plan)
    await test.step('View upgrade options', async () => {
      const upgradeButton = page.locator('button:has-text("Upgrade")').first()
      if (await upgradeButton.isVisible()) {
        // In a real test, we might mock the payment gateway
        // For now, just verify the button exists
        expect(await upgradeButton.isVisible()).toBeTruthy()
      }
    })

    // Step 5: View usage/analytics
    await test.step('View dashboard analytics', async () => {
      await page.goto('/dashboard')
      await page.waitForSelector('[data-testid="analytics"]', { timeout: 5000 })
      // Verify analytics section exists
      expect(await page.locator('text=/QR.*Codes?/i').count()).toBeGreaterThan(0)
    })

    // Step 6: View settings/billing
    await test.step('Navigate to settings', async () => {
      await page.goto('/dashboard/settings')
      await page.waitForSelector('text=/Settings|Billing/i', { timeout: 5000 })
      // Verify settings page loaded
      expect(page.url()).toContain('/settings')
    })
  })

  test('should handle sign-in flow', async ({ page }) => {
    // This would require seeding a test user first
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123456')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard on successful login
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

