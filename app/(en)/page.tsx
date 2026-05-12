'use client'

import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import TrackingApp from '@/components/tracking/TrackingApp'
import FAQ from '@/components/layout/FAQ'
import CustomerSupport from '@/components/layout/CustomerSupport'
import Footer from '@/components/layout/Footer'

export default function TrackingPage() {
  const { t } = useTranslation()
  return (
    <main>
      <section
        className="relative w-full py-15 pb-25 max-[720px]:py-10 max-[720px]:pb-17.5"
        style={{ background: 'linear-gradient(to top, #fff 0%, #EDF4F6 100%)' }}
      >
        <div className="mx-auto max-w-280 px-8 max-[720px]:px-5">
          <h1
            className="mb-7 text-center text-[36px] font-semibold text-uni-black max-[720px]:text-[28px]"
            style={{ letterSpacing: '-0.72px', lineHeight: '1.1' }}
          >
            {t('heroHeadingPre')} <span className="text-brand">UniUni</span> {t('heroHeadingSuf')}
          </h1>
          <TrackingApp />
        </div>
      </section>
      <FAQ />
      <CustomerSupport />
      <Footer />
    </main>
  )
}
