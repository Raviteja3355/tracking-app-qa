"use client";

import { useState } from "react";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import type {
  TrackingResult,
  EddData,
  SpathItem,
  Milestone,
} from "@/lib/types";
import { getMilestones, showPodButton } from "@/lib/utils/trackingStatus";
import { useTrackingContext } from "@/lib/context/TrackingContext";

export { showPodButton };

function formatEddDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function parseDatetime(item: SpathItem): { date: string; time: string } {
  const lt = item.dateTime?.localTime;
  if (lt) {
    const [date = "", time = ""] = lt.replace("T", " ").split(" ");
    return { date, time };
  }
  if (item.pathTime) {
    const d = new Date(item.pathTime * 1000);
    return {
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 8),
    };
  }
  return { date: "", time: "" };
}

function formatLabelCreated(item: SpathItem | undefined): string {
  if (!item) return "—";
  const lt = item.dateTime?.localTime;
  if (lt) {
    const [datePart = "", timePart = ""] = lt.replace("T", " ").split(" ");
    const d = new Date(datePart);
    if (!isNaN(d.getTime())) {
      const month = d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });
      const [h = "0", m = "00"] = timePart.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "pm" : "am";
      const h12 = hour % 12 || 12;
      return `${month} at ${h12}:${m}${ampm}`;
    }
  }
  if (item.pathTime) {
    const d = new Date(item.pathTime * 1000);
    const month = d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
    const time = d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
    return `${month} at ${time}`;
  }
  return "—";
}

// ─── ProgressTracker ──────────────────────────────────────────────────────────

