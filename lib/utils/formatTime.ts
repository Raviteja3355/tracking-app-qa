export interface FormattedTime {
  date: string
  time: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatTime(timestamp: number): FormattedTime {
  const d = new Date(timestamp * 1000)
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
  }
}

// CST = UTC-6; shift timestamp by -6h then read as UTC
export function formatTimeCST(timestamp: number): FormattedTime {
  const d = new Date((timestamp - 6 * 3600) * 1000)
  return {
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  }
}

export function formatTimeStrCST(strCST: string): FormattedTime {
  const date = new Date(strCST)
  const timestamp = date.getTime() / 1000
  return formatTimeCST(timestamp)
}

export function isSevenDaysFromNow(timestamp: number): boolean {
  const diff = Math.abs(timestamp - Date.now() / 1000) / (3600 * 24)
  return diff <= 7
}

export function formatTo12Hour(timeStr: string): string {
  if (!timeStr || typeof timeStr !== 'string') return ''
  const parts = timeStr.split(':')
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1] ?? '00'
  const period = hours >= 12 ? 'P.M.' : 'A.M.'
  hours = hours % 12 || 12
  return `${hours}:${minutes} ${period}`
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function formatDateLabel(dateStr: string, todayStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const isToday = dateStr === todayStr
  const dayLabel = isToday ? 'Today' : WEEKDAYS[d.getDay()]
  const monthName = MONTHS[d.getMonth()]
  const dayNum = String(d.getDate()).padStart(2, '0')
  return `${dayLabel}, ${monthName} ${dayNum}`
}

export function getTodayInTimezone(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone })
}
