import { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generateMetadata({
  title: 'Sign In to Your Account - BotrixAI QR Generator',
  description:
    'Sign in to BotrixAI QR Generator to access your dashboard, manage QR codes, and view analytics. Create and track unlimited custom QR codes with logo support.',
  path: '/auth/signin',
  noIndex: true,
})

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

