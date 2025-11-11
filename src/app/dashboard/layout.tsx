import { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generateMetadata({
  title: 'Dashboard - Manage Your QR Codes',
  description:
    'Access your QR code dashboard to create, edit, and manage all your QR codes. View detailed analytics, track scans, and download reports. Professional QR code management made easy.',
  path: '/dashboard',
  noIndex: true,
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

