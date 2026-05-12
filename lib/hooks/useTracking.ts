import { useState, useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { fetchTracking } from '../api/tracking'
import { fetchEdd } from '../api/edd'
import type {
  TrackingResult,
  EddMap,
  ExportRow,
  PiecesViewState,
  ZipModalState,
} from '../types'
import { formatTo12Hour } from '../utils/formatTime'

function buildExportRows(results: TrackingResult[], eddMap: EddMap): ExportRow[] {
  const rows: ExportRow[] = []

  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  function buildEddColumns(res: TrackingResult): Pick<ExportRow, 'eddDate' | 'eddTimeStart' | 'eddTimeEnd'> {
    const edd = eddMap[res.tno]
    if (
      res.country !== 'US' ||
      !edd?.edd_enabled ||
      !edd.delivery_estimate?.estimated_delivery_date
    ) {
      return { eddDate: 'N/A', eddTimeStart: 'N/A', eddTimeEnd: 'N/A' }
    }
    const d = new Date(edd.delivery_estimate.estimated_delivery_date + 'T00:00:00')
    return {
      eddDate: `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`,
      eddTimeStart: formatTo12Hour(edd.delivery_estimate.estimated_delivery_time_start ?? ''),
      eddTimeEnd: formatTo12Hour(edd.delivery_estimate.estimated_delivery_time_end ?? ''),
    }
  }

  for (const res of results) {
    const spathLen = res.spath_list?.length

    if (res.master_tno) {
      for (const order of res.orders_list ?? []) {
        const len = order.spath_list?.length
        if (!len) continue
        rows.push({
          tno: order.tno,
          city: order.spath_list[len - 1].pathAddress ?? '',
          latestTime: order.spath_list[len - 1].dateTime?.localTime ?? '',
          latestTrack: order.spath_list[len - 1].pathInfo,
          trackingInfo: order.full_spath_info ?? '',
          ...buildEddColumns(order),
        })
      }
    } else if (spathLen) {
      rows.push({
        tno: res.tno,
        city: res.spath_list[spathLen - 1].pathAddress ?? '',
        latestTime: res.spath_list[spathLen - 1].dateTime?.localTime ?? '',
        latestTrack: res.spath_list[spathLen - 1].pathInfo,
        trackingInfo: res.full_spath_info ?? '',
        ...buildEddColumns(res),
      })
    }
  }
  return rows
}

export function useTracking() {
  const [validResults, setValidResults] = useState<TrackingResult[]>([])
  const [invalidTnos, setInvalidTnos] = useState<string[]>([])
  const [eddMap, setEddMap] = useState<EddMap>({})
  const [exportRows, setExportRows] = useState<ExportRow[]>([])
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({})
  const [piecesView, setPiecesView] = useState<PiecesViewState | null>(null)
  const [zipModal, setZipModal] = useState<ZipModalState>({
    open: false,
    trackingIndex: -1,
    request: 'view',
    errorMessage: null,
  })
  const [inputValue, setInputValue] = useState('')
  const resultsRef = useRef<HTMLDivElement>(null)

  const { mutate: runTrack, isPending: loading } = useMutation({
    mutationFn: async (rawInput: string) => {
      const ids = rawInput
        .replace(/\r?\n|\r/g, ',')
        .replace(/\s+/g, ',')
        .toUpperCase()
      const tnoArray = ids.split(',').filter((t) => t.trim().length > 0)

      const [trackRes, eddResult] = await Promise.all([
        fetchTracking(ids),
        fetchEdd(tnoArray),
      ])

      return { trackRes, eddResult }
    },
    onSuccess: ({ trackRes, eddResult }) => {
      if (trackRes.status !== 'SUCCESS') {
        setValidResults([])
        setInvalidTnos([])
        setEddMap({})
        setExportRows([])
        return
      }

      const valid = trackRes.data.valid_tno ?? []
      const invalidStr = trackRes.data.invalid_tno ?? ''

      const extraInvalid: string[] = []
      const actualValid: TrackingResult[] = []
      for (const res of valid) {
        const hasPath = res.master_tno ? (res.orders_list?.length ?? 0) > 0 : (res.spath_list?.length ?? 0) > 0
        if (!hasPath) extraInvalid.push(res.tno)
        else actualValid.push(res)
      }

      const invalids = [
        ...invalidStr.split(',').filter(Boolean),
        ...extraInvalid,
      ]

      setValidResults(actualValid)
      setInvalidTnos(invalids)
      setEddMap(eddResult)
      setExportRows(buildExportRows(actualValid, eddResult))
      setOpenDetails(actualValid.length > 0 ? { [actualValid[0].tno]: true } : {})
      setPiecesView(null)

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    },
  })

  const track = useCallback(
    (input: string) => {
      const cleaned = input.trim()
      if (!cleaned) return false
      runTrack(cleaned)
      return true
    },
    [runTrack],
  )

  const toggleDetail = useCallback((key: string) => {
    setOpenDetails((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const openPiecesView = useCallback(
    (index: number) => {
      const res = validResults[index]
      if (!res?.master_tno) return
      setPiecesView({
        results: res.orders_list ?? [],
        masterTno: res.master_tno,
        deliveredCount: res.delivered_count ?? 0,
        parentIndex: index,
      })
    },
    [validResults],
  )

  const closePiecesView = useCallback(() => setPiecesView(null), [])

  const openZipModal = useCallback((index: number, request: 'view' | 'download') => {
    setZipModal({ open: true, trackingIndex: index, request, errorMessage: null })
  }, [])

  const closeZipModal = useCallback(() => {
    setZipModal((prev) => ({ ...prev, open: false, errorMessage: null }))
  }, [])

  const setZipError = useCallback((msg: string | null) => {
    setZipModal((prev) => ({ ...prev, errorMessage: msg }))
  }, [])

  return {
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
  }
}
