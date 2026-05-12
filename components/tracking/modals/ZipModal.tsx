'use client'

import { useState } from 'react'
import '@/lib/i18n'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  errorMessage: string | null
  onVerify: (zip: string) => void
  onClose: () => void
}

export default function ZipModal({ open, errorMessage, onVerify, onClose }: Props) {
  const { t } = useTranslation()
  const [zip, setZip] = useState('')

  if (!open) return null

  function handleVerify() {
    if (!zip.trim()) return
    onVerify(zip.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleVerify()
  }

  return (
    <div className="fixed inset-0 z-9999 overflow-auto bg-black/80 mob:pt-39 desk:pt-89">
      <div className="mx-auto border border-[#888] bg-white p-5 mob:h-[310px] mob:rounded-sm desk:h-[310px] desk:w-[629px] desk:rounded-sm">
        <button
          onClick={onClose}
          className="float-right block text-2xl font-bold leading-none text-[#aaa] opacity-50 hover:text-black hover:opacity-100 mob:w-[400px] mob:text-right desk:w-[685px] desk:text-right"
        >
          &times;
        </button>

        <p className="mx-auto text-center font-medium text-black mob:w-[309px] mob:text-base desk:w-[409px] desk:text-xl">
          {t('zipModalTitle')}
        </p>

        {errorMessage !== null && (
          <p className="mx-auto w-102.25 text-center text-[17px] text-[#f72121] mob:w-full">
            {errorMessage || t('errorIncorrectPostalCode')}
          </p>
        )}

        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mx-auto mt-4 block rounded border border-[#ccc] bg-transparent p-2.5 text-black mob:w-[307px] desk:w-[407px]"
        />

        <button
          onClick={handleVerify}
          className="mx-auto mt-[47px] block w-[130px] rounded-[10px] border-2 border-[#f68842] bg-[#f68842] px-10 py-2.5 text-[17px] font-medium text-white"
        >
          {t('verify')}
        </button>
      </div>
    </div>
  )
}
