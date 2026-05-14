import { useState, useCallback } from 'react'
import { fetchPodImages, downloadPodPdf } from '../api/pod'
import type { PodModalState, TrackingResult } from '../types'
import {
  createWatermarkedBlob,
  resolveWatermarkData,
  getImageFileExtension,
} from '../utils/watermark'

const INITIAL_STATE: PodModalState = {
  open: false,
  images: [],
  currentIndex: 0,
  orderNo: '',
  zipCode: '',
  fromSecondAPI: false,
  orderData: null,
}

export function usePod(validResults: TrackingResult[]) {
  const [pod, setPod] = useState<PodModalState>(INITIAL_STATE)
  const [podLoading, setPodLoading] = useState(false)

  const openPod = useCallback(
    async (tno: string, zip: string, trackingIndex: number) => {
      setPodLoading(true)
      try {
        const images = await fetchPodImages(tno, zip)
        const orderData = validResults[trackingIndex] ?? null
        const isURP = tno.match(/^UR\d{17}$/)
        setPod({
          open: true,
          images,
          currentIndex: 0,
          orderNo: tno,
          zipCode: zip,
          fromSecondAPI: !!isURP,
          orderData,
        })
      } finally {
        setPodLoading(false)
      }
    },
    [validResults],
  )

  const closePod = useCallback(() => {
    setPod(INITIAL_STATE)
  }, [])

  const navigate = useCallback((direction: 'prev' | 'next') => {
    setPod((prev) => {
      const next =
        direction === 'prev'
          ? Math.max(0, prev.currentIndex - 1)
          : Math.min(prev.images.length - 1, prev.currentIndex + 1)
      return { ...prev, currentIndex: next }
    })
  }, [])

  const downloadCurrent = useCallback(async () => {
    if (!pod.images.length) return
    const url = pod.images[pod.currentIndex]

    if (pod.fromSecondAPI && pod.orderData) {
      const spathItem = resolveWatermarkData(pod.orderData)
      if (spathItem) {
        const blob = await createWatermarkedBlob(url, spathItem)
        triggerDownload(
          URL.createObjectURL(blob),
          `watermarked_order_image_${pod.orderNo}_${pod.currentIndex + 1}.jpg`,
          true,
        )
        return
      }
    }

    const response = await fetch(url)
    const blob = await response.blob()
    const ext = getImageFileExtension(url, blob)
    triggerDownload(
      URL.createObjectURL(blob),
      `order_image_${pod.orderNo}_${pod.currentIndex + 1}.${ext}`,
      true,
    )
  }, [pod])

  const downloadAll = useCallback(async () => {
    if (!pod.images.length) return
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()

    const spathItem =
      pod.fromSecondAPI && pod.orderData ? resolveWatermarkData(pod.orderData) : null

    for (let i = 0; i < pod.images.length; i++) {
      const imageUrl = pod.images[i]
      if (spathItem) {
        const blob = await createWatermarkedBlob(imageUrl, spathItem)
        zip.file(`watermarked_order_image_${pod.orderNo}_${i + 1}.jpg`, blob)
      } else {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        zip.file(`order_image_${pod.orderNo}_${i + 1}.jpg`, blob)
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    triggerDownload(
      URL.createObjectURL(zipBlob),
      `order_images_${pod.orderNo}.zip`,
      true,
    )
  }, [pod])

  const downloadPdf = useCallback(async (tno: string, zip: string) => {
    setPodLoading(true)
    try {
      const { data, filename } = await downloadPodPdf(tno, zip)
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${data}`
      link.download = filename
      link.click()
    } finally {
      setPodLoading(false)
    }
  }, [])

  return {
    pod,
    podLoading,
    openPod,
    closePod,
    navigate,
    downloadCurrent,
    downloadAll,
    downloadPdf,
  }
}

function triggerDownload(url: string, filename: string, revoke: boolean) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  if (revoke) URL.revokeObjectURL(url)
}
