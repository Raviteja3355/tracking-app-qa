/**
 * Milestone bar and POD button visibility logic for tracking result cards.
 * 追踪结果卡片的里程碑进度条与 POD 按钮显示逻辑。
 *
 * The tracking API returns raw numeric state codes per scan event. The UI
 * shows a 3–5 step milestone bar (M1→M5) that must be derived from those
 * codes. This mapping is non-trivial for several reasons:
 *
 * 追踪 API 每次扫描事件返回原始数字状态码。UI 需要展示 3–5 步里程碑进度条
 * （M1→M5），该进度条须从状态码推导。以下几点使映射并不直接：
 *
 *   1. State 199 appears at both M2 and M3 — the first occurrence means the
 *      parcel just arrived at the facility (M2); a second occurrence means it
 *      went back for re-sorting (M3).
 *      状态 199 同时出现在 M2 和 M3 —— 第一次代表包裹刚到达网点（M2）；
 *      再次出现代表包裹回网点重新分拣（M3）。
 *
 *   2. M4 (out-for-delivery / hold) is a conditional step — it is hidden
 *      entirely unless an M4 state code appears somewhere in the spath history.
 *      Normal deliveries skip M4 and go straight from M3 to M5.
 *      M4（派送中 / 暂扣）是条件性步骤 —— 除非 spath 历史中出现过 M4 状态码，
 *      否则完全不显示。正常配送流程从 M3 直接到 M5，跳过 M4。
 *
 *   3. Packages can regress: a failed delivery attempt moves the parcel from
 *      M4 back to M3 for re-sorting. The milestone bar must reflect the
 *      current position, not the historical peak — showing "reached M4"
 *      on a package now back at M3 would mislead the recipient.
 *      包裹可能回退：投递失败会将包裹从 M4 退回 M3 重新分拣。进度条必须反映
 *      当前位置而非历史最高点 —— 对一个已退回 M3 的包裹显示"已达 M4"
 *      会误导收件人。
 *
 *   4. URP parcels (UniUni Rail Parcel) use state 190 even when delivered;
 *      delivery must be detected from the events list, not the state code.
 *      URP 包裹（UniUni Rail Parcel）投递完成时仍使用状态 190；
 *      需从 events 列表而非状态码判断是否已投递。
 */

import type { TrackingResult, Milestone, MilestoneId, M5SubType } from "@/lib/types";
import { validateURPTrackingNo } from "./validation";
import { Tracking } from "@/lib/constants";

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Returns true if this is a URP parcel that has been delivered.
 * 若该包裹为已投递的 URP 包裹则返回 true。
 *
 * URP parcels never reach state 203 (standard delivered). Instead, the API
 * keeps them at state 190 and adds a "Delivered" entry to the events list.
 * All delivered-state checks for URP must go through this function rather than
 * comparing state codes directly.
 *
 * URP 包裹不会到达状态 203（标准投递完成），API 会将其保持在状态 190，
 * 并在 events 列表中添加 "Delivered" 条目。所有针对 URP 的投递完成判断
 * 都必须经过此函数，而不是直接比较状态码。
 */
function isURPDelivered(result: TrackingResult): boolean {
  return (
    validateURPTrackingNo(result.tno) &&
    (result.events?.some((e) => e.pathInfo === "Delivered") ?? false)
  );
}

const M5_ALL = [
  ...Tracking.M5_DELIVERED,
  ...Tracking.M5_TRANSFERRED,
  ...Tracking.M5_EXCEPTION,
  ...Tracking.M5_RETURNED,
];

/**
 * Resolves which M5 sub-type applies to a given terminal state code.
 * 根据终态状态码判断 M5 属于哪种子类型。
 *
 * M5 is not a single outcome — a parcel's journey can end in four ways, each
 * with a different label and icon on the result card: delivered successfully,
 * transferred to a partner carrier, held due to an exception, or returned to
 * sender. The sub-type drives both the milestone label and the card's visual
 * treatment.
 *
 * M5 并非单一结果 —— 包裹旅程可以以四种方式结束，每种在结果卡片上
 * 显示不同的文案和图标：成功投递、转交合作快递、异常暂扣、退回寄件人。
 * 子类型同时决定里程碑文案和卡片的视觉样式。
 */
