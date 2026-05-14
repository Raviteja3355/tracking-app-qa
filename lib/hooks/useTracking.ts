import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchTracking } from "../api/tracking";
import { fetchEdd } from "../api/edd";
import type {
  TrackingResult,
  EddMap,
  ExportRow,
  PiecesViewState,
  ZipModalState,
} from "../types";
import { formatTo12Hour } from "../utils/formatTime";
import { DateTime } from "../constants";

function buildExportRows(
  results: TrackingResult[],
  eddMap: EddMap,
): ExportRow[] {
  const rows: ExportRow[] = [];

  function buildEddColumns(
    res: TrackingResult,
  ): Pick<ExportRow, "eddDate" | "eddTimeStart" | "eddTimeEnd"> {
    const edd = eddMap[res.tno];
    if (
      res.country !== "US" ||
      !edd?.edd_enabled ||
      !edd.delivery_estimate?.estimated_delivery_date
    ) {
      return { eddDate: "N/A", eddTimeStart: "N/A", eddTimeEnd: "N/A" };
    }
    const d = new Date(
      edd.delivery_estimate.estimated_delivery_date + "T00:00:00",
    );
    return {
      eddDate: `${DateTime.WEEKDAYS[d.getDay()]}, ${DateTime.MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`,
      eddTimeStart: formatTo12Hour(
        edd.delivery_estimate.estimated_delivery_time_start ?? "",
      ),
      eddTimeEnd: formatTo12Hour(
        edd.delivery_estimate.estimated_delivery_time_end ?? "",
      ),
    };
  }

  for (const res of results) {
    const spathLen = res.spath_list?.length;

    if (res.master_tno) {
      for (const order of res.orders_list ?? []) {
        const len = order.spath_list?.length;
        if (!len) continue;
        rows.push({
          tno: order.tno,
          city: order.spath_list[len - 1].pathAddress ?? "",
          latestTime: order.spath_list[len - 1].dateTime?.localTime ?? "",
          latestTrack: order.spath_list[len - 1].pathInfo,
          trackingInfo: order.full_spath_info ?? "",
          ...buildEddColumns(order),
        });
      }
    } else if (spathLen) {
      rows.push({
        tno: res.tno,
        city: res.spath_list[spathLen - 1].pathAddress ?? "",
        latestTime: res.spath_list[spathLen - 1].dateTime?.localTime ?? "",
        latestTrack: res.spath_list[spathLen - 1].pathInfo,
        trackingInfo: res.full_spath_info ?? "",
        ...buildEddColumns(res),
      });
    }
  }
  return rows;
}

export function useTracking(onNetworkError?: () => void) {
  const onNetworkErrorRef = useRef(onNetworkError)
  onNetworkErrorRef.current = onNetworkError
  const [validResults, setValidResults] = useState<TrackingResult[]>([]);
  const [invalidTnos, setInvalidTnos] = useState<string[]>([]);
  const [eddMap, setEddMap] = useState<EddMap>({});
  const [exportRows, setExportRows] = useState<ExportRow[]>([]);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [piecesView, setPiecesView] = useState<PiecesViewState | null>(null);
  const [zipModal, setZipModal] = useState<ZipModalState>({
    open: false,
    trackingIndex: -1,
    request: "view",
    errorMessage: null,
  });
  const [inputValue, setInputValue] = useState("");
  const [apiError, setApiError] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!validResults.length && !invalidTnos.length) return;
    if (!resultsRef.current) return;
    const top = resultsRef.current.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  }, [validResults, invalidTnos]);

  const { mutate: runTrack, isPending: loading } = useMutation({
    mutationFn: async (rawInput: string) => {
      const ids = rawInput
        .replace(/\r?\n|\r/g, ",")
        .replace(/\s+/g, ",")
        .toUpperCase();
      const tnoArray = ids.split(",").filter((t) => t.trim().length > 0);

      const [trackRes, eddResult] = await Promise.all([
        fetchTracking(ids),
        fetchEdd(tnoArray),
      ]);

      return { trackRes, eddResult };
    },
    onError: () => onNetworkErrorRef.current?.(),
    onSuccess: ({ trackRes, eddResult }) => {
      if (trackRes.status !== "SUCCESS") {
        setValidResults([]);
        setInvalidTnos([]);
        setEddMap({});
        setExportRows([]);
        setApiError(true);
        return;
      }
      setApiError(false);

      const valid = trackRes.data.valid_tno ?? [];
      const invalidStr = trackRes.data.invalid_tno ?? "";

      const invalids = invalidStr.split(",").filter(Boolean);

      setValidResults(valid);
      setInvalidTnos(invalids);
      setEddMap(eddResult);
      setExportRows(buildExportRows(valid, eddResult));
      setOpenDetails(valid.length > 0 ? { [valid[0].tno]: true } : {});
      setPiecesView(null);

    },
  });

  const track = useCallback(
    (input: string) => {
      const cleaned = input.trim();
      if (!cleaned) return false;
      setApiError(false);
      runTrack(cleaned);
      return true;
    },
    [runTrack],
  );

  const toggleDetail = useCallback((key: string) => {
    setOpenDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const openPiecesView = useCallback(
    (index: number) => {
      const res = validResults[index];
      if (!res?.master_tno) return;
      setPiecesView({
        results: res.orders_list ?? [],
        masterTno: res.master_tno,
        deliveredCount: res.delivered_count ?? 0,
        parentIndex: index,
      });
    },
    [validResults],
  );

  const closePiecesView = useCallback(() => setPiecesView(null), []);

  const openZipModal = useCallback(
    (index: number) => {
      setZipModal({
        open: true,
        trackingIndex: index,
        request: "view",
        errorMessage: null,
      });
    },
    [],
  );

  const closeZipModal = useCallback(() => {
    setZipModal((prev) => ({ ...prev, open: false, errorMessage: null }));
  }, []);

  const setZipError = useCallback((msg: string | null) => {
    setZipModal((prev) => ({ ...prev, errorMessage: msg }));
  }, []);

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
  };
}
