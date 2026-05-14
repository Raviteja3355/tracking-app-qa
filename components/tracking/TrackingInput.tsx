'use client'

import { useState } from 'react'
import en from '@/lib/i18n/locales/en.json'
import fr from '@/lib/i18n/locales/fr.json'

const translations = { en, fr } as const

interface Props {
  locale?: 'en' | 'fr'
  value: string
  onChange: (v: string) => void
  onTrack: () => void
  showInvalidAlert: boolean
  showExceedAlert: boolean
  showApiErrorAlert: boolean
}

export default function TrackingInput({
  locale = 'en',
  value,
  onChange,
  onTrack,
  showInvalidAlert,
  showExceedAlert,
  showApiErrorAlert,
}: Props) {
  const t = translations[locale] as Record<string, string>
  const [expanded, setExpanded] = useState(false)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onTrack()
    }
  }

  return (
    <div id="tracking-input-group">
      {/* Track row: textarea + button */}
      <div
        className="mx-auto grid max-w-202.5 grid-cols-[1fr_160px] gap-3.75 max-[720px]:grid-cols-1 max-[720px]:gap-3"
      >
        <div
          style={{ height: expanded ? '10rem' : '3.125rem' }}
          className={`flex flex-col justify-center overflow-hidden rounded-[10px] bg-white px-5.5 py-3 shadow-card border transition-[height] duration-200 ease-out ${expanded ? 'border-[#f79045]' : 'border-transparent'}`}
        >
          <textarea
            id="input-track"
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setExpanded(true)}
            onBlur={() => { if (!value.trim()) setExpanded(false) }}
            placeholder={t['inputPlaceholder']}
            className="w-full h-full resize-none border-none bg-transparent text-[16px] leading-normal text-uni-black outline-none placeholder:text-[#C6C6C6]"
          />
        </div>
        <button
          onClick={onTrack}
          onMouseDown={(e) => e.preventDefault()}
          className="h-12.5 cursor-pointer rounded-[10px] text-[16px] font-medium text-white transition-transform duration-150 hover:-translate-y-px active:translate-y-0 bg-brand-gradient shadow-[4px_4px_10px_0_rgba(255,143,28,0.4)]"
        >
          {t['btnTrack']}
        </button>
      </div>

      {/* Hint */}
      <p className="mx-auto mt-2.5 max-w-202.5 pl-5.75 text-[12px] text-[#555] max-[720px]:pl-0 max-[720px]:text-center">
        {t['hintText']}
      </p>

      {/* Alerts */}
      {showInvalidAlert && (
        <p className="mx-auto mt-3 max-w-202.5 text-[13px] text-uni-red">
          {t['alertInvalid']}
        </p>
      )}
      {showExceedAlert && (
        <p className="mx-auto mt-3 max-w-202.5 text-[13px] text-uni-red">
          {t['alertExceed']}
        </p>
      )}
      {showApiErrorAlert && (
        <p className="mx-auto mt-3 max-w-202.5 text-[13px] text-uni-red">
          {t['alertApiError']}
        </p>
      )}
    </div>
  )
}
