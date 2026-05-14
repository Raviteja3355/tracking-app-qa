'use client'

import { useState, useEffect } from 'react'
import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import { useTrackingContext } from '@/lib/context/TrackingContext'

export default function ZipModal() {
  const { zipModal, handleZipVerify, closeZipModal, setZipError } = useTrackingContext()
  const { open, errorMessage } = zipModal
  const { t } = useTranslation()
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setZip('')
    setLoading(false)
  }, [open])

  if (!open) return null

  async function handleVerify() {
    if (!zip.trim()) {
      setZipError('')
      return
    }
    setLoading(true)
    try {
      await handleZipVerify(zip.trim())
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleVerify()
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 animate-modal-overlay">
      <div className="relative mx-4 w-full max-w-140 rounded-[20px] bg-white px-8 py-10 text-center shadow-glow animate-modal-content">
        <button
          onClick={closeZipModal}
          className="absolute right-5 top-4 cursor-pointer text-2xl font-bold leading-none text-[#aaa] transition-colors hover:text-black"
        >
          &times;
        </button>

        <p className="mx-auto max-w-95 text-[17px] font-medium text-black">
          {t('zipModalTitle')}
        </p>

        {errorMessage !== null && (
          <p className="mt-2 text-[15px] text-[#f72121]">
            {errorMessage || t('errorIncorrectPostalCode')}
          </p>
        )}

        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="mx-auto mt-5 block w-full max-w-95 rounded border border-[#ccc] bg-transparent p-2.5 text-black outline-none transition-colors focus:border-[#f68842] disabled:opacity-60"
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          className="mx-auto mt-8 block cursor-pointer rounded-[10px] px-10 py-3.5 text-[16px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 bg-brand-gradient"
        >
          {loading ? t('loading') : t('verify')}
        </button>
      </div>
    </div>
  )
}
