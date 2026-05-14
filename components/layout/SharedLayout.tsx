import { Poppins } from 'next/font/google'
import Script from 'next/script'
import { Providers } from '@/app/providers'
import Header from './Header'
import Footer from './Footer'
import IntercomWidget from '@/components/marketing-tools/Intercom'
import Analytics from '@/components/marketing-tools/Analytics'
import Clarity from '@/components/marketing-tools/Clarity'
import CookieBanner from '@/components/ui/CookieBanner'
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
        <Clarity />
        <Script
          src="https://cdn.jsdelivr.net/gh/linways/table-to-excel@v1.0.4/dist/tableToExcel.js"
          strategy="lazyOnload"
        />
        <Providers>
          <Header locale={locale} />
          {children}
          <Footer locale={locale} />
          <IntercomWidget />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
