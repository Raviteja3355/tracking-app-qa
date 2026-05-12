'use client'

import { useState } from 'react'
import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import type { TrackingResult, EddMap, ExportRow, PiecesViewState } from '@/lib/types'
import ParcelCard from './ParcelCard'
import ExportTable from './ExportTable'

interface Props {
  validResults: TrackingResult[]
  invalidTnos: string[]
  eddMap: EddMap
  exportRows: ExportRow[]
  openDetails: Record<string, boolean>
  piecesView: PiecesViewState | null
  resultsRef: React.RefObject<HTMLDivElement | null>
  onToggleDetail: (key: string) => void
  onViewPod: (tno: string, trackingIndex: number) => void
  onDownloadPod: (index: number) => void
  onOpenPiecesView: (index: number) => void
  onClosePiecesView: () => void
}

function MoreMenu({ onCopy, onDownload }: { onCopy: () => void; onDownload: () => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  function handle(fn: () => void) {
    setOpen(false)
    fn()
  }

  return (
    <div className="relative">
      <div className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <svg className="hidden desk:block" width="123" height="56" viewBox="0 0 123 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M37.28 22.832V34H35.04V26.736L32.048 34H30.352L27.344 26.736V34H25.104V22.832H27.648L31.2 31.136L34.752 22.832H37.28ZM43.4306 34.144C42.5773 34.144 41.8093 33.9573 41.1266 33.584C40.444 33.2 39.9053 32.6613 39.5106 31.968C39.1266 31.2747 38.9346 30.4747 38.9346 29.568C38.9346 28.6613 39.132 27.8613 39.5266 27.168C39.932 26.4747 40.4813 25.9413 41.1746 25.568C41.868 25.184 42.6413 24.992 43.4946 24.992C44.348 24.992 45.1213 25.184 45.8146 25.568C46.508 25.9413 47.052 26.4747 47.4466 27.168C47.852 27.8613 48.0546 28.6613 48.0546 29.568C48.0546 30.4747 47.8466 31.2747 47.4306 31.968C47.0253 32.6613 46.4706 33.2 45.7666 33.584C45.0733 33.9573 44.2946 34.144 43.4306 34.144ZM43.4306 32.192C43.836 32.192 44.2146 32.096 44.5666 31.904C44.9293 31.7013 45.2173 31.4027 45.4306 31.008C45.644 30.6133 45.7506 30.1333 45.7506 29.568C45.7506 28.7253 45.5266 28.08 45.0786 27.632C44.6413 27.1733 44.1026 26.944 43.4626 26.944C42.8226 26.944 42.284 27.1733 41.8466 27.632C41.42 28.08 41.2066 28.7253 41.2066 29.568C41.2066 30.4107 41.4146 31.0613 41.8306 31.52C42.2573 31.968 42.7906 32.192 43.4306 32.192ZM51.9378 26.512C52.2258 26.0427 52.5991 25.6747 53.0578 25.408C53.5271 25.1413 54.0604 25.008 54.6578 25.008V27.36H54.0658C53.3618 27.36 52.8284 27.5253 52.4658 27.856C52.1138 28.1867 51.9378 28.7627 51.9378 29.584V34H49.6978V25.136H51.9378V26.512ZM64.4065 29.376C64.4065 29.696 64.3852 29.984 64.3425 30.24H57.8625C57.9158 30.88 58.1398 31.3813 58.5345 31.744C58.9292 32.1067 59.4145 32.288 59.9905 32.288C60.8225 32.288 61.4145 31.9307 61.7665 31.216H64.1825C63.9265 32.0693 63.4358 32.7733 62.7105 33.328C61.9852 33.872 61.0945 34.144 60.0385 34.144C59.1852 34.144 58.4172 33.9573 57.7345 33.584C57.0625 33.2 56.5345 32.6613 56.1505 31.968C55.7772 31.2747 55.5905 30.4747 55.5905 29.568C55.5905 28.6507 55.7772 27.8453 56.1505 27.152C56.5238 26.4587 57.0465 25.9253 57.7185 25.552C58.3905 25.1787 59.1638 24.992 60.0385 24.992C60.8812 24.992 61.6332 25.1733 62.2945 25.536C62.9665 25.8987 63.4838 26.416 63.8465 27.088C64.2198 27.7493 64.4065 28.512 64.4065 29.376ZM62.0865 28.736C62.0758 28.16 61.8678 27.7013 61.4625 27.36C61.0572 27.008 60.5612 26.832 59.9745 26.832C59.4198 26.832 58.9505 27.0027 58.5665 27.344C58.1932 27.6747 57.9638 28.1387 57.8785 28.736H62.0865Z" fill="#101820" />
          <path d="M94 24.5L87 31.5L80 24.5" stroke="#101820" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="1" y="1" width="121" height="54" rx="9" stroke="#FF9E46" strokeWidth="2" />
        </svg>
        <svg className="block desk:hidden" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12.0008 13.9998C10.8969 13.9998 10 13.103 10 12.0007C10 10.8985 10.8969 10 12.0008 10C13.1047 10 14.0015 10.8985 14.0015 12.0007C14.0015 13.103 13.1047 13.9998 12.0008 13.9998ZM4.51928 14C3.41537 14 2.51855 13.1032 2.51855 12.0009C2.51855 10.8987 3.41537 10.0002 4.51928 10.0002C5.62319 10.0002 6.52001 10.8987 6.52001 12.0009C6.52001 13.1032 5.62319 14 4.51928 14ZM17.4799 12.0007C17.4799 13.103 18.3767 13.9998 19.4806 13.9998C20.5845 13.9998 21.4813 13.103 21.4813 12.0007C21.4813 10.8985 20.5845 10 19.4806 10C18.3767 10 17.4799 10.8985 17.4799 12.0007Z" fill="#121212" />
        </svg>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-0.5 overflow-hidden rounded-md border-2 border-[#ccc] bg-white shadow-lg mob:w-21 desk:w-30.75">
            <div onClick={() => handle(onCopy)} className="cursor-pointer border-b border-[#ccc] bg-white text-black hover:bg-gray-50 mob:px-1 mob:py-1 mob:text-[13px] desk:mx-4 desk:border-b desk:border-[#ccc] desk:py-3">
              {t('menuCopy')}
            </div>
            <div onClick={() => handle(onDownload)} className="cursor-pointer bg-white text-black hover:bg-gray-50 mob:px-1 mob:py-1 mob:text-[13px] desk:mx-4 desk:py-3">
              {t('menuDownload')}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function InvalidSection({ tnos }: { tnos: string[] }) {
  const { t } = useTranslation()
  return (
    <div className="mt-5 flex" style={{ flexDirection: 'row' }}>
      <div style={{ flex: 1 }}>
        <div className="rounded border border-[#f5c6cb] bg-[#ffeeee] p-4">
          <div className="mb-2 font-semibold" style={{ color: '#dc3545' }}>{t('alertTitle')}</div>
          <div className="hidden desk:block" style={{ fontSize: '14px', color: '#000' }}>
            {t('alertNoInfoDesktop')}{' '}
            <a href="https://www.uniuni.com/support/" style={{ textDecoration: 'underline', color: '#000' }}>{t('linkCustomerService')}</a>{' '}
            {t('alertNoInfoSuffix')}
          </div>
          <div className="block desk:hidden" style={{ fontSize: '14px', color: '#000' }}>
            {t('alertNoInfoMobile')}{' '}
            <a href="https://www.uniuni.com/support/" style={{ textDecoration: 'underline', color: '#000' }}>{t('linkCustomerService')}</a>.
          </div>
          <div className="mt-2" style={{ fontSize: '14px' }}>
            {tnos.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>&bull;&nbsp;{t}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-4 hidden items-center desk:flex">
        <img src="https://cdn.uniuni.com/wp-content/uploads/2023/07/invalid-search.png" alt="" style={{ width: 120 }} />
      </div>
    </div>
  )
}

export default function TrackingResults({
  validResults,
  invalidTnos,
  eddMap,
  exportRows,
  openDetails,
  piecesView,
  resultsRef,
  onToggleDetail,
  onViewPod,
  onDownloadPod,
  onOpenPiecesView,
  onClosePiecesView,
}: Props) {
  const { t } = useTranslation()

  if (!validResults.length && !invalidTnos.length) return null

  function copyToClipboard() {
    const table = document.getElementById('excel-table')
    if (!table) return
    table.style.display = 'table'
    const range = document.createRange()
    range.selectNodeContents(table)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    document.execCommand('copy')
    table.style.display = 'none'
  }

  function exportToExcel() {
    const table = document.getElementById('excel-table') as HTMLTableElement | null
    if (!table) return
    table.style.display = 'table'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TableToExcel = (window as any).TableToExcel
    if (TableToExcel) {
      TableToExcel.convert(table, {
        name: t('excelFileName'),
        sheet: { name: t('excelSheetName') },
      })
    }
    table.style.display = 'none'
  }

  if (piecesView) {
    return (
      <div ref={resultsRef} className="mb-25 w-full font-poppins">
        <div
          className="category-title flex cursor-pointer items-baseline desk:px-0 mob:px-5"
          style={{ paddingTop: 40, display: 'flex', alignItems: 'baseline' }}
          onClick={onClosePiecesView}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.2541 0.241064C9.55216 0.533264 9.57926 0.990508 9.33539 1.31272L9.2541 1.40503L2.52658 8L9.2541 14.595C9.55216 14.8872 9.57926 15.3444 9.33539 15.6666L9.2541 15.7589C8.95604 16.0511 8.48963 16.0777 8.16096 15.8386L8.06679 15.7589L0.745899 8.58198C0.44784 8.28978 0.420743 7.83254 0.66461 7.51033L0.745899 7.41802L8.06679 0.241064C8.39466 -0.0803548 8.92624 -0.0803548 9.2541 0.241064Z" fill="#121212" />
          </svg>
          <div className="parcel-overall-title" style={{ marginLeft: 10, paddingTop: 30 }}>
            {t('backToTracking')}
          </div>
        </div>

        <div className="parcel-overall-summary flex" style={{ borderTop: '1px solid #c3c3c3' }}>
          <div className="parcel-overall-summary-left flex items-center font-semibold">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M15.9332 4.50698H20.0265C24.9465 4.50698 27.3465 7.13364 27.3332 12.5203V19.0136C27.3332 24.1603 24.1598 27.3336 18.9998 27.3336H8.9865C3.85317 27.3336 0.666504 24.1603 0.666504 19.0003V8.98698C0.666504 3.46698 3.11984 0.666976 7.95984 0.666976H10.0665C11.3078 0.653642 12.4665 1.22698 13.2265 2.20031L14.3998 3.76031C14.7732 4.22698 15.3332 4.50698 15.9332 4.50698ZM7.8265 18.387H20.1732C20.7198 18.387 21.1598 17.9336 21.1598 17.387C21.1598 16.827 20.7198 16.387 20.1732 16.387H7.8265C7.2665 16.387 6.8265 16.827 6.8265 17.387C6.8265 17.9336 7.2665 18.387 7.8265 18.387Z" fill="#101820" />
            </svg>
            <div className="parcel-overall-summary-left-content">{piecesView.masterTno}</div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden desk:block">
              <path d="M19 8.5L12 15.5L5 8.5" stroke="#121212" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="parcel-overall-summary-right">
            {piecesView.deliveredCount}/{piecesView.results.length} {t('pieceDelivered')}
          </div>
        </div>

        <div className="parcel-overall-content">
          {piecesView.results.map((piece, i) => (
            <ParcelCard
              key={piece.tno}
              result={piece}
              index={piecesView.parentIndex}
              isFirst={i === 0}
              eddData={eddMap[piece.tno]}
              isOpen={!!openDetails[`piece-${piece.tno}`]}
              onToggle={() => onToggleDetail(`piece-${piece.tno}`)}
              onViewPod={onViewPod}
              onDownloadPod={onDownloadPod}
              onOpenPiecesView={() => {}}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={resultsRef} className="w-full pb-25 font-poppins">
      {validResults.length > 0 && exportRows.length > 0 && (
        <div className="mx-auto mt-8 flex max-w-202.5 justify-end">
          <MoreMenu onCopy={copyToClipboard} onDownload={exportToExcel} />
        </div>
      )}

      <div className="tracking-list" style={{ width: '100%' }}>
        {validResults.map((result, i) => (
          <ParcelCard
            key={result.tno}
            result={result}
            index={i}
            isFirst={i === 0}
            eddData={eddMap[result.tno]}
            isOpen={!!openDetails[result.tno]}
            collapsible={validResults.length > 1}
            onToggle={() => onToggleDetail(result.tno)}
            onViewPod={onViewPod}
            onDownloadPod={onDownloadPod}
            onOpenPiecesView={onOpenPiecesView}
          />
        ))}
      </div>

      {invalidTnos.length > 0 && <InvalidSection tnos={invalidTnos} />}
      {exportRows.length > 0 && <ExportTable rows={exportRows} />}
    </div>
  )
}
