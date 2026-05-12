'use client'

import { useState, useCallback } from 'react'
import { useTracking } from '@/lib/hooks/useTracking'
import { usePod } from '@/lib/hooks/usePod'
import { fetchPodImages } from '@/lib/api/pod'
import Loader from './Loader'
import TrackingInput from './TrackingInput'
import ZipModal from './modals/ZipModal'
import PodModal from './modals/PodModal'
import TrackingResults from './results/TrackingResults'

const MAX_TRACKING_NUMBERS = 25

export default function TrackingApp() {
  const [showInvalidAlert, setShowInvalidAlert] = useState(false)
  const [showExceedAlert, setShowExceedAlert] = useState(false)

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
    resultsRef,
    setInputValue,
    track,
    toggleDetail,
    openPiecesView,
    closePiecesView,
    openZipModal,
    closeZipModal,
    setZipError,
  } = useTracking()

  const {
    pod,
    podLoading,
    openPod,
    closePod,
    navigate,
    downloadCurrent,
    downloadAll,
    downloadPdf,
  } = usePod(validResults)

  function handleTrack() {
    setShowInvalidAlert(false)
    setShowExceedAlert(false)

    const raw = inputValue.trim()
    if (!raw) {
      setShowInvalidAlert(true)
      return
    }

    const ids = raw.replace(/\r?\n|\r/g, ',').replace(/\s+/g, ',').toUpperCase()
    const tnoArray = ids.split(',').filter((t) => t.trim().length > 0)

    if (tnoArray.length > MAX_TRACKING_NUMBERS) {
      setShowExceedAlert(true)
      return
    }

    const success = track(raw)
    if (!success) setShowInvalidAlert(true)
  }

  const handleViewPod = useCallback(
    (tno: string, trackingIndex: number) => {
      const result = validResults[trackingIndex]
      if (!result) return

      const isCA = result.country === 'CA'
      const isURP = /^UR\d{17}$/.test(tno)

      if (isURP) {
        openPod(tno, '', trackingIndex)
      } else {
        openZipModal(trackingIndex, 'view')
      }
    },
    [validResults, openZipModal, openPod],
  )

  const handleDownloadPod = useCallback(
    (index: number) => {
      openZipModal(index, 'download')
    },
    [openZipModal],
  )

  const handleZipVerify = useCallback(
    async (zip: string) => {
      const { trackingIndex, request } = zipModal
      const result = validResults[trackingIndex]
      if (!result) return

      const tno = result.new_tno ?? result.tno

      if (request === 'download') {
        try {
          await downloadPdf(tno, zip)
          closeZipModal()
        } catch {
          setZipError(null)
        }
      } else {
        try {
          const images = await fetchPodImages(tno, zip)
          if (!images.length) {
            setZipError(null)
            return
          }
          closeZipModal()
          openPod(tno, zip, trackingIndex)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : null
          setZipError(msg)
        }
      }
    },
    [zipModal, validResults, downloadPdf, closeZipModal, setZipError, openPod],
  )

  return (
    <div className="font-[family-name:var(--font-poppins)]">
      {(loading || podLoading) && <Loader />}

      <TrackingInput
        value={inputValue}
        onChange={setInputValue}
        onTrack={handleTrack}
        showInvalidAlert={showInvalidAlert}
        showExceedAlert={showExceedAlert}
      />

      <TrackingResults
        validResults={validResults}
        invalidTnos={invalidTnos}
        eddMap={eddMap}
        exportRows={exportRows}
        openDetails={openDetails}
        piecesView={piecesView}
        resultsRef={resultsRef}
        onToggleDetail={toggleDetail}
        onViewPod={handleViewPod}
        onDownloadPod={handleDownloadPod}
        onOpenPiecesView={openPiecesView}
        onClosePiecesView={closePiecesView}
      />

      <ZipModal
        open={zipModal.open}
        errorMessage={zipModal.errorMessage}
        onVerify={handleZipVerify}
        onClose={closeZipModal}
      />
      <PodModal
        pod={pod}
        validResults={validResults}
        onClose={closePod}
        onPrev={() => navigate('prev')}
        onNext={() => navigate('next')}
        onDownloadCurrent={downloadCurrent}
        onDownloadAll={downloadAll}
      />
    </div>
  )
}
