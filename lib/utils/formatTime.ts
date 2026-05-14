/**
 * Time formatting utilities for the tracking result display.
 * 追踪结果展示所需的时间格式化工具。
 *
 * The tracking API returns event timestamps as Unix seconds (UTC). Different
 * parts of the UI need different formats:
 *   - Timeline events → date + time string for scan history
 *   - EDD block       → human-readable label ("Today, May 14") + 12-hour window
 *
 * 追踪 API 返回的事件时间戳为 Unix 秒（UTC）。UI 不同区域需要不同格式：
 *   - 时间线事件 → 日期 + 时间字符串，用于扫描历史展示
 *   - EDD 区块   → 易读标签（"Today, May 14"）+ 12 小时制时间窗口
 *
 * Some Canadian warehouse scan events use CST (UTC-6) regardless of the
 * delivery province, so CST-specific variants are provided alongside UTC.
 * 部分加拿大仓库的扫描事件固定使用 CST（UTC-6），与配送省份无关，
 * 因此在 UTC 版本之外提供了 CST 专用变体。
 */

import { DateTime } from '@/lib/constants'

export interface FormattedTime {
  date: string
  time: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Formats a Unix timestamp (UTC) into date + time strings for timeline event display.
 * 将 Unix 时间戳（UTC）格式化为日期 + 时间字符串，用于时间线事件展示。
 */
export function formatTime(timestamp: number): FormattedTime {
  const d = new Date(timestamp * 1000)
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
  }
}

/**
 * Same as formatTime but adjusts to CST — used for warehouse scan events that the API stores in CST.
 * 同 formatTime，但调整为 CST 时区——用于 API 以 CST 存储的仓库扫描事件。
 * CST = UTC-6; shift timestamp by -6h then read as UTC.
 */
export function formatTimeCST(timestamp: number): FormattedTime {
  const d = new Date((timestamp - 6 * 3600) * 1000)
  return {
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  }
}

/**
 * Accepts an ISO date-time string (newer API fields) and forwards to formatTimeCST.
 * 接受 ISO 日期时间字符串（较新的 API 字段），转发给 formatTimeCST 处理。
 */
export function formatTimeStrCST(strCST: string): FormattedTime {
  const date = new Date(strCST)
  const timestamp = date.getTime() / 1000
  return formatTimeCST(timestamp)
}

/**
 * Guards whether the EDD estimated delivery date is close enough to show.
 * The EDD block is only displayed if the estimate falls within 7 days of today —
 * a stale estimate from weeks ago is not useful to the recipient.
 *
 * 控制是否展示 EDD 预计送达日期。
 * 只有当预计日期距今 7 天以内时才显示 EDD 区块——
 * 几周前的过期预估对收件人没有意义。
 */
export function isSevenDaysFromNow(timestamp: number): boolean {
  const diff = Math.abs(timestamp - Date.now() / 1000) / (3600 * 24)
  return diff <= 7
}

/**
 * Converts a 24-hour time string to 12-hour A.M./P.M. format.
 * The EDD API returns delivery windows in 24h (e.g. "14:30"); the UI
 * displays them as "2:30 P.M." for the North American audience.
 *
 * 将 24 小时制时间字符串转为 12 小时 A.M./P.M. 格式。
 * EDD API 返回的配送时间窗口为 24 小时制（如 "14:30"），
 * UI 面向北美用户，需显示为 "2:30 P.M."。
 */
export function formatTo12Hour(timeStr: string): string {
  if (!timeStr || typeof timeStr !== 'string') return ''
  const parts = timeStr.split(':')
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1] ?? '00'
  const period = hours >= 12 ? 'P.M.' : 'A.M.'
  hours = hours % 12 || 12
  return `${hours}:${minutes} ${period}`
}

/**
 * Builds the human-readable date label shown in the EDD block on each result card.
 * e.g. "Today, May 14" or "Wednesday, May 15".
 * Requires the caller to pass today's date string so the "Today" label is
 * evaluated in the correct delivery timezone (see getTodayInTimezone).
 *
 * 构建每张结果卡片 EDD 区块中显示的易读日期标签。
 * 例如 "Today, May 14" 或 "Wednesday, May 15"。
 * 调用方须传入当天日期字符串，以便在正确的配送时区中判断是否为"今天"
 * （参见 getTodayInTimezone）。
 */
export function formatDateLabel(dateStr: string, todayStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const isToday = dateStr === todayStr
  const dayLabel = isToday ? 'Today' : DateTime.WEEKDAYS[d.getDay()]
  const monthName = DateTime.MONTHS[d.getMonth()]
  const dayNum = String(d.getDate()).padStart(2, '0')
  return `${dayLabel}, ${monthName} ${dayNum}`
}

/**
 * Returns the current date string (YYYY-MM-DD) in the given timezone.
 * Used to determine whether the EDD date is "today" from the recipient's
 * perspective, not the browser's local timezone.
 *
 * 返回指定时区下的当前日期字符串（YYYY-MM-DD）。
 * 用于从收件人所在时区的视角判断 EDD 日期是否为"今天"，
 * 而非浏览器的本地时区。
 */
export function getTodayInTimezone(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone })
}
