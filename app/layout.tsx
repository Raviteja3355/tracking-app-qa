import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { Providers } from './providers'
import Header from '@/components/layout/Header'
import IntercomWidget from '@/components/layout/Intercom'
import './globals.css'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'UniUni • Package Tracking',
  description:
    'Track your package instantly with UniUni\'s package tracker. Enter your tracking number now for real-time updates and delivery status.',
  metadataBase: new URL('https://www.uniuni.com'),
  alternates: {
    canonical: '/tracking/',
    languages: {
      en: 'https://www.uniuni.com/tracking/',
      fr: 'https://www.uniuni.com/fr/suivi/',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  openGraph: {
    title: 'UniUni • Package Tracking',
    description:
      'Track your package instantly with UniUni\'s package tracker. Enter your tracking number now for real-time updates and delivery status.',
    siteName: 'UniUni',
    images: [{ url: 'https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniUni • Package Tracking',
    description:
      'Track your package instantly with UniUni\'s package tracker. Enter your tracking number now for real-time updates and delivery status.',
    images: ['https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-white font-poppins antialiased">
        <Providers>
          <Header />
          {children}
          <IntercomWidget />
        </Providers>


      </body>
    </html>
  )
}
