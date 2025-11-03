/**
 * Design System Tokens
 * Centralized design system for consistent spacing, colors, typography, and theming
 */

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
} as const

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const

export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
  slower: '500ms ease-in-out',
} as const

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/**
 * Brand theme configuration
 */
export interface BrandTheme {
  primary: string
  secondary?: string
  accent?: string
  foreground?: string
  background?: string
  muted?: string
  border?: string
  logoUrl?: string
}

/**
 * Default brand theme (can be overridden per organization)
 */
export const defaultBrandTheme: BrandTheme = {
  primary: 'oklch(0.208 0.042 265.755)',
  secondary: 'oklch(0.968 0.007 247.896)',
  accent: 'oklch(0.704 0.04 256.788)',
  foreground: 'oklch(0.129 0.042 264.695)',
  background: 'oklch(1 0 0)',
  muted: 'oklch(0.968 0.007 247.896)',
  border: 'oklch(0.929 0.013 255.508)',
}

/**
 * Generate CSS custom properties for brand theme
 */
export function generateBrandThemeCSS(brandTheme: BrandTheme): string {
  const vars: string[] = []
  
  if (brandTheme.primary) vars.push(`--brand-primary: ${brandTheme.primary}`)
  if (brandTheme.secondary) vars.push(`--brand-secondary: ${brandTheme.secondary}`)
  if (brandTheme.accent) vars.push(`--brand-accent: ${brandTheme.accent}`)
  if (brandTheme.foreground) vars.push(`--brand-foreground: ${brandTheme.foreground}`)
  if (brandTheme.background) vars.push(`--brand-background: ${brandTheme.background}`)
  if (brandTheme.muted) vars.push(`--brand-muted: ${brandTheme.muted}`)
  if (brandTheme.border) vars.push(`--brand-border: ${brandTheme.border}`)
  
  return vars.join('; ')
}

/**
 * Apply brand theme to document
 */
export function applyBrandTheme(brandTheme: BrandTheme, organizationId?: string): void {
  const css = generateBrandThemeCSS(brandTheme)
  const selector = organizationId 
    ? `[data-org="${organizationId}"]` 
    : ':root'
  
  let styleElement = document.getElementById('brand-theme-styles')
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = 'brand-theme-styles'
    document.head.appendChild(styleElement)
  }
  
  styleElement.textContent = `${selector} { ${css} }`
}