function m5SubType(state: number): M5SubType {
  if (Tracking.M5_TRANSFERRED.includes(state)) return "transferred";
  if (Tracking.M5_EXCEPTION.includes(state)) return "exception";
  if (Tracking.M5_RETURNED.includes(state)) return "returned";
  return "delivered";
}

// ── getMilestones ─────────────────────────────────────────────────────────────

/**
 * Derives the full milestone bar state from a tracking result.
 * 从追踪结果推导完整的里程碑进度条状态。
 *
 * Each milestone needs two flags:
 *   - `active`  — this is the current step (highlighted, shown with label)
 *   - `reached` — this step and all prior steps are filled/colored
 *
 * 每个里程碑需要两个标志：
 *   - `active`  —— 当前步骤（高亮显示，带文案标签）
 *   - `reached` —— 该步骤及之前所有步骤均已填充/着色
 *
 * `reached` is derived from the current active position, NOT from scan history.
 * If it were history-based, a package that regressed from M4 to M3 after a
 * failed delivery attempt would incorrectly show M4 as reached — making it
 * appear further along than it actually is.
 *
 * `reached` 基于当前 active 位置推导，而非扫描历史。
 * 如果基于历史，一个投递失败从 M4 退回 M3 的包裹会错误地显示 M4 已完成，
 * 让收件人误以为包裹进度比实际更靠前。
 *
 * PRD Section 9 display rules applied here:
 * 此处实现 PRD 第 9 节的显示规则：
 *   - M4 is omitted entirely unless an M4 code appears in spath history
 *     （M4 完全不显示，除非 spath 历史中出现过 M4 状态码）
 *   - State 199 first occurrence → M2; second or more → M3
 *     （状态 199 首次出现 → M2；第二次及以上 → M3）
 *   - M4 and M5 labels are dynamic based on the last relevant state in history
 *     （M4 和 M5 文案根据历史中最后一个相关状态码动态确定）
 */
export function getMilestones(
  result: TrackingResult,
  t: (key: string) => string
): Milestone[] {
  const spath = result.spath_list ?? [];
  const states = spath.map((s) => s.state ?? -1);
  const urpDelivered = isURPDelivered(result);

  // ── Determine what has appeared in history ─────────────────────────────────
  const count199 = states.filter((s) => s === Tracking.M2_CODE).length;
  const hasM3codes = states.some((s) => Tracking.M3_CODES.includes(s)) || count199 > 1;
  const hasM4codes = states.some((s) => Tracking.M4_CODES.includes(s));
  const hasM5codes = states.some((s) => M5_ALL.includes(s)) || urpDelivered;

  // ── Determine active milestone from current state ──────────────────────────
  const cur = result.state;
  let active: MilestoneId;

  if (urpDelivered || M5_ALL.includes(cur)) {
    active = "M5";
  } else if (Tracking.M4_CODES.includes(cur)) {
    active = "M4";
  } else if (
    Tracking.M3_CODES.includes(cur) ||
    (cur === Tracking.M2_CODE && count199 > 1)
  ) {
    active = "M3";
  } else if (cur === Tracking.M2_CODE) {
    active = "M2";
  } else if (Tracking.M1_CODES.includes(cur)) {
    active = "M1";
  } else {
    // Fallback: infer from highest milestone reached in history
    if (hasM5codes) active = "M5";
    else if (hasM4codes) active = "M4";
    else if (hasM3codes) active = "M3";
    else if (count199 > 0) active = "M2";
    else active = "M1";
  }

  // ── reached = current position, not historical peak ───────────────────────
  // All milestones up to and including active are reached; those after are gray.
  // 所有不超过 active 的里程碑均为 reached；之后的为灰色。
  //
  // Why not use history? A failed delivery attempt pushes the parcel back from
  // M4 to M3. History would show M4 as reached, but the parcel is not there
  // anymore — the recipient would see a misleading "almost delivered" state.
  // Anchoring to current active position avoids this.
  //
  // 为何不使用历史？投递失败会将包裹从 M4 退回 M3。若基于历史，M4 会显示为
  // 已完成，但包裹实际已不在那个阶段 —— 收件人会看到误导性的"即将送达"状态。
  // 以当前 active 位置为锚点可避免此问题。
  const MILESTONE_ORDER: MilestoneId[] = ["M1", "M2", "M3", "M4", "M5"];
  const activeIdx = MILESTONE_ORDER.indexOf(active);
  const isReached = (id: MilestoneId) => MILESTONE_ORDER.indexOf(id) <= activeIdx;

  // ── M4 dynamic label: use last M4 state in history ────────────────────────
  const lastM4 =
    [...states].reverse().find((s) => Tracking.M4_CODES.includes(s)) ?? cur;
  let m4LabelKey: string;
  if (lastM4 === 212) m4LabelKey = "milestoneM4IncompleteAddress";
  else if (lastM4 === 213) m4LabelKey = "milestoneM4Undeliverable";
  else m4LabelKey = "milestoneM4OutForDelivery";

  // ── M5 dynamic label + subType: use last M5 state in history ─────────────
  const lastM5 = urpDelivered
    ? 203
    : ([...states].reverse().find((s) => M5_ALL.includes(s)) ?? cur);
  const sub: M5SubType = m5SubType(lastM5);
  const m5LabelKeys: Record<M5SubType, string> = {
    delivered:   "milestoneM5Delivered",
    transferred: "milestoneM5Transferred",
    exception:   "milestoneM5Exception",
    returned:    "milestoneM5Returned",
  };

  // ── Build milestone array ──────────────────────────────────────────────────
  const milestones: Milestone[] = [
    { id: "M1", label: t("milestoneM1"), reached: isReached("M1"), active: active === "M1" },
    { id: "M2", label: t("milestoneM2"), reached: isReached("M2"), active: active === "M2" },
    { id: "M3", label: t("milestoneM3"), reached: isReached("M3"), active: active === "M3" },
  ];

  // M4 only appears if it was ever triggered in history
  if (hasM4codes) {
    milestones.push({
      id: "M4",
      label: t(m4LabelKey),
      reached: isReached("M4"),
      active: active === "M4",
    });
  }

  milestones.push({
    id: "M5",
    label: t(m5LabelKeys[sub]),
    reached: isReached("M5"),
    active: active === "M5",
    subType: sub,
  });

  return milestones;
}

