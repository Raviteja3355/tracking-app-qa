/**
 * Manages POD (Proof of Delivery) modal state and download logic.
 * 管理 POD（投递证明）弹窗状态与下载逻辑。
 *
 * Two types of parcels trigger the POD flow differently:
 * 两类包裹以不同方式触发 POD 流程：
 *
 *   Standard parcels — recipient enters their postal code in the zip modal;
 *   the code is passed to the API as identity verification before images are returned.
 *   标准包裹 —— 收件人在邮编弹窗中输入邮政编码，
 *   邮编作为身份验证传给 API，验证通过后才返回图片。
 *
 *   URP parcels (UR + 17 digits) — zip verification is still required (same modal
 *   as standard parcels). The zip is forwarded to the URP-specific API endpoint
 *   (/getsignaturenew-urp). URP scan data includes GPS coordinates in the spath
 *   list, so watermarking is applied to both display and download. Standard parcel
 *   scans do not carry GPS data, so their images are never watermarked.
 *   URP 包裹（UR + 17 位数字）—— 同样需要邮编验证（与标准包裹共用同一弹窗）。
 *   邮编会被转发给 URP 专用 API 端点（/getsignaturenew-urp）。
 *   URP 扫描数据的 spath 列表中包含 GPS 坐标，因此展示和下载时都会添加水印。
 *   标准包裹的扫描数据不含 GPS，所以图片不会加水印。
 *
 * `fromSecondAPI` in PodModalState flags whether the current session is URP,
 * which gates all watermark logic in this hook and in PodModal.tsx.
 * PodModalState 中的 `fromSecondAPI` 标记当前会话是否为 URP 包裹，
 * 控制本 hook 和 PodModal.tsx 中所有水印相关逻辑的开关。
 *
 * ── Architecture notes ────────────────────────────────────────────────────────
 * 架构说明
 *
 * Pain points of this approach:
 * 这种方式的痛点：
 *
 *   a. Hidden coupling to useTracking via `validResults`.
 *      This hook receives `validResults` as a parameter solely so `openPod` can
 *      read `validResults[trackingIndex]` to get GPS spath data for watermarking.
 *      This means usePod cannot be used independently — it is silently coupled
 *      to whatever array useTracking produces. If validResults is stale or
 *      ordered differently, the wrong TrackingResult is passed to the watermark
 *      utility.
 *      通过 `validResults` 参数与 useTracking 形成隐式耦合。
 *      此 hook 接收 `validResults` 仅仅是为了让 `openPod` 能通过索引取得
 *      用于水印的 spath GPS 数据。这意味着 usePod 无法独立使用——它悄悄依赖
 *      useTracking 产出的数组。若 validResults 过期或顺序不同，
 *      传入水印工具的 TrackingResult 就会出错。
 *
 *   b. Download orchestration belongs in a utility, not a hook.
 *      `downloadCurrent` and `downloadAll` contain the full watermark-or-not
 *      branching logic. This logic does not depend on any React state beyond
 *      `pod` — it is a pure async operation that would be easier to test and
 *      maintain as a standalone function in utils/podDownload.ts.
 *      下载编排逻辑应属于工具函数，而非 hook。
 *      `downloadCurrent` 和 `downloadAll` 包含完整的"加水印/不加水印"分支逻辑。
 *      这些逻辑除 `pod` 外不依赖任何 React 状态，是纯异步操作，
 *      拆成 utils/podDownload.ts 中的独立函数会更易测试和维护。
 *
 *   c. `alert()` calls inside a hook.
 *      Calling `alert()` in download error paths couples the hook to the browser
 *      environment and makes the error handling strategy impossible to customise
 *      from the component layer.
 *      hook 内部直接调用 `alert()`。
 *      在下载错误路径中调用 `alert()` 将 hook 与浏览器环境绑定，
 *      组件层无法自定义错误处理策略。
 *
 * Why this approach was chosen anyway:
 * 为何仍然选择这种方式：
 *
 *   - POD is a self-contained modal flow. No other component needs to share POD
 *     state, so collocating state and behaviour in one hook is a net simplification
 *     versus lifting state up through the component tree.
 *     POD 是自包含的弹窗流程，没有其他组件需要共享 POD 状态。
 *     将状态和行为收在一个 hook 中，比沿组件树向上提升状态更简洁。
 *
 *   - Watermark logic (createWatermarkedBlob, resolveWatermarkData) is already
 *     separated into utils/watermark.ts. The hook is a thin orchestration layer
 *     on top; the algorithmic complexity lives outside.
 *     水印逻辑（createWatermarkedBlob、resolveWatermarkData）已分离到
 *     utils/watermark.ts。此 hook 只是薄薄的编排层，算法复杂度在外部。
 *
 *   - The `validResults` coupling is a known smell. The correct fix is to pass
 *     the specific TrackingResult directly to openPod instead of an index into
 *     a shared array. That refactor is safe to do without any architecture change.
 *     `validResults` 耦合是已知的代码异味。正确的修复是直接将
 *     TrackingResult 传给 openPod，而非传入共享数组的索引。
 *     这个重构不需要架构改动，随时可以安全进行。
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchPodImages } from '../api/pod'
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
  const { t } = useTranslation()
  const [pod, setPod] = useState<PodModalState>(INITIAL_STATE)
  const [podLoading, setPodLoading] = useState(false)
  const [podError, setPodError] = useState<string | null>(null)

  const openPod = useCallback(
    async (tno: string, zip: string, trackingIndex: number) => {
      setPodLoading(true)
      setPodError(null)
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
          fromSecondAPI: !!isURP, // URP parcels carry GPS → watermark enabled / URP 包裹含 GPS → 启用水印
          orderData,
        })
      } catch (err) {
        setPodError(err instanceof Error ? err.message : 'POD not found')
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

    // URP + GPS data found → embed watermark before download
    // URP 包裹且找到 GPS 数据 → 下载前嵌入水印
    if (pod.fromSecondAPI && pod.orderData) {
      const spathItem = resolveWatermarkData(pod.orderData)
      if (spathItem) {
        try {
          const blob = await createWatermarkedBlob(url, spathItem)
          triggerDownload(
            URL.createObjectURL(blob),
            `watermarked_order_image_${pod.orderNo}_${pod.currentIndex + 1}.jpg`,
            true,
          )
        } catch (err) {
          if (err instanceof Error && err.message === 'Failed to load image') {
            alert(t('errorLoadWatermark'))
          } else {
            alert(t('errorDownloadWatermark'))
          }
        }
        return
      }
    }

    // Standard parcel or no GPS data → download raw image
    // 标准包裹或无 GPS 数据 → 直接下载原始图片
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const ext = getImageFileExtension(url, blob)
      triggerDownload(
        URL.createObjectURL(blob),
        `order_image_${pod.orderNo}_${pod.currentIndex + 1}.${ext}`,
        true,
      )
    } catch {
      alert(t('errorDownloadImage'))
    }
  }, [pod, t])

  const downloadAll = useCallback(async () => {
    if (!pod.images.length) return
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()

      // Resolve once; null means standard parcel → no watermark for any image in the batch
      // 只解析一次；null 表示标准包裹 → 批量图片均不加水印
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
    } catch {
      alert(t('errorDownloadZip'))
    }
  }, [pod, t])

  const clearPodError = useCallback(() => setPodError(null), [])

  return {
    pod,
    podLoading,
    podError,
    clearPodError,
    openPod,
    closePod,
    navigate,
    downloadCurrent,
    downloadAll,
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
