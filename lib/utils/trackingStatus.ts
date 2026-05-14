import type { TrackingResult } from "@/lib/types";
import { validateURPTrackingNo } from "./validation";

// ─── Step definitions ─────────────────────────────────────────────────────────
// 0 = Label Created
// 1 = In Transit
// 2 = Out for Delivery
// 3 = Delivered

// State code → fixed step mapping.
// Add / remove entries here when the API introduces new state codes.
const STATE_STEP_MAP: Record<number, number> = {
  190: 0,
  // Delivered
  203: 3,
  228: 3,

  // Out for Delivery
  191: 2,
  192: 2,
  198: 2,
  202: 2,
};

// URP tracking numbers follow a separate delivered-detection path:
// state 190 + tno matches URP pattern + events contain "Delivered" → Delivered
function isURPDelivered(result: TrackingResult): boolean {
  return (
    validateURPTrackingNo(result.tno) &&
    (result.events?.some((e) => e.pathInfo === "Delivered") ?? false)
  );
}

export function getProgressStep(result: TrackingResult): number {
  if (isURPDelivered(result)) return 3;

  const mapped = STATE_STEP_MAP[result.state];
  if (mapped !== undefined) return mapped;

  // Fallback: at least one scan in the network → In Transit
  if ((result.spath_list?.length ?? 0) > 1) return 1;

  return 0;
}

// ─── POD button visibility ────────────────────────────────────────────────────

export function showPodButton(result: TrackingResult): boolean {
  // Standard delivered
  if (result.state === 203) return true;

  // URP delivered via events
  if (result.state === 190 && isURPDelivered(result)) return true;

  // Transferred to sub-carrier (new_tno) and last spath event is "delivered"
  const spath = result.spath_list ?? [];
  if (
    result.new_tno &&
    spath.length > 0 &&
    spath[spath.length - 1].pathInfo?.trim().toLowerCase() === "delivered"
  )
    return true;

  return false;
}
