'use client'

import '@/lib/i18n'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NoticeModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1000] overflow-auto bg-black/80 pb-[100px] pt-[195px]">
      <div className="mx-auto rounded-[10px] border-t-[18px] border-[#ff9e46] bg-white text-center shadow-[0_0_24px_rgba(0,0,0,0.2)] mob:w-[360px] mob:min-h-[400px] mob:pb-2.5 desk:w-[759px] desk:min-h-[460px] desk:pb-5">
        <div className="mt-5 text-[26px] font-semibold text-[#ff9e46] mob:mt-2.5 mob:text-sm">
          {t('noticeWeatherAlert')}
        </div>
        <p className="mt-5 font-poppins mob:mt-2.5 mob:px-5 mob:text-[13px] desk:px-[70px] desk:text-lg">
          {t('noticeWeatherText1')}
        </p>
        <p className="mt-5 font-poppins mob:mt-2.5 mob:px-5 mob:text-[13px] desk:px-[70px] desk:text-lg">
          {t('noticeWeatherText2')}
        </p>
        <p className="mt-5 font-poppins mob:mt-2.5 mob:px-5 mob:text-[13px] desk:px-[70px] desk:text-lg">
          {t('noticeWeatherText3')}
        </p>
        <button
          onClick={onClose}
          className="mt-[50px] w-[120px] cursor-pointer rounded-[10px] bg-[#ff9e46] p-2.5 text-white"
        >
          {t('btnOk')}
        </button>
      </div>
    </div>
  )
}
