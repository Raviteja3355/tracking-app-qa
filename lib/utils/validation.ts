/**
 * Input validation and normalisation for the tracking and POD flows.
 * 追踪和 POD 流程的输入验证与规范化。
 *
 * Two distinct inputs require sanitisation before reaching the API:
 *   1. Tracking numbers — URP numbers (UR + 17 digits) need to be identified
 *      because they use a separate POD API endpoint from standard parcels.
 *   2. Postal codes — the POD API requires Canadian codes in strict "A1A 1A1"
 *      format; the zip modal accepts free-form user input and must normalise it.
 *
 * 两类输入在到达 API 前需要处理：
 *   1. 运单号 —— URP 运单号（UR + 17 位数字）需要单独识别，
 *      因为它使用与标准包裹不同的 POD API 端点。
 *   2. 邮政编码 —— POD API 要求加拿大邮编严格遵循 "A1A 1A1" 格式；
 *      邮编弹窗接受用户自由输入，调用 API 前须完成规范化。
 */

import { Tracking } from '@/lib/constants'

/**
 * Returns true if the tracking number is a URP parcel (UniUni Rail Parcel).
 * Used to route POD image and PDF download requests to the correct API endpoint,
 * and to detect URP delivery via the events list rather than the state code.
 *
 * 若运单号为 URP 包裹（UniUni Rail Parcel）则返回 true。
 * 用于将 POD 图片和 PDF 下载请求路由到正确的 API 端点，
 * 以及通过 events 列表（而非 state 码）检测 URP 包裹的投递状态。
 */
export function validateURPTrackingNo(tno: string): boolean {
  if (!tno || typeof tno !== 'string') return false
  return Tracking.URP_REGEX.test(tno)
}

/**
 * Normalises a postal code entered in the zip modal to "A1A 1A1" format.
 * The POD API rejects codes with incorrect spacing or extra characters,
 * so user input (e.g. "a1a1a1", "A1A-1A1") is stripped and reformatted
 * before the API call is made.
 *
 * 将邮编弹窗中用户输入的邮政编码规范化为 "A1A 1A1" 格式。
 * POD API 会拒绝空格不正确或含多余字符的邮编，
 * 因此在发起 API 调用前，需将用户输入（如 "a1a1a1"、"A1A-1A1"）
 * 清洗并重新格式化。
 */
export function formatZipCode(zip: string): string {
  if (!zip || typeof zip !== 'string') return zip
  const clean = zip.replace(/[^a-zA-Z0-9]/g, '')
  if (clean.length >= 6) return clean.substring(0, 3) + ' ' + clean.substring(3, 6)
  if (clean.length >= 3) return clean.substring(0, 3)
  return zip
}
