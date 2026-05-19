import type { TrackingResult, Milestone, MilestoneId, M5SubType } from "@/lib/types";
import { validateURPTrackingNo } from "./validation";
import { Tracking } from "@/lib/constants";

// ── Internal helpers ──────────────────────────────────────────────────────────

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

function m5SubType(state: number): M5SubType {
  if (Tracking.M5_TRANSFERRED.includes(state)) return "transferred";
  if (Tracking.M5_EXCEPTION.includes(state)) return "exception";
  if (Tracking.M5_RETURNED.includes(state)) return "returned";
  return "delivered";
}

// ── getMilestones ─────────────────────────────────────────────────────────────

/**
 * Derives the milestone bar state from the full spath history + current result.
 * Implements PRD Section 9 display rules:
 *   - M4 hidden entirely if no M4 state code ever appears in history
 *   - M2 auto-shown if M3 codes present but state 199 never appears
 *   - 199 first occurrence → M2; subsequent → M3
 *   - M4/M5 labels are dynamic
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

  // M2 reached: 199 in history OR M3+ exist (auto-shown rule)
  const m2Reached = count199 > 0 || hasM3codes;
  const m3Reached = hasM3codes;
  const m5Reached = hasM5codes;

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
    { id: "M1", label: t("milestoneM1"), reached: true,      active: active === "M1" },
    { id: "M2", label: t("milestoneM2"), reached: m2Reached, active: active === "M2" },
    { id: "M3", label: t("milestoneM3"), reached: m3Reached, active: active === "M3" },
  ];

  // M4 only appears if it was ever triggered in history
  if (hasM4codes) {
    milestones.push({
      id: "M4",
      label: t(m4LabelKey),
      reached: true,
      active: active === "M4",
    });
  }

  milestones.push({
    id: "M5",
    label: t(m5LabelKeys[sub]),
    reached: m5Reached,
    active: active === "M5",
    subType: sub,
  });

  return milestones;
}

// ── showPodButton (unchanged) ─────────────────────────────────────────────────

/**
 * Determines whether the "View POD" button should appear on a result card.
 */
export function showPodButton(result: TrackingResult): boolean {
  if (result.state === 203) return true;
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
