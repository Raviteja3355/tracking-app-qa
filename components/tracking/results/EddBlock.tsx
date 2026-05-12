import type { TrackingResult, EddData } from '@/lib/types'
import { formatTime, formatTo12Hour, getTodayInTimezone } from '@/lib/utils/formatTime'
import { validateURPTrackingNo } from '@/lib/utils/validation'

const CLOCK_SVG = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2 shrink-0"
  >
    <circle cx="12" cy="12" r="9" stroke="#101820" strokeWidth="1.8" />
    <path d="M12 7v5l3 2" stroke="#101820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Props {
  result: TrackingResult
  eddData: EddData | undefined
}

export default function EddBlock({ result, eddData }: Props) {
  if (result.country !== 'US') return null
  if (!eddData?.edd_enabled) return null

  const isDelivered =
    result.state === 203 ||
    result.state === 228 ||
    (validateURPTrackingNo(result.tno) &&
      result.events?.some((e) => e.pathInfo === 'Delivered'))

  if (isDelivered) {
    let deliveryDate: string | null = null
    let deliveryTime: string | null = null

    for (const item of result.spath_list ?? []) {
      const isDeliveredItem =
        item.state === 203 ||
        item.state === 228 ||
        (validateURPTrackingNo(result.tno) && item.pathInfo === 'Delivered')
      if (isDeliveredItem) {
        if (item.pathTime) {
          const fmt = formatTime(item.pathTime)
          deliveryDate = fmt.date
          deliveryTime = fmt.time
        } else if (item.dateTime?.localTime) {
          const parts = item.dateTime.localTime.split(' ')
          deliveryDate = parts[0]
          deliveryTime = parts[1]
        }
        break
      }
    }

    if (!deliveryDate || !deliveryTime) return <UnavailableBlock />

    const d = new Date(deliveryDate + 'T00:00:00')
    const timeParts = deliveryTime.split(':')
    let h = parseInt(timeParts[0], 10)
    const m = timeParts[1]
    const period = h >= 12 ? 'P.M.' : 'A.M.'
    h = h % 12 || 12

    return (
      <div className="mb-[30px] mt-2.5 font-[family-name:var(--font-poppins)] mob:px-5">
        <p className="mb-2 text-base font-normal text-black mob:text-sm">Delivered</p>
        <p className="text-[36px] font-semibold leading-[1.2] text-[#f79045] mob:text-2xl">
          {WEEKDAYS[d.getDay()]}, {MONTHS[d.getMonth()]} {String(d.getDate()).padStart(2, '0')}
        </p>
        <p className="mb-3 text-[26px] font-semibold text-black mob:text-lg">
          at {h}:{m} {period}
        </p>
      </div>
    )
  }

  if (result.state === 190 || result.state === 1870) {
    return (
      <div className="mt-7 mb-[50px] flex items-center font-[family-name:var(--font-poppins)] text-base text-black mob:px-5 mob:text-sm">
        {CLOCK_SVG}
        Estimated delivery will be available once your parcel arrives at UniUni&apos;s facility.
      </div>
    )
  }

  const estimate = eddData.delivery_estimate
  if (estimate?.estimated_delivery_date) {
    const today = getTodayInTimezone(estimate.timezone ?? 'America/New_York')
    if (estimate.estimated_delivery_date >= today) {
      const eddDate = new Date(estimate.estimated_delivery_date + 'T00:00:00')
      const isToday = estimate.estimated_delivery_date === today
      const dayLabel = isToday ? 'Today' : WEEKDAYS[eddDate.getDay()]
      const monthName = MONTHS[eddDate.getMonth()]
      const dayNum = String(eddDate.getDate()).padStart(2, '0')
      const timeStart = formatTo12Hour(estimate.estimated_delivery_time_start ?? '')
      const timeEnd = formatTo12Hour(estimate.estimated_delivery_time_end ?? '')

      return (
        <div className="mb-[30px] mt-2.5 font-[family-name:var(--font-poppins)] mob:px-5">
          <p className="mb-2 text-base font-normal text-black mob:text-sm">Estimated Delivery</p>
          <p className="text-[36px] font-semibold leading-[1.2] text-[#f79045] mob:text-2xl">
            {dayLabel}, {monthName} {dayNum}
          </p>
          <p className="mb-3 text-[26px] font-semibold text-black mob:text-lg">
            between {timeStart} – {timeEnd}
          </p>
          <p className="text-xs font-normal text-black">
            Delivery date and time are estimates only. Actual delivery may vary.
          </p>
        </div>
      )
    }
  }

  return <UnavailableBlock />
}

function UnavailableBlock() {
  return (
    <div className="mt-7 mb-[50px] flex items-center font-[family-name:var(--font-poppins)] text-base text-black mob:px-5 mob:text-sm">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2 shrink-0"
      >
        <circle cx="12" cy="12" r="9" stroke="#101820" strokeWidth="1.8" />
        <path d="M12 7v5l3 2" stroke="#101820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Estimated delivery is currently unavailable.
    </div>
  )
}
