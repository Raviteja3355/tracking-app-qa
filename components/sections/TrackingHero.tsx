'use client'

import en from '@/lib/i18n/locales/en.json'
import fr from '@/lib/i18n/locales/fr.json'
import TrackingApp from '@/components/tracking/TrackingApp'

const translations = { en, fr } as const
type Locale = keyof typeof translations

export default function PageContent({ locale = 'en' }: { locale?: Locale }) {
  const t = translations[locale] as Record<string, string>
  return (
    <section className="bg-section-gradient relative w-full py-15 pb-25 max-[720px]:py-10 max-[720px]:pb-17.5">
      <div className="mx-auto max-w-280 px-8 max-[720px]:px-5">
        <h1 className="mb-7 text-center text-[36px] font-semibold text-uni-black tracking-[-0.72px] leading-[1.1] max-[720px]:text-[28px]">
          {t['heroHeadingPre']} <span className="text-brand">UniUni</span> {t['heroHeadingSuf']}
        </h1>
        <TrackingApp locale={locale} />
      </div>
    </section>
  )
}
