import type { EddMap, EddResponseItem } from '../types'
import { cfg, http } from './config'

/**
 * Fetches estimated delivery dates for a batch of tracking numbers.
 * 批量获取运单的预计送达日期（EDD）。
 *
 * Return value semantics — callers must handle all three cases:
 * 返回值语义 —— 调用方需处理以下三种情况：
 *
 *   null   — request failed (network error or non-SUCCESS API response).
 *            请求失败（网络错误或 API 返回非 SUCCESS）。
 *            The tracking page should still render; EDD blocks are simply hidden.
 *            追踪页面应继续渲染，EDD 区块不显示即可。
 *
 *   {}     — request succeeded but no parcels in this batch have EDD enabled.
 *            请求成功，但本批次运单均未启用 EDD。
 *
 *   map    — request succeeded; keyed by tno for O(1) lookup per result card.
 *            请求成功，以运单号为 key，供每张结果卡片 O(1) 查找。
 *
 * Returning null (not {}) on failure lets callers explicitly decide the
 * fallback behaviour with ??, rather than relying on silent undefined lookups
 * from an empty map propagating through optional chaining downstream.
 *
 * 失败时返回 null 而非 {}，让调用方通过 ?? 显式决定降级行为，
 * 而非依赖空对象查找产生的 undefined 在下游靠可选链悄悄消失。
 */
export async function fetchEdd(tnos: string[]): Promise<EddMap | null> {
  try {
    const { data } = await http.post<{ status: string; data: EddResponseItem[] }>(
      cfg.eddApiUrl,
      { key: cfg.eddApiKey, tnos },
    )
    if (data?.status !== 'SUCCESS' || !Array.isArray(data.data)) return null
    return Object.fromEntries(
      data.data.map((item) => [
        item.tno,
        { edd_enabled: item.edd_enabled, delivery_estimate: item.delivery_estimate },
      ]),
    )
  } catch {
    return null
  }
}
