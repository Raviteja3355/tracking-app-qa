import { Poppins } from 'next/font/google'
import { Providers } from '@/app/providers'
import HeaderWrapper from './HeaderWrapper'
import IntercomWidget from '@/components/scripts/Intercom'
import Analytics from '@/components/scripts/Analytics'
import CookieBanner from '@/components/sections/CookieBanner'
import '@/app/globals.css'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export default function SharedLayout({
  children,
  lang,
  locale,
}: {
  children: React.ReactNode
  lang: string
  locale: 'en' | 'fr'
}) {
  return (
    <html lang={lang} className={poppins.variable}>
      <body className="min-h-screen bg-white font-poppins antialiased">
        <Analytics />
        <Providers>
          <HeaderWrapper locale={locale} />
          {children}
          <IntercomWidget />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
