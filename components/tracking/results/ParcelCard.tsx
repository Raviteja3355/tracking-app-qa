'use client'

import { useState, useEffect } from 'react'
import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import type { TrackingResult, EddData, NoticeItem } from '@/lib/types'
import { fetchWarehouseNotices } from '@/lib/api/notice'
import { validateURPTrackingNo } from '@/lib/utils/validation'
import ResultCard from './ResultCard'

interface Props {
  result: TrackingResult
  index: number
  isFirst: boolean
  eddData: EddData | undefined
  isOpen: boolean
  collapsible?: boolean
  onToggle: () => void
  onViewPod: (tno: string, trackingIndex: number) => void
  onDownloadPod: (index: number) => void
  onOpenPiecesView: (index: number) => void
}

function dotClass(result: TrackingResult): string {
  const isURPDelivered =
    validateURPTrackingNo(result.tno) &&
    result.events?.some((e) => e.pathInfo === 'Delivered')

  if (result.state === 203 || result.state === 228 || isURPDelivered) return 'item-dot-overview-green'
  if (result.state === 190 || result.state === 1870) return 'item-dot-overview-yellow'
  return 'item-dot-overview-blue'
}


function FolderSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M11.45 2.88017H14.52C18.21 2.88017 20.01 4.85017 20 8.89017V13.7602C20 17.6202 17.62 20.0002 13.75 20.0002H6.24C2.39 20.0002 0 17.6202 0 13.7502V6.24017C0 2.10017 1.84 0.000170661 5.47 0.000170661H7.05C7.981 -0.00982934 8.85 0.420171 9.42 1.15017L10.3 2.32017C10.58 2.67017 11 2.88017 11.45 2.88017ZM5.37 13.2902H14.63C15.04 13.2902 15.37 12.9502 15.37 12.5402C15.37 12.1202 15.04 11.7902 14.63 11.7902H5.37C4.95 11.7902 4.62 12.1202 4.62 12.5402C4.62 12.9502 4.95 13.2902 5.37 13.2902Z" fill="#FF9E46" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.6665 1.33341L6.33317 6.00008L1.6665 10.6667" stroke="#FF9E46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NoticeBlock({ notices }: { notices: NoticeItem[] }) {
  if (!notices.length) return null
  return (
    <div style={{ marginTop: 20, flexDirection: 'column', display: 'flex' }}>
      {notices.map((n, i) => (
        <div key={i} style={{ display: 'flex' }}>
          <div>
            <svg width="25" height="21" viewBox="0 0 25 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.3827 0C11.5517 0 10.8394 0.469274 10.2458 1.52514L0.51109 17.4804C-0.676076 19.4749 0.273657 21 2.64799 21H22.2362C24.7293 21 25.679 19.3575 24.4918 17.4804L14.6384 1.40782C14.0448 0.469274 13.2138 0 12.3827 0ZM12.5015 5.27933C13.095 5.27933 13.4512 5.51397 13.8073 5.86592C14.1635 6.21788 14.2822 6.68715 14.2822 7.15642C14.2822 7.6257 13.5699 11.0279 13.3325 13.4916H11.5517C11.3143 11.0279 10.602 7.6257 10.602 7.15642C10.602 6.68715 10.8394 6.21788 11.1956 5.86592C11.5517 5.51397 12.0266 5.27933 12.5015 5.27933ZM12.5015 14.5475C12.9763 14.5475 13.4512 14.6648 13.8073 15.0168C14.1635 15.3687 14.4009 15.838 14.4009 16.3073C14.4009 16.8939 14.1635 17.2458 13.8073 17.5978C13.4512 17.9497 12.9763 18.067 12.5015 18.067C12.0266 18.067 11.5517 17.9497 11.1956 17.5978C10.8394 17.2458 10.602 16.8939 10.602 16.3073C10.602 15.838 10.8394 15.3687 11.1956 15.0168C11.5517 14.6648 12.0266 14.5475 12.5015 14.5475Z" fill="#FF0A0A" />
            </svg>
          </div>
          <div style={{ marginLeft: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: '24px', color: '#FF0A0A' }}>{n.title}</div>
            <div style={{ fontSize: 10, lineHeight: '24px', color: '#000' }}>{n.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ParcelCard({
  result,
  index,
  isFirst,
  eddData,
  isOpen,
  collapsible = true,
  onToggle,
  onViewPod,
  onDownloadPod,
  onOpenPiecesView,
}: Props) {
  const [notices, setNotices] = useState<NoticeItem[]>([])

  useEffect(() => {
    const spath = result.spath_list ?? []
    const last = spath[spath.length - 1]
    if (last?.warehouse && last.warehouse > 0) {
      fetchWarehouseNotices(last.warehouse, result.country).then(setNotices)
    }
  }, [result])

  const isTicket = !!result.master_tno

  const { t } = useTranslation()

  if (isTicket) {
    const dot = dotClass(result)
    const latestStatus = result.spath_list?.[result.spath_list.length - 1]?.pathInfo ?? ''
    const displayTno = result.selected_tno ?? result.tno
    const overviewClass = isFirst ? 'overview-first' : 'overview'

    return (
      <div
        className={overviewClass}
        style={{ flexDirection: 'column', alignItems: 'start', cursor: 'pointer' }}
        onClick={() => onOpenPiecesView(index)}
      >
        <div className="ticket-overview">
          <div className="piece-overview" style={{ display: 'flex', alignItems: 'center' }}>
            <FolderSVG />
            <span style={{ margin: '0 8px' }}>
              {t('pieceShipment', { count: result.orders_list?.length ?? 0 })}
            </span>
            <ChevronRight />
          </div>
        </div>
        <div className="status-group-mobile">
          <span className={dot} />
          <span className="status-overview">{latestStatus}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', width: '100%' }}>
          <div className="tracking-number-overview">
            <div>{displayTno}</div>
          </div>
          <div className="status-group">
            <span className={dot} />
            <span className="status-overview">{latestStatus}</span>
          </div>
        </div>
      </div>
    )
  }

  const displayTno = result.selected_tno ?? result.tno

  return (
    <>
      {notices.length > 0 && <NoticeBlock notices={notices} />}
      <div
        style={{
          maxWidth: 810,
          margin: '12px auto',
          borderRadius: 10,
          background: '#fff',
          boxShadow: '4px 4px 10px 1px #D1E8E8',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={collapsible ? onToggle : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 38px',
            background: 'none',
            border: 'none',
            cursor: collapsible ? 'pointer' : 'default',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: '#101820' }}>{displayTno}</span>
          {collapsible && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8D8D8D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>
        {(isOpen || !collapsible) && (
          <div style={{ padding: '0 38px 38px' }}>
            <ResultCard
              result={result}
              index={index}
              eddData={eddData}
              onViewPod={onViewPod}
              onDownloadPod={onDownloadPod}
            />
          </div>
        )}
      </div>
    </>
  )
}
