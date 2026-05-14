import type { Metadata, Viewport } from 'next'
import SharedLayout from '@/components/layout/SharedLayout'

export const viewport: Viewport = {
  themeColor: '#FF9E46',
}

export const metadata: Metadata = {
  title: 'UniUni • Package Tracking',
  description:
    "Track your package instantly with UniUni's package tracker. Enter your tracking number now for real-time updates and delivery status.",
  keywords: [
    'package tracking', 'UniUni tracking', 'parcel tracking',
    'delivery tracking', 'track my package', 'package tracker',
    'UniUni', 'shipment tracking',
  ],
  icons: {
    icon: [
      { url: 'https://cdn.uniuni.com/wp-content/uploads/2025/10/cropped-android-chrome-512x512-1-2-32x32.png', sizes: '32x32' },
      { url: 'https://cdn.uniuni.com/wp-content/uploads/2025/10/cropped-android-chrome-512x512-1-2-192x192.png', sizes: '192x192' },
    ],
    shortcut: 'https://cdn.uniuni.com/wp-content/uploads/2025/10/android-chrome-192x192-1.png',
    apple: [
      { url: 'https://cdn.uniuni.com/wp-content/uploads/2025/10/cropped-android-chrome-512x512-1-2-180x180.png', sizes: '180x180' },
    ],
  },
  metadataBase: new URL('https://www.uniuni.com'),
  alternates: {
    canonical: 'https://www.uniuni.com/tracking/',
    languages: {
      en: 'https://www.uniuni.com/tracking/',
      fr: 'https://www.uniuni.com/fr/suivi/',
    },
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'UniUni • Package Tracking',
    description:
      "Track your package instantly with UniUni's package tracker. Enter your tracking number now for real-time updates and delivery status.",
    type: 'article',
    url: 'https://www.uniuni.com/tracking/',
    siteName: 'UniUni',
    locale: 'en_US',
    images: [
      {
        url: 'https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif',
        secureUrl: 'https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif',
        width: 950,
        height: 644,
        alt: 'UniUni – Kid with UniUni Package Delivery Tightly Cropped - Animated',
        type: 'image/gif',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniUni • Package Tracking',
    description:
      "Track your package instantly with UniUni's package tracker. Enter your tracking number now for real-time updates and delivery status.",
    images: ['https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif'],
  },
  other: {
    'msapplication-TileImage':
      'https://cdn.uniuni.com/wp-content/uploads/2025/10/cropped-android-chrome-512x512-1-2-270x270.png',
  },
}

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <SharedLayout lang="en-CA" locale="en">{children}</SharedLayout>
}
