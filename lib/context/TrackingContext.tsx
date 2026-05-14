'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useTracking } from '@/lib/hooks/useTracking'
import { usePod } from '@/lib/hooks/usePod'
import { fetchPodImages } from '@/lib/api/pod'
import { Tracking } from '@/lib/constants'
import type {
  TrackingResult,
  EddMap,
  ExportRow,
  PiecesViewState,
  ZipModalState,
  PodModalState,
} from '@/lib/types'

interface TrackingContextValue {
  locale: 'en' | 'fr'
  // data
  validResults: TrackingResult[]
  invalidTnos: string[]
  eddMap: EddMap
  exportRows: ExportRow[]
  openDetails: Record<string, boolean>
  piecesView: PiecesViewState | null
  pod: PodModalState
  zipModal: ZipModalState
  // ui state
  loading: boolean
  podLoading: boolean
  podError: string | null
  clearPodError: () => void
  inputValue: string
  apiError: boolean
  showInvalidAlert: boolean
  showExceedAlert: boolean
  resultsRef: React.RefObject<HTMLDivElement | null>
  // actions
  setInputValue: (v: string) => void
  handleTrack: () => void
  toggleDetail: (key: string) => void
  openPiecesView: (index: number) => void
  closePiecesView: () => void
  handleViewPod: (tno: string, trackingIndex: number) => void
  handleZipVerify: (zip: string) => Promise<void>
  setZipError: (msg: string | null) => void
  closeZipModal: () => void
  closePod: () => void
  navigate: (direction: 'prev' | 'next') => void
  downloadCurrent: () => void
  downloadAll: () => void
}

const TrackingContext = createContext<TrackingContextValue | null>(null)

export function useTrackingContext(): TrackingContextValue {
  const ctx = useContext(TrackingContext)
  if (!ctx) throw new Error('useTrackingContext must be used within TrackingProvider')
  return ctx
}

export function TrackingProvider({
  locale = 'en',
  children,
}: {
  locale?: 'en' | 'fr'
  children: React.ReactNode
}) {
  const [showInvalidAlert, setShowInvalidAlert] = useState(false)
  const [showExceedAlert, setShowExceedAlert] = useState(false)

  const handleNetworkError = useCallback(() => setShowInvalidAlert(true), [])

  const {
    validResults,
    invalidTnos,
    eddMap,
    exportRows,
    openDetails,
    piecesView,
    zipModal,
    loading,
    inputValue,
    apiError,
    resultsRef,
    setInputValue,
    track,
    toggleDetail,
    openPiecesView,
    closePiecesView,
    openZipModal,
    closeZipModal,
    setZipError,
  } = useTracking(handleNetworkError)

  const {
    pod,
    podLoading,
    podError,
    clearPodError,
    openPod,
    closePod,
    navigate,
    downloadCurrent,
    downloadAll,
  } = usePod(validResults)

  const pendingZipRef = useRef<string | null>(null)

  useEffect(() => {
    const hashMatch = window.location.hash.match(/[?&]no=([^&]*)/)
    const searchParam = new URLSearchParams(window.location.search).get('no')
    const encoded = hashMatch ? hashMatch[1] : searchParam ?? null

    const zipParam = new URLSearchParams(window.location.search).get('zip')
    if (zipParam) pendingZipRef.current = zipParam

    if (!encoded) return
    let raw = encoded
    try { raw = decodeURIComponent(encoded) } catch { /* keep raw */ }
    if (raw.trim()) {
      setInputValue(raw)
      track(raw)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!pendingZipRef.current) return
    if (validResults.length !== 1) return
    const zip = pendingZipRef.current
    pendingZipRef.current = null
    const res = validResults[0]
    const tno = res.new_tno ?? res.tno
    openPod(tno, zip, 0)
  }, [validResults, openPod])

  const handleTrack = useCallback(() => {
    setShowInvalidAlert(false)
    setShowExceedAlert(false)

    const raw = inputValue.trim()
    if (!raw) {
      setShowInvalidAlert(true)
      return
    }

    const ids = raw.replace(/\r?\n|\r/g, ',').replace(/\s+/g, ',').toUpperCase()
    const tnoArray = ids.split(',').filter((t) => t.trim().length > 0)

    if (tnoArray.length > Tracking.MAX_NUMBERS) {
      setShowExceedAlert(true)
      return
    }

    const success = track(raw)
    if (!success) setShowInvalidAlert(true)
  }, [inputValue, track])

  const handleViewPod = useCallback(
    (_tno: string, trackingIndex: number) => {
      const result = validResults[trackingIndex]
      if (!result) return
      openZipModal(trackingIndex)
    },
    [validResults, openZipModal],
  )

  const handleZipVerify = useCallback(
    async (zip: string) => {
      const { trackingIndex } = zipModal
      const result = validResults[trackingIndex]
      if (!result) return
      const tno = result.new_tno ?? result.tno

      try {
        const images = await fetchPodImages(tno, zip)
        if (!images.length) {
          setZipError('')
          return
        }
        closeZipModal()
        openPod(tno, zip, trackingIndex)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : null
        setZipError(msg)
      }
    },
    [zipModal, validResults, closeZipModal, setZipError, openPod],
  )

  return (
    <TrackingContext.Provider
      value={{
        locale,
        validResults,
        invalidTnos,
        eddMap,
        exportRows,
        openDetails,
        piecesView,
        pod,
        zipModal,
        loading,
        podLoading,
        podError,
        clearPodError,
        inputValue,
        apiError,
        showInvalidAlert,
        showExceedAlert,
        resultsRef,
        setInputValue,
        handleTrack,
        toggleDetail,
        openPiecesView,
        closePiecesView,
        handleViewPod,
        setZipError,
        handleZipVerify,
        closeZipModal,
        closePod,
        navigate,
        downloadCurrent,
        downloadAll,
      }}
    >
      {children}
    </TrackingContext.Provider>
  )
}
