'use client'

import { useState } from 'react'
import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import Logo from '@/components/icons/Logo'
import ChevronDown from '@/components/icons/ChevronDown'

const LANGUAGES = [
  { code: 'en', label: 'English', href: '/tracking/' },
  { code: 'fr', label: 'Français', href: '/fr/suivi/' },
]

export default function Header() {
  const { t } = useTranslation()
  const [langOpen, setLangOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState(() =>
    typeof window !== 'undefined' && window.location.pathname.startsWith('/fr/')
      ? LANGUAGES[1]
      : LANGUAGES[0]
  )

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-white px-14 py-6">
      <a href="https://www.uniuni.com" aria-label="UniUni home" title="UniUni" className="inline-flex items-center">
        <Logo className="h-[38px] w-auto" />
        <span className="sr-only">UniUni</span>
      </a>

      <div className="flex items-center gap-10">
        <a
          href="#faqs"
          title={t('navFaqs')}
          className="text-[16px] font-medium text-[#101820] transition-colors duration-200 hover:text-[#FF8F1C]"
        >
          {t('navFaqs')}
        </a>
        <a
          href="#support"
          title={t('navSupport')}
          className="text-[16px] font-medium text-[#101820] transition-colors duration-200 hover:text-[#FF8F1C]"
        >
          {t('navSupport')}
        </a>

        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[14px] font-medium text-[#101820]"
          >
            {currentLang.label}
            <ChevronDown
              className={`transition-transform duration-200 ${langOpen ? 'translate-y-0.5' : ''}`}
            />
          </button>

          {langOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-lg">
                {LANGUAGES.map((lang) => (
                  <a
                    key={lang.code}
                    href={lang.href}
                    title={lang.label}
                    onClick={() => { setCurrentLang(lang); setLangOpen(false) }}
                    className={`block px-5 py-3 text-[14px] font-medium hover:text-[#FF8F1C] ${
                      currentLang.code === lang.code ? 'text-[#FF8F1C]' : 'text-[#101820]'
                    }`}
                  >
                    {lang.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
