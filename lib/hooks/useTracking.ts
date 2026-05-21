/**
 * Central state manager for the entire tracking page interaction flow.
 * 追踪页面完整交互流程的核心状态管理 hook。
 *
 * This hook owns every piece of state that the tracking page needs, and
 * exposes a minimal action surface to components. Components never call
 * API functions directly — they call the actions returned here.
 *
 * 此 hook 持有追踪页面所需的全部状态，并向组件暴露最小的操作接口。
 * 组件不直接调用 API 函数，而是调用此 hook 返回的 action。
 *
 * State owned by this hook:
 * 此 hook 持有的状态：
 *
 *   validResults   — tracking results to render as cards
 *                    渲染为结果卡片的有效追踪数据
 *   invalidTnos    — tracking numbers with no data, shown in the alert block
 *                    无数据的运单号，显示在警告区块中
 *   eddMap         — estimated delivery dates keyed by tno (US only)
 *                    以运单号为 key 的预计送达日期（仅 US）
 *   exportRows     — pre-built rows for the Excel export button
 *                    为 Excel 导出按钮预构建的行数据
 *   openDetails    — which result cards have their timeline expanded
 *                    哪些结果卡片展开了时间线
 *   piecesView     — when non-null, the pieces panel is open for this shipment
 *                    非 null 时，该拼箱的子单面板处于打开状态
 *   zipModal       — POD zip-code modal: open state + request type + error message
 *                    POD 邮编弹窗：打开状态、请求类型、错误信息
 *   loading        — true while the tracking + EDD requests are in flight
 *                    追踪和 EDD 请求进行中时为 true
 *   apiError       — true when the tracking API returned a non-SUCCESS response
 *                    追踪 API 返回非 SUCCESS 时为 true
 *   inputValue     — controlled value of the tracking number textarea
 *                    运单号输入框的受控值
 *
 * ── Architecture notes ────────────────────────────────────────────────────────
 * 架构说明
 *
 * This hook mixes two concerns that ideally live in separate layers:
 * 此 hook 混合了两个理想情况下应分层的关注点：
 *
 *   1. Business logic — what counts as a valid result, how to build export rows,
 *      how to normalise tracking number input, what state transitions are legal.
 *      业务逻辑 —— 什么算有效结果、如何构建导出行、如何规范化运单号输入、
 *      哪些状态转换是合法的。
 *
 *   2. React plumbing — useState, useMutation, useEffect, useCallback, useRef.
 *      React 管道 —— useState、useMutation、useEffect、useCallback、useRef。
 *
 * Pain points of this approach:
 * 这种方式的痛点：
 *
 *   a. Business logic is untestable without React.
 *      `buildExportRows` is a pure function — it has no side effects and its
 *      correctness depends only on inputs. But because it lives inside this file,
 *      testing it requires rendering a React component or calling renderHook.
 *      业务逻辑无法脱离 React 单独测试。
 *      `buildExportRows` 是纯函数，正确性仅取决于输入，但因为定义在此文件中，
 *      测试它需要渲染 React 组件或调用 renderHook。
 *
 *   b. Two different kinds of state are co-located.
 *      `validResults` / `eddMap` / `exportRows` are business state — they
 *      represent what the API returned. `openDetails` / `piecesView` / `zipModal`
 *      are pure UI interaction state — they represent what the user has clicked.
 *      Mixing them makes it harder to reason about which state drives rendering
 *      versus which state drives data fetching.
 *      两类状态混放在一起。
 *      `validResults` / `eddMap` / `exportRows` 是业务状态（API 返回内容）；
 *      `openDetails` / `piecesView` / `zipModal` 是纯 UI 交互状态（用户点击行为）。
 *      混放使得区分"哪些状态驱动渲染"和"哪些状态驱动数据获取"变得困难。
 *
 *   c. The hook is not reusable.
 *      It is tightly coupled to this page's layout (e.g. the scroll-to-results
 *      effect, the auto-expand-first-card rule). Extracting it for a different
 *      surface (e.g. an embedded widget) would require stripping those
 *      page-specific side effects.
 *      此 hook 不可复用。
 *      它与当前页面布局紧密耦合（如滚动到结果区的 effect、自动展开第一张卡片的规则）。
 *      如需在其他场景复用（如嵌入式 widget），须剥离这些页面专属的副作用。
 *
 * Why this approach was chosen anyway:
 * 为何仍然选择这种方式：
 *
 *   - This is a single-page feature with no reuse requirement. No other surface
 *     in the product needs to fetch tracking data in the same flow.
 *     这是无复用需求的单页功能，产品中没有其他页面需要以相同流程获取追踪数据。
 *
 *   - TanStack Query already handles caching, deduplication, loading state, and
 *     error routing. Adding a separate state manager (Zustand / Redux) on top
 *     would be overhead with no benefit at this scale.
 *     TanStack Query 已处理缓存、去重、loading 状态和错误路由。
 *     在此体量下，叠加独立状态管理器（Zustand / Redux）只会增加复杂度而无实际收益。
 *
 *   - The alternative — splitting into a pure-data layer + a thin binding hook —
 *     is the right long-term direction if this feature grows (server components,
 *     shared state across routes, unit testing requirements). For now, the
 *     current structure is a pragmatic tradeoff, not an ideal architecture.
 *     长期正确方向是：拆分为纯数据层 + 轻量绑定 hook。
 *     如果此功能扩展（服务端组件、跨路由共享状态、单元测试要求），应当重构。
 *     目前的结构是务实的权衡，而非理想架构。
 */

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