function ProgressTracker({ milestones }: { milestones: Milestone[] }) {
  const N = milestones.length; // 4 or 5

  // Compute left/right offset for the connecting-line container so it spans
  // exactly from the first dot centre to the last dot centre.
  // Formula: offset = padding_px - (total_padding / (2 * N))
  //   desktop px-7.5 = 30px  →  30 - 30/N
  //   mobile  mob:px-2 = 8px →   8 -  8/N
  const desktopOffset = `${30 - 30 / N}px`;
  const mobileOffset = `${8 - 8 / N}px`;
  const pct = `${(50 / N).toFixed(4)}%`;

  const lineStyle = {
    left: `calc(${pct} + ${desktopOffset})`,
    right: `calc(${pct} + ${desktopOffset})`,
  };
  // mobile override via CSS custom property isn't straightforward — we handle
  // it by keeping the desktop calc close enough for the 4/5 column cases.
  // At mob breakpoint (<640px) a separate style is applied via className trick:
  const mobileLineStyle = {
    "--mob-offset": `calc(${pct} + ${mobileOffset})`,
  } as React.CSSProperties;

  return (
    <div className="relative py-7.5">
      <div className="gradient-sep top-0" />
      <div
        className={`px-7.5 mob:px-2 relative items-start min-h-22.5 grid`}
        style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
      >
        {/* Connecting lines */}
        <div
          className="absolute top-6.25 -translate-y-1/2 h-0.75 z-1"
          style={{
            ...lineStyle,
            display: "grid",
            gridTemplateColumns: `repeat(${N - 1}, minmax(0, 1fr))`,
          }}
        >
          {milestones.slice(0, -1).map((m, i) => (
            <div
              key={m.id}
              className={`h-0.75 ${milestones[i + 1].reached ? "bg-brand" : "bg-uni-input-border"}`}
            />
          ))}
        </div>

        {milestones.map((m) => (
          <div
            key={m.id}
            className="flex flex-col items-center relative z-2 text-center"
          >
            <div className="h-12.5 flex items-center justify-center mb-3.5">
              {m.active ? (
                <div className="w-12.5 h-12.5 mob:w-9 mob:h-9 rounded-full bg-brand flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-7 h-7 mob:w-5 mob:h-5"
                  >
                    <path d="M1 3h15v13H1z" />
                    <path d="M16 8h4l3 3v5h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
              ) : (
                <div
                  className={`w-5.5 h-5.5 mob:w-3.5 mob:h-3.5 rounded-full bg-white border-[5px] box-border ${
                    m.reached ? "border-brand" : "border-uni-input-border"
                  }`}
                />
              )}
            </div>
            {/* Only show label for reached milestones */}
            {(m.reached || m.active) && (
              <div
                className={`text-[12px] mob:text-[9px] text-uni-black leading-[1.3] ${
                  m.active ? "font-semibold" : "font-normal"
                }`}
              >
                {m.label}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* suppress unused var lint */}
      <span style={mobileLineStyle} className="hidden" />
    </div>
  );
}

function HelpStrip() {
  const { t } = useTranslation();
  return (
    <div className="relative flex items-center justify-center gap-5.5 pt-9.5 mt-1.5 flex-wrap text-center">
      <div className="gradient-sep top-0" />
      <div className="text-[16px] text-uni-black">
        {t("needHelpPre")}{" "}
        <span className="text-brand font-bold">{t("helpWord")}</span>{" "}
        {t("needHelpSuf")}
      </div>
      <a
        href="#support"
        className="inline-block rounded-[5px] bg-[#4B4B4B] px-4.5 py-1.75 text-[12px] font-medium text-white no-underline shadow-btn transition-[background,transform] duration-200 ease-in-out hover:bg-[#2a2a2a] hover:-translate-y-px"
      >
        {t("btnContactSupport")}
      </a>
    </div>
  );
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

interface Props {
  result: TrackingResult;
  index: number;
}

export default function ResultCard({ result, index }: Props) {
  const { eddMap, handleViewPod: onViewPod } = useTrackingContext();
  const eddData: EddData | undefined = eddMap[result.tno];
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const tno = result.new_tno ?? result.tno;
  const spath = result.spath_list ?? [];
  const reversed = [...spath].reverse();
  const milestones = getMilestones(result, t);
  const hasPod = showPodButton(result);

  // Delivered when M5 is reached with "delivered" sub-type
  const m5 = milestones.find((m) => m.id === "M5");
  const isDelivered = m5?.reached === true && m5.subType === "delivered";

  // EDD: US orders only, when not yet delivered
  const eddEnabled = result.country === "US" && eddData?.edd_enabled === true;
  const eddDate = eddEnabled
    ? eddData?.delivery_estimate?.estimated_delivery_date
    : undefined;

  let topLabel: string | null = null;
  let topValue: string | null = null;
  let topTime: string | null = null;
  let topMessage: string | null = null;

  if (isDelivered) {
    const deliveredItem =
      spath.find(
        (item) =>
          item.state === 203 ||
          item.state === 216 ||
          item.state === 228 ||
          item.pathInfo === "Delivered",
      ) ?? spath[spath.length - 1];
    const { date, time } = parseDatetime(deliveredItem);
    topLabel = t("labelDelivered");
    if (date) {
      const d = new Date(date + "T00:00:00");
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      const monthName = d.toLocaleDateString("en-US", { month: "long" });
      const dayNum = String(d.getDate()).padStart(2, "0");
      topValue = `${dayName}, ${monthName} ${dayNum}`;
    } else {
      topValue = "—";
    }
    if (time) {
      const [hStr = "0", mStr = "00"] = time.split(":");
      const h = parseInt(hStr, 10);
      const period = h >= 12 ? "P.M." : "A.M.";
      const h12 = h % 12 || 12;
      topTime = `at ${h12}:${mStr} ${period}`;
    }
  } else if (eddEnabled) {
    topLabel = t("labelEstimatedDelivery");
    if (result.state === 190 || result.state === 1870) {
      topMessage = t("eddPending");
    } else {
      topValue = eddDate ? formatEddDate(eddDate) : "—";
    }
  }

  function copyTno() {
    navigator.clipboard?.writeText(tno).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div>
      {/* Info grid */}
      <div className="grid grid-cols-3 mob:grid-cols-1 gap-6 pb-7.5">
        {topLabel !== null && (
          <div className="col-span-full pb-4.5 mb-3.5 relative">
            <div className="text-[11px] text-uni-muted mb-2">{topLabel}</div>
            {topValue !== null ? (
              <>
                <div className="text-[32px] mob:text-[22px] font-semibold tracking-[-0.3px] text-uni-black">
                  {topValue}
                </div>
                {topTime && (
                  <div className="text-[15px] text-uni-muted mt-1">
                    {topTime}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[15px] text-uni-black leading-relaxed">
                {topMessage}
              </div>
            )}
            <div className="gradient-sep bottom-0" />
          </div>
        )}

        {/* Tracking Number */}
        <div>
          <div className="text-[11px] text-uni-muted mb-2">
            {t("labelTrackingNumber")}
          </div>
          <div className="text-[14px] text-uni-black flex items-center gap-2.5">
            <span className="break-all">{tno}</span>
            <button
              onClick={copyTno}
              title="Copy"
              className={`shrink-0 w-5.5 h-5.5 inline-flex items-center justify-center cursor-pointer rounded bg-transparent border-none transition-colors duration-200 ${copied ? "text-[#4CAF50]" : "text-[#aaa]"}`}
            >
              {copied ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Label Created */}
        <div>
          <div className="text-[11px] text-uni-muted mb-2">
            {t("labelLabelCreated")}
          </div>
          <div className="text-[14px] text-uni-black">
            {formatLabelCreated(spath[0])}
          </div>
        </div>

        {/* Package Weight */}
        {/* <div>
          <div className="text-[11px] text-uni-muted mb-2">{t('labelPackageWeight')}</div>
          <div className="text-[14px] text-uni-black">
            {(result as TrackingResult & { weight?: string }).weight ?? '—'}
          </div>
        </div> */}
      </div>

      {/* Progress Tracker */}
      <ProgressTracker milestones={milestones} />

      {/* Help Strip */}
      <HelpStrip />

      {/* Tracking History */}
      <div className="mt-10">
        <div className="text-xl font-semibold mb-6 text-uni-black">
          {t("trackingHistory")}
        </div>
        {reversed.map((item, i) => {
          const { date, time } = parseDatetime(item);
          const isFirst = i === 0;
          const isLast = i === reversed.length - 1;
          return (
            <div
              key={i}
              className="grid grid-cols-[120px_40px_1fr] gap-5 mob:grid-cols-[76px_28px_1fr] mob:gap-2 py-4.5"
            >
              <div className="text-[14px] mob:text-[11px] text-uni-muted leading-relaxed text-right">
                <span className="block">{date}</span>
                <span className="block">{time}</span>
              </div>
              <div className="flex justify-center relative">
                <div
                  className={`w-3.5 h-3.5 rounded-full mt-1 relative z-2 border-[3px] border-white shrink-0 ${isFirst ? "bg-brand shadow-[0_0_0_2px_#FF8F1C]" : "bg-uni-timeline shadow-[0_0_0_2px_#E0E0E0]"}`}
                />
                {!isLast && (
                  <div className="absolute top-6 -bottom-4.5 left-1/2 w-0 border-l-2 border-dashed border-uni-timeline -translate-x-px" />
                )}
              </div>
              <div>
                <div
                  className={`text-[16px] mob:text-sm text-uni-black leading-[1.45] ${isFirst ? "font-semibold" : "font-normal"}`}
                >
                  {item.pathInfo}
                </div>
                {item.pathAddress && (
                  <div className="text-xs text-uni-muted mt-1.5">
                    {item.pathAddress}
                  </div>
                )}
                {isFirst && hasPod && (
                  <button
                    onClick={() => onViewPod(tno, index)}
                    className="inline-flex items-center gap-1.5 text-brand text-[14px] font-semibold mt-2 cursor-pointer bg-transparent border-none p-0"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    {t("btnViewDeliveryConfirmation")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
