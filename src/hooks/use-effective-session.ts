"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import {
  getE2ETestSession,
  E2E_TEST_SESSION_EVENT,
  type E2ETestSession,
} from "@/lib/e2e-test-session"

type SessionStatus = "loading" | "authenticated" | "unauthenticated"

interface EffectiveSession {
  user?: {
    id?: string
    email?: string | null
    name?: string | null
    plan?: "FREE" | "PRO"
  }
}

const isTestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true"
const canUseWindow = typeof window !== "undefined"
const initialSession = isTestMode && canUseWindow ? getE2ETestSession() : null

export function useEffectiveSession() {
  const authSession = useSession()
  const [clientSession, setClientSession] = useState<E2ETestSession | null>(initialSession)
  const [clientStatus, setClientStatus] = useState<SessionStatus>(
    isTestMode ? (initialSession ? "authenticated" : "unauthenticated") : authSession.status
  )

  useEffect(() => {
    if (!isTestMode) return

    const syncSession = () => {
      const sessionData = getE2ETestSession()
      setClientSession(sessionData)
      setClientStatus(sessionData ? "authenticated" : "unauthenticated")
    }

    syncSession()
    window.addEventListener(E2E_TEST_SESSION_EVENT, syncSession)
    return () => {
      window.removeEventListener(E2E_TEST_SESSION_EVENT, syncSession)
    }
  }, [])

  if (!isTestMode) {
    return {
      session: authSession.data,
      status: authSession.status,
    } as const
  }

  const session: EffectiveSession | null = clientSession
    ? {
        user: {
          id: clientSession.id,
          email: clientSession.email,
          name: clientSession.name || clientSession.email.split("@")[0],
          plan: clientSession.plan || "FREE",
        },
      }
    : null

  return {
    session,
    status: clientStatus,
  } as const
}

