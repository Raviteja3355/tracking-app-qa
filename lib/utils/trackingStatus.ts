/**
 * Derives UI state from raw tracking API data.
 * 从原始追踪 API 数据推导 UI 状态。
 *
 * The tracking API returns a numeric `state` code per shipment (e.g. 191, 203).
 * The result card renders a 4-step progress bar (Label Created → In Transit →
 * Out for Delivery → Delivered) and conditionally shows a "View POD" button.
 * This file centralises both decisions so no component needs to know about
 * raw state codes.
 *
 * 追踪 API 为每个包裹返回一个数字 `state` 码（如 191、203）。
 * 结果卡片渲染 4 步进度条（已创建标签 → 运输中 → 派送中 → 已投递），
 * 并根据条件显示"查看 POD"按钮。
 * 本文件集中处理这两项决策，组件无需了解原始状态码。
 *
 * Step index reference / 步骤索引说明：
 *   0 = Label Created  / 已创建标签
 *   1 = In Transit     / 运输中
 *   2 = Out for Delivery / 派送中
 *   3 = Delivered      / 已投递
 */

import type { TrackingResult } from "@/lib/types";
import { validateURPTrackingNo } from "./validation";
import { Tracking } from "@/lib/constants";

/**
 * URP parcels (format UR + 17 digits) report delivery through a separate signal:
 * state 190 is returned for both "label created" and "delivered" URP shipments,
 * so delivery is confirmed only when the events list contains a "Delivered" entry.
 *
 * URP 包裹（格式为 UR + 17 位数字）通过独立信号报告投递状态：
 * "已创建标签"和"已投递"的 URP 包裹都会返回 state 190，
 * 因此只有当 events 列表中包含 "Delivered" 条目时，才能确认为已投递。
 */
function isURPDelivered(result: TrackingResult): boolean {
  return (
    validateURPTrackingNo(result.tno) &&
    (result.events?.some((e) => e.pathInfo === "Delivered") ?? false)
  );
}

/**
 * Maps a tracking result to one of the 4 progress bar steps shown in the result card.
 * Checks URP delivery first, then the STATE_STEP_MAP for known state codes,
 * then falls back to "In Transit" if there is more than one scan in the network.
 *
 * 将追踪结果映射到结果卡片进度条的 4 个步骤之一。
 * 优先检查 URP 投递状态，再查 STATE_STEP_MAP 中的已知状态码，
 * 若网络中已有超过一次扫描则回退到"运输中"。
 */
export function getProgressStep(result: TrackingResult): number {
  if (isURPDelivered(result)) return 3;

  const mapped = Tracking.STATE_STEP_MAP[result.state];
  if (mapped !== undefined) return mapped;

  // Fallback: at least one scan in the network → In Transit
  // 兜底：网络中已有超过一次扫描 → 运输中
  if ((result.spath_list?.length ?? 0) > 1) return 1;

  return 0;
}

/**
 * Determines whether the "View POD" button should appear on a result card.
 * Three delivery confirmation signals exist across UniUni's carrier network:
 *   1. Standard state 203 (most parcels)
 *   2. URP state 190 + "Delivered" event (URP sub-carrier)
 *   3. Sub-carrier transfer (new_tno) where the last spath entry is "delivered"
 *
 * 决定结果卡片上是否显示"查看 POD"按钮。
 * UniUni 运营网络中存在三种投递确认信号：
 *   1. 标准 state 203（大多数包裹）
 *   2. URP state 190 + events 中含 "Delivered"（URP 分包商）
 *   3. 转交分包商（new_tno），且最后一条 spath 事件为 "delivered"
 */
export function showPodButton(result: TrackingResult): boolean {
  // Standard delivered / 标准已投递
  if (result.state === 203) return true;

  // URP delivered via events / URP 通过 events 确认投递
  if (result.state === 190 && isURPDelivered(result)) return true;

  // Transferred to sub-carrier (new_tno) and last spath event is "delivered"
  // 转交分包商（new_tno），且最后一条 spath 事件为 "delivered"
  const spath = result.spath_list ?? [];
  if (
    result.new_tno &&
    spath.length > 0 &&
    spath[spath.length - 1].pathInfo?.trim().toLowerCase() === "delivered"
  )
    return true;

  return false;
}
