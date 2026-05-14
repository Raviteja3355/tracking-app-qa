import type { SpathItem, TrackingResult } from '@/lib/types'
import { formatTime, formatTimeCST, formatTimeStrCST, isSevenDaysFromNow } from '@/lib/utils/formatTime'
import { validateURPTrackingNo } from '@/lib/utils/validation'

interface Props {
  item: SpathItem
  index: number
  totalItems: number
  result: TrackingResult
  onViewPod: () => void
}

function DotCurrent() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="6" fill="#FF9E46" />
    </svg>
  )
}

function DotCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.97095 2.27901C9.093 2.40104 9.09302 2.59891 8.97099 2.72096L3.97169 7.72095C3.84966 7.843 3.65181 7.84302 3.52976 7.721L1.02906 5.221C0.907004 5.09898 0.906976 4.90112 1.029 4.77906C1.15102 4.657 1.34888 4.65698 1.47094 4.779L3.75066 7.05807L8.52901 2.27904C8.65104 2.157 8.84891 2.15698 8.97095 2.27901Z"
        fill="#FF9E46"
      />
    </svg>
  )
}

function ReturnContact() {
  return (
    <div>
      <div>
        Please contact{' '}
        <a
          href="https://www.uniuni.com/support/#form"
          className="font-bold underline text-[#FF9E46]"
        >
          Customer Service
        </a>
      </div>
      <div>Immediately to reschedule the final delivery</div>
    </div>
  )
}

function resolveTimeDate(item: SpathItem, result: TrackingResult): { time: string; date: string } {
  if (item.state === 192 || item.state === 198) {
    return formatTimeCST(item.pathTime!)
  }
  if (item.pathTime) {
    const fmt = formatTime(item.pathTime)
    return {
      time: fmt.time,
      date: item.state === 190 ? fmt.date + ' (UTC)' : fmt.date,
    }
  }
  if (!item.pathTime) {
    if (result.urlType === 'ltian' || !item.time) {
      const parts = item.dateTime?.localTime?.split(' ') ?? ['', '']
      return { date: parts[0], time: parts[1] }
    }
    return formatTimeStrCST(item.time!)
  }
  return { time: '', date: '' }
}

export default function TimelineItem({ item, index, totalItems, result, onViewPod }: Props) {
  const isNewest = index === totalItems - 1
  const isOldest = index === 0

  const { time, date } = resolveTimeDate(item, result)

  const displayTime = item.pathTime && item.state !== 192 && item.state !== 198
    ? formatTime(item.pathTime).time
    : time
  const displayDate = (() => {
    if (item.state === 192 || item.state === 198) return formatTimeCST(item.pathTime!).date
    if (item.pathTime) {
      const d = formatTime(item.pathTime).date
      return item.state === 190 ? d + ' (UTC)' : d
    }
    return date
  })()

  const pathInfo = item.pathTime || item.dateTime ? item.pathInfo : (item.content ?? item.pathInfo)
  const pathAddress = item.pathTime || item.dateTime ? item.pathAddress : (item.location ?? item.pathAddress)

  const isDeliveredItem =
    item.state === 203 ||
    (!item.state && validateURPTrackingNo(result.tno) && item.pathInfo === 'Delivered')

  const showReturnContact =
    item.state === 213 && isNewest && isSevenDaysFromNow(item.pathTime!)

  const showCurrentDot = isNewest
  const showCheckDot = !isNewest
  const connectorClass = isOldest ? 'border-transparent' : 'border-dashed border-l border-[#d9d9d6]'

  return (
    <>
      {/* Desktop */}
      <div className="mob:hidden">
        <div className="flex items-center">
          <div className="mr-[30px] w-[180px] text-end text-sm">{displayTime}</div>
          <div className="flex items-center">
            <span className={showCurrentDot ? 'block' : 'hidden'}><DotCurrent /></span>
            <span className={showCheckDot ? 'block' : 'hidden'}><DotCheck /></span>
            <div className="ml-1.5 w-[99%] pl-7.5 font-poppins text-lg leading-normal font-semibold text-[#212529]">
              {pathInfo}.
            </div>
          </div>
        </div>
        <div className="flex">
          <div className="mr-[30px] w-[180px] text-end text-sm">{displayDate}</div>
          <div className={`ml-1.5 pl-10 pb-[30px] text-sm leading-[21px] ${connectorClass}`}>
            <div>{pathAddress}</div>
            {showReturnContact && <ReturnContact />}
            {isDeliveredItem && (
              <div onClick={onViewPod} className="mt-2.5 cursor-pointer text-base font-semibold text-[#ff9d00]">
                View Delivery Confirmation
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="desk:hidden">
        <div className="flex items-center">
          <span className={showCurrentDot ? 'block' : 'hidden'}><DotCurrent /></span>
          <span className={showCheckDot ? 'block' : 'hidden'}><DotCheck /></span>
          <span className="ml-1 font-[family-name:var(--font-poppins)] text-base font-normal text-[#212529]">
            {displayTime}
          </span>
        </div>
        <div
          className={`ml-[5px] pb-6 pl-[18px] text-[11px] leading-4 ${connectorClass}`}
        >
          <div className="text-base font-normal text-[#212529]">{displayDate}</div>
          <div className="mt-1 text-base font-semibold text-[#212529]">{pathInfo}.</div>
          <div className="mt-1 text-base font-normal text-[#212529]">{pathAddress}</div>
          {showReturnContact && <ReturnContact />}
          {isDeliveredItem && (
            <div onClick={onViewPod} className="mt-2.5 cursor-pointer text-[13px] font-semibold text-[#ff9d00]">
              View Delivery Confirmation
            </div>
          )}
        </div>
      </div>
    </>
  )
}
