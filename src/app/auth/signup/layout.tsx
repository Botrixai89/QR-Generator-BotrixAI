import { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generateMetadata({
  title: 'Create Free Account - BotrixAI QR Generator',
  description:
    'Sign up for free to unlock advanced QR code features including logo upload, color customization, analytics tracking, and unlimited QR code generation. No credit card required.',
  keywords: [
    'sign up qr code generator',
    'create account',
    'free qr code account',
    'register qr generator',
  ],
  path: '/auth/signup',
})

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