/**
 * Builds the row data for the Excel export from a set of tracking results.
 * 从追踪结果集构建 Excel 导出的行数据。
 *
 * Piece shipments (master_tno present) are flattened: each child order becomes
 * its own row, matching the shortcoder's export behaviour.
 * 拼箱单（存在 master_tno）会被展开：每个子单独占一行，与 shortcoder 的导出行为一致。
 *
 * EDD columns are only populated for US parcels with edd_enabled. All other
 * parcels get "N/A" in those columns.
 * EDD 列仅对启用了 edd_enabled 的美国包裹填充数据，其余包裹该列填 "N/A"。
 */
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
  // Stable callback ref: keeps onNetworkError up-to-date across renders without
  // making it a dependency of useMutation's onError callback.
  // Writing to ref.current must happen in an effect, not during render.
  //
  // 稳定回调 ref：每次 render 后同步最新的 onNetworkError，
  // 使 useMutation 的 onError 始终调用最新版本，同时避免将其列为依赖项。
  // ref.current 的赋值必须在 effect 中进行，不能在 render 期间直接写入。
  const onNetworkErrorRef = useRef(onNetworkError);
  useEffect(() => {
    onNetworkErrorRef.current = onNetworkError;
  });

  // ── State ──────────────────────────────────────────────────────────────────
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

  // Ref attached to the results container div — used for smooth scroll after search.
  // 附加到结果容器 div 的 ref，用于搜索完成后平滑滚动到结果区域。
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Scroll to results after each search ───────────────────────────────────
  useEffect(() => {
    if (!validResults.length && !invalidTnos.length) return;
    if (!resultsRef.current) return;
    const top =
      resultsRef.current.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  }, [validResults, invalidTnos]);

  // ── Core search mutation ───────────────────────────────────────────────────
  // Tracking and EDD requests are fired concurrently via Promise.all.
  // If fetchTracking throws (network failure), useMutation catches it and
  // routes to onError — no try/catch needed here. See fetchTracking for details.
  // fetchEdd returns null on failure (never throws), so Promise.all always
  // resolves as long as fetchTracking succeeds.
  //
  // 追踪和 EDD 请求通过 Promise.all 并发发出。
  // fetchTracking throw（网络失败）时，useMutation 捕获并路由到 onError，
  // 此处无需 try/catch，详见 fetchTracking 注释。
  // fetchEdd 失败时返回 null（不 throw），因此只要 fetchTracking 成功，
  // Promise.all 就会 resolve。
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
      // API responded but reported failure (e.g. rate limit, server error).
      // Distinct from a network error — the request completed but status ≠ SUCCESS.
      // API 响应但报告失败（如限流、服务器错误）。
      // 与网络错误不同：请求完成了，但 status ≠ SUCCESS。
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

      // eddResult is null when the EDD request failed — fall back to an empty
      // map so result cards render normally without EDD blocks.
      // eddResult 为 null 表示 EDD 请求失败，降级为空对象，结果卡片正常渲染但不显示 EDD 区块。
      const edd = eddResult ?? {};
      setValidResults(valid);
      setInvalidTnos(invalids);
      setEddMap(edd);
      setExportRows(buildExportRows(valid, edd));
      // Auto-expand the first result card on every new search.
      // 每次新搜索自动展开第一张结果卡片。
      setOpenDetails(valid.length > 0 ? { [valid[0].tno]: true } : {});
      setPiecesView(null);
    },
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  // Public entry point for triggering a search. Normalisation (comma/newline
  // separators, uppercase) happens inside mutationFn. Returns false if input
  // is empty so the caller can decide whether to show a validation hint.
  //
  // 触发搜索的公开入口。规范化（逗号/换行分隔符、大写）在 mutationFn 内部处理。
  // 若输入为空则返回 false，调用方可据此决定是否显示校验提示。
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

  // Toggles the timeline expand/collapse for a single result card.
  // The key is tno for standard parcels, or tno+index for piece shipments.
  // 切换单张结果卡片的时间线展开/折叠状态。
  // 普通包裹以 tno 为 key，拼箱子单以 tno+index 为 key。
  const toggleDetail = useCallback((key: string) => {
    setOpenDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Opens the pieces panel for a piece shipment (master_tno present).
  // No-ops on standard parcels — the guard prevents invalid state.
  // 打开拼箱单的子单面板（存在 master_tno）。
  // 普通包裹调用时为 no-op，守卫防止无效状态。
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

  // Opens the POD zip-code modal in "view" mode (show images).
  // "download" mode is set separately by the POD component itself.
  // 以"查看"模式打开 POD 邮编弹窗（显示图片）。
  // "下载"模式由 POD 组件自身单独设置。
  const openZipModal = useCallback((index: number) => {
    setZipModal({
      open: true,
      trackingIndex: index,
      request: "view",
      errorMessage: null,
    });
  }, []);

  const closeZipModal = useCallback(() => {
    setZipModal((prev) => ({ ...prev, open: false, errorMessage: null }));
  }, []);

  // Surfaces a POD error message inside the zip modal without closing it,
  // so the user can correct their zip code and retry.
  // 在邮编弹窗内显示 POD 错误信息且不关闭弹窗，
  // 让用户可以修正邮编后重试。
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
