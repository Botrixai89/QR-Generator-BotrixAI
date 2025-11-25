import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

// Ensure E2E defaults are present when running Playwright locally/CI
const ensureEnv = (key: string, value: string) => {
  if (!process.env[key]) {
    process.env[key] = value
  }
}

ensureEnv('E2E_TEST_MODE', 'true')
ensureEnv('NEXT_PUBLIC_E2E_TEST_MODE', 'true')
ensureEnv('NEXTAUTH_SECRET', 'e2e-test-secret')
ensureEnv('NEXTAUTH_URL', 'http://localhost:3000')
ensureEnv('E2E_TEST_EMAIL', 'test-user-1@example.com')
ensureEnv('E2E_TEST_PASSWORD', 'password123')

const e2eEnv = {
  E2E_TEST_MODE: process.env.E2E_TEST_MODE!,
  NEXT_PUBLIC_E2E_TEST_MODE: process.env.NEXT_PUBLIC_E2E_TEST_MODE!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
  E2E_TEST_EMAIL: process.env.E2E_TEST_EMAIL!,
  E2E_TEST_PASSWORD: process.env.E2E_TEST_PASSWORD!,
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests sequentially to avoid overloading the dev server */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI 
    ? [['html'], ['github']] 
    : [['html'], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      ...e2eEnv,
    },
  },
})

