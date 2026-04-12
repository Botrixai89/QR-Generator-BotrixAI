import { NextRequest } from "next/server"

/**
 * Billing access check — always allowed because everything is free.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function checkBillingAccess(_: NextRequest): Promise<{
  allowed: boolean
  reason?: string
  redirect?: string
}> {
  return { allowed: true }
}
