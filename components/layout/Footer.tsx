'use client'

import '@/lib/i18n'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="flex flex-wrap items-center justify-center gap-8 border-t border-[#f2f2f2] px-14 py-[30px] font-poppins text-[13px] text-[#999]">
      <span>{t('footerCopyright')}</span>
      <span>{t('footerLinks')}</span>
    </footer>
  )
}