// ── showPodButton ─────────────────────────────────────────────────────────────

/**
 * Determines whether the "View POD" button should appear on a result card.
 * 判断结果卡片上是否应显示"查看投递确认（POD）"按钮。
 *
 * POD (Proof of Delivery) is a photo or signature image showing the parcel
 * was received. The button must only appear when a POD actually exists —
 * showing it on an in-transit package would lead to a broken or empty response
 * from the POD API.
 *
 * POD（投递确认凭证）是一张展示包裹已签收的照片或签名图片。
 * 按钮只能在 POD 确实存在时显示 —— 对在途包裹显示此按钮会导致
 * POD API 返回错误或空响应。
 *
 * There are three distinct scenarios where a POD is available, each requiring
 * its own detection logic because the API does not provide a single "hasPOD" flag:
 * 有三种场景下 POD 可用，每种需要独立的检测逻辑，因为 API 不提供统一的 "hasPOD" 标志：
 *
 *   1. State 203 / 228 — standard delivered states for CA and US parcels.
 *      状态 203 / 228 —— CA 和 US 包裹的标准投递完成状态。
 *      (228 added alongside 203: it is a secondary delivered state used for
 *      certain US carrier handoffs that also have POD available.)
 *      （228 与 203 并列：它是某些美国承运商交接使用的次要投递完成状态，同样有 POD。）
 *
 *   2. State 190 + URP + events "Delivered" — URP parcels stay at state 190
 *      after delivery; delivered status must be read from the events list.
 *      状态 190 + URP + events "Delivered" —— URP 包裹投递后仍停留在状态 190，
 *      需从 events 列表中读取是否已投递。
 *
 *   3. new_tno + last spath entry "Delivered" — packages with a replacement
 *      tracking number whose delivery is recorded in the spath path info rather
 *      than the top-level state code.
 *      new_tno + spath 最后条目为 "Delivered" —— 带有替换运单号的包裹，
 *      其投递记录在 spath 路径信息中而非顶层状态码。
 */
export function showPodButton(result: TrackingResult): boolean {
  if ([203, 228].includes(result.state)) return true;
  if (result.state === 190 && isURPDelivered(result)) return true;

  const spath = result.spath_list ?? [];
  if (
    result.new_tno &&
    spath.length > 0 &&
    spath[spath.length - 1].pathInfo?.trim().toLowerCase() === "delivered"
  )
    return true;

  return false;
}
