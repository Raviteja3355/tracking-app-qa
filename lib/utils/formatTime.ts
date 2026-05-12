import moment from 'moment'

export interface FormattedTime {
  date: string
  time: string
}

export function formatTime(timestamp: number): FormattedTime {
  const d = new Date(timestamp * 1000)
  return {
    date:
      d.getUTCFullYear() +
      '-' +
      String(d.getUTCMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getUTCDate()).padStart(2, '0'),
    time:
      String(d.getUTCHours()).padStart(2, '0') +
      ':' +
      String(d.getUTCMinutes()).padStart(2, '0') +
      ':' +
      String(d.getUTCSeconds()).padStart(2, '0'),
  }
}

export function formatTimeCST(timestamp: number): FormattedTime {
  const d = moment.utc(new Date((timestamp - 6 * 3600) * 1000))
  return {
    time: d.format('HH:mm:ss'),
    date: d.format('YYYY-MM-DD'),
  }
}

export function formatTimeStrCST(strCST: string): FormattedTime {
  const date = new Date(strCST)
  const timestamp = date.getTime() / 1000
  return formatTimeCST(timestamp)
}

export function isSevenDaysFromNow(timestamp: number): boolean {
  const now = moment().unix()
  const diff = Math.abs(timestamp - now) / (3600 * 24)
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
