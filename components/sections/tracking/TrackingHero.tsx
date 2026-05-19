'use client'

import en from '@/lib/i18n/locales/en.json'
import fr from '@/lib/i18n/locales/fr.json'
import type { Locale } from '@/lib/types'
import { TrackingProvider } from '@/lib/context/TrackingContext'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import LoadingOverlay from './LoadingOverlay'
import TrackingInput from './TrackingInput'
import TrackingResults from './results/TrackingResults'
import ZipModal from './modals/ZipModal'
import PodModal from './modals/PodModal'

const translations = { en, fr } as const

function TrackingResultsError({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto mt-8 max-w-202.5 rounded-[10px] bg-white shadow-card px-9.5 py-8 text-center">
      <p className="text-[15px] text-uni-black font-medium mb-4">
        Something went wrong loading your tracking results.
      </p>
      <button
        onClick={onReset}
        className="cursor-pointer rounded-lg bg-brand-gradient px-6 py-2 text-[14px] font-medium text-white shadow-[4px_4px_10px_0_rgba(255,143,28,0.4)] transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
      >
        Try again
      </button>
    </div>
  )
}

export default function TrackingHero({ locale = 'en' }: { locale?: Locale }) {
  const t = translations[locale] as Record<string, string>
  return (
    <TrackingProvider locale={locale}>
      <section className="bg-section-gradient relative w-full py-15 pb-25 max-[720px]:py-10 max-[720px]:pb-17.5">
        <div className="mx-auto max-w-280 px-8 max-[720px]:px-5">
          <h1 className="mb-7 text-center text-[36px] font-semibold text-uni-black tracking-[-0.72px] leading-[1.1] max-[720px]:text-[28px]">
            {t['heroHeadingPre']} <span className="text-brand">UniUni</span> {t['heroHeadingSuf']}
          </h1>
          <div className="font-poppins">
            <LoadingOverlay />
            <TrackingInput />
            <ErrorBoundary fallback={(reset) => <TrackingResultsError onReset={reset} />}>
              <TrackingResults />
            </ErrorBoundary>
            <ZipModal />
            <PodModal />
          </div>
        </div>
      </section>
    </TrackingProvider>
  )
}
