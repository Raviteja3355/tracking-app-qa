'use client'

import { useState } from 'react'
import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import type { TrackingResult, EddData, SpathItem } from '@/lib/types'
import { validateURPTrackingNo } from '@/lib/utils/validation'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getProgressStep(result: TrackingResult): number {
  const { state } = result
  const isURPDelivered =
    validateURPTrackingNo(result.tno) && result.events?.some((e) => e.pathInfo === 'Delivered')
  if (state === 203 || state === 228 || isURPDelivered) return 3
  if (state === 190 || state === 191 || state === 192 || state === 198) return 2
  const spath = result.spath_list ?? []
  if (spath.length > 1) return 1
  return 0
}

export function showPodButton(result: TrackingResult): boolean {
  if (result.state === 203) return true
  if (
    result.state === 190 &&
    validateURPTrackingNo(result.tno) &&
    result.events?.some((e) => e.pathInfo === 'Delivered')
  )
    return true
  const spath = result.spath_list ?? []
  if (
    result.new_tno &&
    result.state !== 190 &&
    spath.length &&
    spath[spath.length - 1].pathInfo?.trim().toLowerCase() === 'delivered'
  )
    return true
  return false
}

function formatEddDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function parseDatetime(item: SpathItem): { date: string; time: string } {
  const lt = item.dateTime?.localTime
  if (lt) {
    const [date = '', time = ''] = lt.replace('T', ' ').split(' ')
    return { date, time }
  }
  if (item.pathTime) {
    const d = new Date(item.pathTime * 1000)
    return { date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 8) }
  }
  return { date: '', time: '' }
}

function formatLabelCreated(item: SpathItem | undefined): string {
  if (!item) return '—'
  const lt = item.dateTime?.localTime
  if (lt) {
    const [datePart = '', timePart = ''] = lt.replace('T', ' ').split(' ')
    const d = new Date(datePart)
    if (!isNaN(d.getTime())) {
      const month = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      const [h = '0', m = '00'] = timePart.split(':')
      const hour = parseInt(h, 10)
      const ampm = hour >= 12 ? 'pm' : 'am'
      const h12 = hour % 12 || 12
      return `${month} at ${h12}:${m}${ampm}`
    }
  }
  if (item.pathTime) {
    const d = new Date(item.pathTime * 1000)
    const month = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    const time = d
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      .toLowerCase()
    return `${month} at ${time}`
  }
  return '—'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const gradientLine = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  height: 2,
  background:
    'linear-gradient(90deg,rgba(209,232,232,0) 0%,rgba(0,174,239,0.30) 50%,rgba(209,232,232,0) 100%)',
}

