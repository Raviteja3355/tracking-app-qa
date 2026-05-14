'use client'

import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import { useTrackingContext } from '@/lib/context/TrackingContext'

export default function LoadingOverlay() {
  const { t } = useTranslation()
  const { loading, podLoading } = useTrackingContext()
  if (!loading && !podLoading) return null
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/80">
      <div className="flex items-center">
        <span className="mr-4 font-poppins text-2xl text-white desk:text-[28px] desk:leading-[42px]">
          {t('loading')}
        </span>
        {[
          'bg-[#fff0d8] delay-[500ms]',
          'bg-[#fce2ba] delay-[700ms]',
          'bg-[#fdc05e] delay-[900ms]',
          'bg-[#fcae32] delay-[1100ms]',
          'bg-[#ff9d00] delay-[1300ms]',
        ].map((cls, i) => (
          <span
            key={i}
            className={`mr-1.5 last:mr-0 rounded-full mob:h-2.5 mob:w-2.5 desk:h-4 desk:w-4 animate-[shrink_1s_linear_infinite_alternate] ${cls}`}
          />
        ))}
      </div>
      <style>{`
        @keyframes shrink {
          0%   { transform: scale(1); }
          100% { transform: scale(0); }
        }
      `}</style>
    </div>
  )
}
