"use client"

import { useState, useEffect } from "react"
import { getTranslation, preloadTranslations, getUserLocale, setUserLocale } from "@/lib/i18n"
import type { Locale, Namespace } from "@/lib/i18n"

/**
 * React hook for translations
 */
export function useTranslation(namespace: Namespace = 'common') {
  const [locale, setLocale] = useState<Locale>(() => getUserLocale())
  const [translations, setTranslations] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    // Preload translations for namespace
    preloadTranslations(namespace, locale).then(() => {
      setIsLoading(false)
    })
  }, [namespace, locale])

  const t = async (key: string): Promise<string> => {
    return getTranslation(key, locale, namespace)
  }

  const updateLocale = (newLocale: Locale) => {
    setUserLocale(newLocale)
    setLocale(newLocale)
  }

  return {
    t,
    locale,
    setLocale: updateLocale,
    isLoading,
  }
}

