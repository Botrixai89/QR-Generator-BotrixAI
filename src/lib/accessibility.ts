/**
 * Accessibility Utilities
 * Provides accessibility helpers and utilities
 */

/**
 * Generate accessible ID for ARIA relationships
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get accessible label text
 */
export function getAccessibleLabel(
  visibleText?: string,
  screenReaderText?: string
): string {
  if (screenReaderText) {
    return `${visibleText || ''} ${screenReaderText}`.trim()
  }
  return visibleText || ''
}

/**
 * Check if color contrast meets WCAG AA standards
 * Returns true if contrast ratio is at least 4.5:1 for normal text
 */
export function checkColorContrast(
  foreground: string,
  background: string
): boolean {
  // Simplified contrast check - in production, use a proper library
  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  if (!fg || !bg) return false

  const luminance1 = getLuminance(fg)
  const luminance2 = getLuminance(bg)

  const ratio = (Math.max(luminance1, luminance2) + 0.05) /
    (Math.min(luminance1, luminance2) + 0.05)

  return ratio >= 4.5 // WCAG AA standard
}

/**
 * Get relative luminance of RGB color
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  Tab: 'Tab',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
} as const

/**
 * Handle keyboard navigation for lists
 */
export function handleListNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onNavigate: (index: number) => void
): void {
  switch (event.key) {
    case KeyboardKeys.ArrowDown:
      event.preventDefault()
      onNavigate((currentIndex + 1) % totalItems)
      break
    case KeyboardKeys.ArrowUp:
      event.preventDefault()
      onNavigate((currentIndex - 1 + totalItems) % totalItems)
      break
    case KeyboardKeys.Home:
      event.preventDefault()
      onNavigate(0)
      break
    case KeyboardKeys.End:
      event.preventDefault()
      onNavigate(totalItems - 1)
      break
  }
}

/**
 * Focus management helpers
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus()
        e.preventDefault()
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)
  firstElement?.focus()

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Screen reader only class utility
 */
export const srOnly = 'sr-only'

