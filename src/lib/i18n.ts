/**
 * Internationalization (i18n) Utilities
 * Provides translation support for the application
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh'
export type Namespace = 'common' | 'pricing' | 'dashboard' | 'qr' | 'templates' | 'brandKit' | 'emptyStates' | 'onboarding'

export interface Translation {
  key: string
  locale: Locale
  value: string
  namespace: Namespace
}

// Fallback translations (English)
const FALLBACK_TRANSLATIONS: Record<string, string> = {
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.success': 'Success',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'pricing.title': 'Pricing',
  'pricing.description': 'Choose the perfect plan for your needs',
  'pricing.monthly': 'Monthly',
  'pricing.annual': 'Annual',
  'pricing.perMonth': 'per month',
  'pricing.features': 'Features',
  'pricing.getStarted': 'Get Started',
  'pricing.contactSales': 'Contact Sales',
  'dashboard.title': 'Dashboard',
  'dashboard.welcome': 'Welcome back',
  'dashboard.createQRCode': 'Create QR Code',
  'dashboard.recentCodes': 'Recent QR Codes',
  'dashboard.analytics': 'Analytics',
  'dashboard.settings': 'Settings',
  'qr.create': 'Create QR Code',
  'qr.customize': 'Customize',
  'qr.download': 'Download',
  'qr.preview': 'Preview',
  'qr.url': 'URL',
  'qr.text': 'Text',
  'qr.email': 'Email',
  'qr.phone': 'Phone',
  'qr.wifi': 'WiFi',
  'qr.vcard': 'vCard',
  'templates.title': 'Templates',
  'templates.event': 'Event',
  'templates.menu': 'Menu',
  'templates.payment': 'Payment',
  'templates.vcard': 'vCard',
  'templates.business': 'Business',
  'templates.creative': 'Creative',
  'brandKit.title': 'Brand Kit',
  'brandKit.logo': 'Logo',
  'brandKit.colors': 'Brand Colors',
  'brandKit.presets': 'QR Style Presets',
  'brandKit.primaryColor': 'Primary Color',
  'brandKit.secondaryColor': 'Secondary Color',
  'brandKit.accentColor': 'Accent Color',
  'brandKit.uploadLogo': 'Upload Logo',
  'brandKit.savePresets': 'Save Presets',
  'emptyStates.noQRCodes': 'No QR Codes Yet',
  'emptyStates.noQRCodesDesc': 'Get started by creating your first QR code',
  'emptyStates.noDomains': 'No Custom Domains',
  'emptyStates.noDomainsDesc': 'Add a custom domain to brand your QR codes',
  'onboarding.title': 'Getting Started',
  'onboarding.createFirstQR': 'Create your first QR code',
  'onboarding.uploadLogo': 'Upload your logo',
  'onboarding.setupBrand': 'Set up your brand kit',
  'onboarding.verifyDomain': 'Verify your custom domain',
}

// Translation cache
const translationCache: Map<string, Map<Locale, string>> = new Map()

/**
 * Get translation from API or cache
 */
export async function getTranslation(
  key: string,
  locale: Locale = 'en',
  namespace: Namespace = 'common'
): Promise<string> {
  const cacheKey = `${namespace}.${key}`
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    const localeMap = translationCache.get(cacheKey)!
    if (localeMap.has(locale)) {
      return localeMap.get(locale)!
    }
  }

  try {
    // Fetch from API
    const response = await fetch(`/api/i18n/translations?key=${key}&locale=${locale}&namespace=${namespace}`)
    if (response.ok) {
      const data = await response.json()
      if (data.value) {
        // Cache translation
        if (!translationCache.has(cacheKey)) {
          translationCache.set(cacheKey, new Map())
        }
        translationCache.get(cacheKey)!.set(locale, data.value)
        return data.value
      }
    }
  } catch (error) {
    console.error('Error fetching translation:', error)
  }

  // Fallback to English or hardcoded fallback
  const fallbackKey = `${namespace}.${key}`
  return FALLBACK_TRANSLATIONS[fallbackKey] || key
}

/**
 * Preload translations for a namespace
 */
export async function preloadTranslations(
  namespace: Namespace,
  locale: Locale = 'en'
): Promise<void> {
  try {
    const response = await fetch(`/api/i18n/translations?namespace=${namespace}&locale=${locale}`)
    if (response.ok) {
      const translations = await response.json()
      translations.forEach((t: Translation) => {
        const cacheKey = `${t.namespace}.${t.key}`
        if (!translationCache.has(cacheKey)) {
          translationCache.set(cacheKey, new Map())
        }
        translationCache.get(cacheKey)!.set(t.locale, t.value)
      })
    }
  } catch (error) {
    console.error('Error preloading translations:', error)
  }
}

/**
 * Get user locale from browser or settings
 */
export function getUserLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  
  // Check localStorage
  const savedLocale = localStorage.getItem('locale') as Locale | null
  if (savedLocale && ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].includes(savedLocale)) {
    return savedLocale
  }

  // Get from browser
  const browserLocale = navigator.language.split('-')[0] as Locale
  if (['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].includes(browserLocale)) {
    return browserLocale
  }

  return 'en'
}

/**
 * Set user locale
 */
export function setUserLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('locale', locale)
  // Clear cache to force reload
  translationCache.clear()
}

// Note: useTranslation hook should be in a separate hooks file
// See src/hooks/use-translation.ts