function ProgressTracker({ step }: { step: number }) {
  const { t } = useTranslation()
  const STEPS = [t('progressStep0'), t('progressStep1'), t('progressStep2'), t('progressStep3')]
  return (
    <div style={{ position: 'relative', padding: '30px 0' }}>
      <div style={{ ...gradientLine, top: 0 }} />
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          alignItems: 'start',
          minHeight: 90,
          padding: '0 30px',
        }}
      >
        {/* Connecting lines */}
        <div
          style={{
            position: 'absolute',
            top: 25,
            transform: 'translateY(-50%)',
            left: '12.5%',
            right: '12.5%',
            height: 3,
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            zIndex: 1,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 3, background: i < step ? '#FF8F1C' : '#D9D9D9' }} />
          ))}
        </div>

        {STEPS.map((label, i) => {
          const isCurrent = i === step
          const isPending = i > step
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                {isCurrent ? (
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: '#FF8F1C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 28, height: 28 }}
                    >
                      <path d="M1 3h15v13H1z" />
                      <path d="M16 8h4l3 3v5h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                ) : (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#fff',
                      border: `5px solid ${isPending ? '#D9D9D9' : '#FF8F1C'}`,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#101820',
                  lineHeight: 1.3,
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HelpStrip() {
  const { t } = useTranslation()
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        paddingTop: 38,
        marginTop: 6,
        flexWrap: 'wrap',
        textAlign: 'center',
      }}
    >
      <div style={{ ...gradientLine, top: 0 }} />
      <div style={{ fontSize: 16, color: '#101820' }}>
        {t('needHelpPre')} <span style={{ color: '#FF8F1C', fontWeight: 700 }}>{t('helpWord')}</span> {t('needHelpSuf')}
      </div>
      <a
        href="#support"
        className="inline-block rounded-[5px] bg-[#4B4B4B] px-4.5 py-1.75 text-[12px] font-medium text-white no-underline shadow-btn transition-[background,transform] duration-200 ease-in-out hover:bg-[#2a2a2a] hover:-translate-y-px"
      >
        {t('btnContactSupport')}
      </a>
    </div>
  )
}

// ─── ResultCard (inner content — card wrapper lives in ParcelCard) ────────────

interface Props {
  result: TrackingResult
  index: number
  eddData: EddData | undefined
  onViewPod: (tno: string, trackingIndex: number) => void
  onDownloadPod: (index: number) => void
}

export default function ResultCard({ result, index, eddData, onViewPod, onDownloadPod }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const tno = result.new_tno ?? result.tno
  const spath = result.spath_list ?? []
  const reversed = [...spath].reverse()
  const step = getProgressStep(result)
  const hasPod = showPodButton(result)

  // Top: EDD if available; for delivered without EDD show delivery date, not status text
  const eddDate = eddData?.delivery_estimate?.estimated_delivery_date
  let topLabel = t('labelEstimatedDelivery')
  let topValue = '—'
  if (eddDate) {
    topValue = formatEddDate(eddDate)
  } else if (step === 3) {
    // Delivered — show delivery date from last event
    const last = spath[spath.length - 1]
    const { date } = parseDatetime(last)
    topLabel = t('labelDelivered')
    topValue = date || '—'
  }

  function copyTno() {
    navigator.clipboard?.writeText(tno).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div>
      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, paddingBottom: 30 }}>
        {/* Wide EDD row */}
        <div style={{ gridColumn: '1 / -1', paddingBottom: 18, marginBottom: 14, position: 'relative' }}>
          <div style={{ fontSize: 11, color: '#8D8D8D', marginBottom: 8 }}>{topLabel}</div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.3px', color: '#101820' }}>
            {topValue}
          </div>
          <div
            style={{
              ...gradientLine,
              bottom: 0,
              background:
                'linear-gradient(90deg,rgba(209,232,232,0) 0%,rgba(0,174,239,0.35) 50%,rgba(209,232,232,0) 100%)',
            }}
          />
        </div>

        {/* Tracking Number */}
        <div>
          <div style={{ fontSize: 11, color: '#8D8D8D', marginBottom: 8 }}>{t('labelTrackingNumber')}</div>
          <div style={{ fontSize: 14, color: '#101820', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ wordBreak: 'break-all' }}>{tno}</span>
            <button
              onClick={copyTno}
              title="Copy"
              style={{
                flexShrink: 0, width: 22, height: 22,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: copied ? '#4CAF50' : '#aaa',
                cursor: 'pointer', borderRadius: 4, border: 'none', background: 'none',
                transition: 'color .2s',
              }}
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Label Created */}
        <div>
          <div style={{ fontSize: 11, color: '#8D8D8D', marginBottom: 8 }}>{t('labelLabelCreated')}</div>
          <div style={{ fontSize: 14, color: '#101820' }}>{formatLabelCreated(spath[0])}</div>
        </div>

        {/* Package Weight */}
        <div>
          <div style={{ fontSize: 11, color: '#8D8D8D', marginBottom: 8 }}>{t('labelPackageWeight')}</div>
          <div style={{ fontSize: 14, color: '#101820' }}>
            {(result as TrackingResult & { weight?: string }).weight ?? '—'}
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker step={step} />

      {/* Help Strip */}
      <HelpStrip />

      {/* Tracking History */}
      <div style={{ marginTop: 40 }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: '#101820' }}>
          {t('trackingHistory')}
        </div>
        {reversed.map((item, i) => {
          const { date, time } = parseDatetime(item)
          const isFirst = i === 0
          const isLast = i === reversed.length - 1
          return (
            <div
              key={i}
              style={{ display: 'grid', gridTemplateColumns: '120px 40px 1fr', gap: 20, padding: '18px 0' }}
            >
              <div style={{ fontSize: 14, color: '#8D8D8D', lineHeight: 1.5, textAlign: 'right' }}>
                <span style={{ display: 'block' }}>{date}</span>
                <span style={{ display: 'block' }}>{time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <div
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: isFirst ? '#FF8F1C' : '#E0E0E0',
                    marginTop: 4, position: 'relative', zIndex: 2,
                    border: '3px solid #fff',
                    boxShadow: `0 0 0 2px ${isFirst ? '#FF8F1C' : '#E0E0E0'}`,
                    flexShrink: 0,
                  }}
                />
                {!isLast && (
                  <div
                    style={{
                      position: 'absolute', top: 24, bottom: -18, left: '50%',
                      width: 0, borderLeft: '2px dashed #E0E0E0', transform: 'translateX(-1px)',
                    }}
                  />
                )}
              </div>
              <div>
                <div style={{ fontSize: 16, color: '#101820', lineHeight: 1.45, fontWeight: isFirst ? 600 : 400 }}>
                  {item.pathInfo}
                </div>
                {item.pathAddress && (
                  <div style={{ fontSize: 12, color: '#8D8D8D', marginTop: 6 }}>{item.pathAddress}</div>
                )}
                {isFirst && hasPod && (
                  <button
                    onClick={() => onViewPod(tno, index)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: '#FF8F1C', fontSize: 14, fontWeight: 600,
                      marginTop: 8, cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    {t('btnViewDeliveryConfirmation')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
