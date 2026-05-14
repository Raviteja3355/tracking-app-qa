/**
 * POD (Proof of Delivery) photo watermarking.
 * POD（投递证明）照片水印处理。
 *
 * When a recipient views or downloads a POD photo, the image is stamped with
 * the delivery GPS coordinates and timestamp sourced from the tracking scan
 * that was closest to the delivery event. This serves as tamper-evident proof
 * that the photo was taken at the correct location and time.
 *
 * 当收件人查看或下载 POD 照片时，图片会被盖上投递 GPS 坐标和时间戳，
 * 数据来源于距离投递事件最近的追踪扫描记录。
 * 这作为防篡改证明，确认照片拍摄于正确的地点和时间。
 *
 * The watermark is rendered client-side on a Canvas element so it is embedded
 * into the image before display and before any download is triggered — the
 * server never serves a pre-watermarked image.
 *
 * 水印在客户端通过 Canvas 元素渲染，在图片展示和下载触发之前嵌入——
 * 服务端从不提供预先添加水印的图片。
 */

import type { SpathItem, TrackingResult, WatermarkData } from '../types'

/**
 * Extracts the datetime string and GPS coordinates from a spath scan event.
 * 从 spath 扫描事件中提取日期时间字符串和 GPS 坐标。
 */
function generateWatermarkText(orderData: SpathItem): WatermarkData {
  const lat =
    orderData.lat != null && Number(orderData.lat) !== 0
      ? Number(orderData.lat).toFixed(3)
      : ''
  const lng =
    orderData.lng != null && Number(orderData.lng) !== 0
      ? Number(orderData.lng).toFixed(3)
      : ''
  const dateTime = orderData.dateTime?.localTime ?? ''
  return { dateTime, coordinates: { latitude: lat, longitude: lng } }
}

/**
 * Finds the largest font size that fits `text` within `targetWidth` pixels.
 * 找出在 `targetWidth` 像素宽度内能容纳 `text` 的最大字号。
 */
function calculateFontSize(ctx: CanvasRenderingContext2D, text: string, targetWidth: number): number {
  let fontSize = 24
  let min = 12
  let max = 72
  while (min <= max) {
    const mid = Math.floor((min + max) / 2)
    ctx.font = `${mid}px Poppins`
    if (ctx.measureText(text).width <= targetWidth) {
      fontSize = mid
      min = mid + 1
    } else {
      max = mid - 1
    }
  }
  return fontSize
}

/**
 * Draws white text with a layered dark shadow so it remains legible on any photo background.
 * 绘制带有多层深色阴影的白色文字，确保在任何照片背景上都清晰可读。
 */
function drawTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
) {
  ctx.font = `${fontSize}px Poppins`
  ctx.textAlign = 'left'
  const shadows = [
    { o: 1, a: 0.3 }, { o: 2, a: 0.25 }, { o: 3, a: 0.2 },
    { o: 4, a: 0.15 }, { o: 5, a: 0.1 }, { o: 6, a: 0.08 },
    { o: 7, a: 0.06 }, { o: 8, a: 0.04 }, { o: 9, a: 0.03 }, { o: 10, a: 0.02 },
  ]
  for (const s of shadows) {
    ctx.fillStyle = `rgba(0,0,0,${s.a})`
    ctx.fillText(text, x, y + s.o)
  }
  ctx.fillStyle = 'rgba(255,255,255,1)'
  ctx.fillText(text, x, y)
}

/**
 * Draws the watermark overlay onto an already-sized canvas.
 * Timestamp is placed near the top-left; GPS coordinates near the bottom-left.
 * Font size is calculated dynamically so the overlay scales with the image resolution.
 *
 * 在已设置尺寸的 Canvas 上绘制水印叠层。
 * 时间戳置于左上角附近，GPS 坐标置于左下角附近。
 * 字号动态计算，使叠层随图片分辨率自适应缩放。
 */
export function drawWatermarkOnCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  orderData: SpathItem,
) {
  ctx.drawImage(img, 0, 0)
  const data = generateWatermarkText(orderData)
  const isPortrait = canvas.height > canvas.width
  const targetWidth = canvas.width * (isPortrait ? 0.5 : 0.33)

  const dateTimeFontSize = Math.floor(calculateFontSize(ctx, data.dateTime, targetWidth))
  const coordDataFontSize = dateTimeFontSize
  const coordLabelFontSize = Math.floor(coordDataFontSize * 0.8)
  const charWidth = (() => {
    ctx.font = `${dateTimeFontSize}px Poppins`
    return ctx.measureText('M').width
  })()
  const leftMargin = charWidth * 2

  if (data.dateTime) {
    const lineHeight = dateTimeFontSize
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    drawTextWithShadow(ctx, data.dateTime, leftMargin, lineHeight * 2, dateTimeFontSize)
  }

  const { latitude, longitude } = data.coordinates
  if (latitude && longitude) {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'

    const lineHeight = coordDataFontSize
    const labelDataSpacing = lineHeight * 1.5
    const columnSpacing = coordDataFontSize * 3.0
    const bottomMargin = lineHeight * 1.5

    ctx.font = `${coordLabelFontSize}px Poppins`
    const latLabelW = ctx.measureText('Latitude').width
    const lngLabelW = ctx.measureText('Longitude').width
    ctx.font = `${coordDataFontSize}px Poppins`
    const latDataW = ctx.measureText(latitude).width
    const lngDataW = ctx.measureText(longitude).width

    const leftColW = Math.max(latLabelW, latDataW)
    const leftColX = leftMargin
    const rightColX = leftColX + leftColW + columnSpacing
    void lngLabelW
    void lngDataW

    const labelY = canvas.height - bottomMargin - labelDataSpacing
    ctx.font = `${coordLabelFontSize}px Poppins`
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillText('Latitude', leftColX + 2, labelY + 2)
    ctx.fillText('Longitude', rightColX + 2, labelY + 2)
    ctx.fillStyle = 'rgba(255,255,255,1)'
    ctx.fillText('Latitude', leftColX, labelY)
    ctx.fillText('Longitude', rightColX, labelY)

    const dataY = canvas.height - bottomMargin
    drawTextWithShadow(ctx, latitude, leftColX, dataY, coordDataFontSize)
    drawTextWithShadow(ctx, longitude, rightColX, dataY, coordDataFontSize)
  }
}

