'use client'

import { useEffect, useRef } from 'react'
import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import type { PodModalState, TrackingResult } from '@/lib/types'
import { resolveWatermarkData, drawWatermarkOnCanvas } from '@/lib/utils/watermark'

interface Props {
  pod: PodModalState
  validResults: TrackingResult[]
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onDownloadCurrent: () => void
  onDownloadAll: () => void
}

export default function PodModal({
  pod,
  validResults,
  onClose,
  onPrev,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
}: Props) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const current = pod.images[pod.currentIndex]
  const total = pod.images.length

  const orderData =
    pod.fromSecondAPI && pod.orderData
      ? validResults.find(
          (r) => r.tno === pod.orderNo || r.new_tno === pod.orderNo,
        ) ?? pod.orderData
      : null

  useEffect(() => {
    if (!current || !pod.open) return
    const img = new Image()
    if (!current.startsWith('data:') && !current.startsWith('blob:')) img.crossOrigin = 'anonymous'
    img.src = current

    img.onload = () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      canvas.width = img.width
      canvas.height = img.height

      if (orderData) {
        const spathItem = resolveWatermarkData(orderData)
        if (spathItem) {
          drawWatermarkOnCanvas(canvas, ctx, img, spathItem)
          return
        }
      }
      ctx.drawImage(img, 0, 0)
    }
  }, [current, pod.open, orderData])

  if (!pod.open) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#101820d9]">
      <div className="relative flex h-full w-full items-center justify-center p-5 text-center">
        <div className="absolute top-5 right-5 z-10 flex flex-nowrap items-center gap-6 mob:left-4 mob:right-4 mob:justify-center">
          <button
            onClick={onDownloadAll}
            className="h-[46px] shrink-0 whitespace-nowrap rounded-[10px] border-2 border-white bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
          >
            {t('btnDownloadAll')}
          </button>
          <button
            onClick={onDownloadCurrent}
            className="h-[46px] shrink-0 whitespace-nowrap rounded-[10px] border-2 border-white bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
          >
            {t('btnDownloadImage')}
          </button>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-3xl text-white transition-colors hover:bg-white/10"
          >
            &times;
          </button>
        </div>

        <div className="relative flex h-full w-full items-center justify-center">
          {total > 1 && (
            <button
              onClick={onPrev}
              disabled={pod.currentIndex === 0}
              className="absolute left-5 top-1/2 z-[5] -translate-y-1/2 flex h-10 w-10 items-center justify-center text-3xl text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/10"
            >
              &lt;
            </button>
          )}

          {orderData ? (
            <canvas
              ref={canvasRef}
              className="max-h-[90%] max-w-[90%] rounded-lg object-contain shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            />
          ) : (
            <img
              ref={imgRef}
              src={current}
              alt={`Order image ${pod.currentIndex + 1}`}
              className="max-h-[90%] max-w-[90%] rounded-lg object-contain shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            />
          )}

          {total > 1 && (
            <button
              onClick={onNext}
              disabled={pod.currentIndex === total - 1}
              className="absolute right-5 top-1/2 z-[5] -translate-y-1/2 flex h-10 w-10 items-center justify-center text-3xl text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/10"
            >
              &gt;
            </button>
          )}
        </div>

        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 p-2 text-base font-normal text-white">
          {pod.currentIndex + 1} / {total}
        </div>
      </div>
    </div>
  )
}
