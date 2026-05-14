'use client'

import { useSyncExternalStore } from 'react'
import '@/lib/i18n'
import { useTranslation } from 'react-i18next'

function subscribe(cb: () => void) {
  window.addEventListener('cookie-consent-updated', cb)
  return () => window.removeEventListener('cookie-consent-updated', cb)
}
function getSnapshot() {
  return !localStorage.getItem('cookie_consent')
}
function getServerSnapshot() {
  return false // SSG: always hidden, matches client initial render
}

export default function CookieBanner() {
  const { t } = useTranslation()
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function decide(choice: 'accepted' | 'rejected') {
    localStorage.setItem('cookie_consent', choice)
    window.dispatchEvent(new Event('cookie-consent-updated'))
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label={t('cookieBannerTitle')}
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-9999 bg-white border-t border-[#E8E8E8] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-275 mx-auto px-8 py-5 flex items-center gap-6 flex-wrap">
        {/* Cookie icon */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="#FFF3E0" stroke="#FF8F1C" strokeWidth="1.5" />
          <circle cx="10" cy="12" r="2" fill="#FF8F1C" />
          <circle cx="18" cy="9" r="1.5" fill="#FF8F1C" />
          <circle cx="22" cy="16" r="2" fill="#FF8F1C" />
          <circle cx="13" cy="20" r="1.5" fill="#FF8F1C" />
          <circle cx="20" cy="22" r="1.5" fill="#FF8F1C" />
          <circle cx="16" cy="15" r="1" fill="#FF8F1C" />
        </svg>

        {/* Text */}
        <div className="flex-1 min-w-50 text-[14px] text-uni-black leading-relaxed">
          <span className="font-semibold mr-1.5">{t('cookieBannerTitle')}</span>
          {t('cookieBannerText')}{' '}
          <a
            href="https://www.uniuni.com/cookies-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-medium underline"
          >
            {t('cookieLearnMore')}
          </a>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => decide('rejected')}
            className="py-2.25 px-5 text-[14px] font-medium rounded-md border border-[#D0D0D0] bg-white text-uni-gray cursor-pointer transition-colors duration-150 hover:border-brand hover:text-brand"
          >
            {t('cookieReject')}
          </button>
          <button
            onClick={() => decide('accepted')}
            className="py-2.25 px-5 text-[14px] font-semibold rounded-md border-none bg-brand text-white cursor-pointer transition-colors duration-150 hover:bg-brand-dark"
          >
            {t('cookieAcceptAll')}
          </button>
        </div>
      </div>
    </div>
  )
}
