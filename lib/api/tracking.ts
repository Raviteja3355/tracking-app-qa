import type { TrackingResponse } from '../types'
import { cfg, http } from './config'

/**
 * Fetches tracking data for one or more comma-separated tracking numbers.
 * 获取一个或多个逗号分隔运单号的追踪数据。
 *
 * No try/catch here — this is intentional, not an oversight.
 * 此处没有 try/catch，这是有意为之，并非遗漏。
 *
 * This function is always called inside useMutation's mutationFn (useTracking.ts).
 * TanStack Query v5 catches any thrown error from mutationFn and routes it to
 * the mutation's onError callback, which triggers the network error UI.
 * Adding a try/catch here would swallow the error before it reaches onError,
 * leaving the user with no feedback on failure.
 *
 * 此函数始终在 useMutation 的 mutationFn 中调用（见 useTracking.ts）。
 * TanStack Query v5 会捕获 mutationFn 抛出的任何错误，并路由到 onError 回调，
 * 由 onError 触发网络错误提示 UI。
 * 若在此处加 try/catch，错误会在到达 onError 之前被吞掉，用户将看不到任何失败提示。
 *
 * Contrast with fetchEdd — that function catches internally and returns null
 * because EDD is supplementary: failure must not block the tracking result.
 * 对比 fetchEdd —— 它在内部 catch 并返回 null，因为 EDD 是辅助数据：
 * EDD 失败不应阻断追踪结果的展示。
 */
export async function fetchTracking(ids: string): Promise<TrackingResponse> {
  const { data } = await http.get<TrackingResponse>(
    `${cfg.deliveryApi}/cargo/trackinguniuninew`,
    { params: { id: ids, key: cfg.trackingApiKey } },
  )
  return data
}
