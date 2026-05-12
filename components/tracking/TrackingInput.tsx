'use client'

import '@/lib/i18n'
import { useTranslation } from 'react-i18next'

interface Props {
  value: string
  onChange: (v: string) => void
  onTrack: () => void
  showInvalidAlert: boolean
  showExceedAlert: boolean
}

export default function TrackingInput({
  value,
  onChange,
  onTrack,
  showInvalidAlert,
  showExceedAlert,
}: Props) {
  const { t } = useTranslation()

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onTrack()
    }
  }

  return (
    <div id="tracking-input-group">
      {/* Track row: input + button */}
      <div
        className="mx-auto grid max-w-202.5 grid-cols-[1fr_160px] gap-3.75 max-[720px]:grid-cols-1 max-[720px]:gap-3"
      >
        <div
          className="flex h-12.5 flex-col justify-center rounded-[10px] bg-white px-5.5"
          style={{ boxShadow: '4px 4px 10px 1px #D1E8E8' }}
        >
          <input
            id="input-track"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            className="h-full w-full border-none bg-transparent text-[16px] text-uni-black outline-none placeholder:text-[#C6C6C6]"
          />
        </div>
        <button
          onClick={onTrack}
          className="h-12.5 cursor-pointer rounded-[10px] text-[16px] font-medium text-white transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          style={{
            background: 'linear-gradient(to top, #FF6A13 0%, #FF8F1C 100%)',
            boxShadow: '4px 4px 10px 0 rgba(255, 143, 28, 0.4)',
          }}
        >
          {t('btnTrack')}
        </button>
      </div>

      {/* Hint */}
      <p className="mx-auto mt-2.5 max-w-202.5 pl-5.75 text-[12px] text-[#555] max-[720px]:pl-0 max-[720px]:text-center">
        {t('hintText')}
      </p>

      {/* Alerts */}
      {showInvalidAlert && (
        <p className="mx-auto mt-3 max-w-202.5 text-[13px] text-uni-red">
          {t('alertInvalid')}
        </p>
      )}
      {showExceedAlert && (
        <p className="mx-auto mt-3 max-w-202.5 text-[13px] text-uni-red">
          {t('alertExceed')}
        </p>
      )}
    </div>
  )
}