/**
 * Finds the most recent spath scan event that carries GPS coordinates.
 * Not all scan events include location data; we walk the list backwards to
 * find the last event where lat/lng are non-zero.
 *
 * 找出最近一条带有 GPS 坐标的 spath 扫描事件。
 * 并非所有扫描事件都包含位置数据；
 * 我们从列表末尾向前遍历，找到最后一条 lat/lng 非零的事件。
 */
export function findWatermarkSpathItem(result: TrackingResult): SpathItem | null {
  if (!Array.isArray(result.spath_list) || result.spath_list.length === 0) return null
  for (let i = result.spath_list.length - 1; i >= 0; i--) {
    const item = result.spath_list[i]
    const latValid = Number.isFinite(Number(item.lat)) && Number(item.lat) !== 0
    const lngValid = Number.isFinite(Number(item.lng)) && Number(item.lng) !== 0
    if (latValid || lngValid) return item
  }
  return null
}

/**
 * Resolves which spath event to use as the watermark source.
 * Prefers the last scan event if it has location data; falls back to
 * findWatermarkSpathItem to find the most recent event with coordinates.
 *
 * 确定用作水印数据来源的 spath 事件。
 * 优先使用最后一条扫描事件（如果含有位置数据）；
 * 否则回退到 findWatermarkSpathItem，找最近一条含坐标的事件。
 */
export function resolveWatermarkData(result: TrackingResult): SpathItem | null {
  if (!Array.isArray(result.spath_list) || result.spath_list.length === 0) return null
  const last = result.spath_list[result.spath_list.length - 1]
  if (last && (Number(last.lat) !== 0 || Number(last.lng) !== 0 || last.dateTime)) {
    return last
  }
  return findWatermarkSpathItem(result)
}

/**
 * Full pipeline: loads a POD image URL, draws the watermark overlay, and
 * returns a Blob ready for display in the POD modal or triggering a download.
 *
 * 完整流程：加载 POD 图片 URL，绘制水印叠层，
 * 返回可用于 POD 弹窗展示或触发下载的 Blob。
 */
export async function createWatermarkedBlob(imageSrc: string, spathItem: SpathItem): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
      img.crossOrigin = 'anonymous'
    }
    img.src = imageSrc
    img.onload = () => {
      try {
        canvas.width = img.width
        canvas.height = img.height
        drawWatermarkOnCanvas(canvas, ctx, img, spathItem)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
          'image/jpeg',
          0.9,
        )
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
  })
}

/**
 * Determines the file extension to use when saving a downloaded POD image.
 * POD images arrive from multiple sources (base64 data URLs from the standard API,
 * CDN URLs from the URP API), so the extension must be inferred from the
 * blob MIME type or the URL, not assumed to be JPEG.
 *
 * 确定保存下载的 POD 图片时使用的文件扩展名。
 * POD 图片来自多种来源（标准 API 的 base64 data URL、URP API 的 CDN URL），
 * 因此扩展名须从 blob MIME 类型或 URL 中推断，不能直接假设为 JPEG。
 */
export function getImageFileExtension(imageUrl: string, blob?: Blob): string {
  if (blob?.type) {
    if (blob.type.includes('png')) return 'png'
    if (blob.type.includes('gif')) return 'gif'
    if (blob.type.includes('webp')) return 'webp'
    return 'jpg'
  }
  if (imageUrl.startsWith('data:')) {
    const m = imageUrl.match(/data:([^;]+);/)
    if (m?.[1]) {
      if (m[1].includes('png')) return 'png'
      if (m[1].includes('gif')) return 'gif'
      if (m[1].includes('webp')) return 'webp'
    }
    return 'jpg'
  }
  const urlMatch = imageUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/)
  if (urlMatch?.[1]) {
    const ext = urlMatch[1].toLowerCase()
    if (['png', 'gif', 'webp', 'jpg', 'jpeg'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext
  }
  return 'jpg'
}
