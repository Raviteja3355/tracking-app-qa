import type { SpathItem, TrackingResult } from '../types'

interface WatermarkData {
  dateTime: string
  coordinates: { latitude: string; longitude: string }
}

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

export function resolveWatermarkData(result: TrackingResult): SpathItem | null {
  if (!Array.isArray(result.spath_list) || result.spath_list.length === 0) return null
  const last = result.spath_list[result.spath_list.length - 1]
  if (last && (Number(last.lat) !== 0 || Number(last.lng) !== 0 || last.dateTime)) {
    return last
  }
  return findWatermarkSpathItem(result)
}

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
