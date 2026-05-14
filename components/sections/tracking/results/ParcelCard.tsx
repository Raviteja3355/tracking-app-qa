"use client";

import { useState, useEffect, useRef } from "react";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import type { TrackingResult, NoticeItem } from "@/lib/types";
import { fetchWarehouseNotices } from "@/lib/api/notice";
import { validateURPTrackingNo } from "@/lib/utils/validation";
import { useTrackingContext } from "@/lib/context/TrackingContext";
import ResultCard from "./ResultCard";

interface Props {
  result: TrackingResult;
  index: number;
  isFirst: boolean;
  isOpen: boolean;
  collapsible?: boolean;
  onToggle: () => void;
}

function dotClass(result: TrackingResult): string {
  const isURPDelivered =
    validateURPTrackingNo(result.tno) &&
    result.events?.some((e) => e.pathInfo === "Delivered");

  const base = "inline-block w-3 h-3 rounded-full mob:w-[13px] mob:h-[13px]";
  if (result.state === 203 || result.state === 228 || isURPDelivered)
    return `${base} bg-status-green`;
  if (result.state === 190 || result.state === 1870)
    return `${base} bg-status-yellow`;
  return `${base} bg-status-blue`;
}

function FolderSVG() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.45 2.88017H14.52C18.21 2.88017 20.01 4.85017 20 8.89017V13.7602C20 17.6202 17.62 20.0002 13.75 20.0002H6.24C2.39 20.0002 0 17.6202 0 13.7502V6.24017C0 2.10017 1.84 0.000170661 5.47 0.000170661H7.05C7.981 -0.00982934 8.85 0.420171 9.42 1.15017L10.3 2.32017C10.58 2.67017 11 2.88017 11.45 2.88017ZM5.37 13.2902H14.63C15.04 13.2902 15.37 12.9502 15.37 12.5402C15.37 12.1202 15.04 11.7902 14.63 11.7902H5.37C4.95 11.7902 4.62 12.1202 4.62 12.5402C4.62 12.9502 4.95 13.2902 5.37 13.2902Z"
        fill="#FF9E46"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.6665 1.33341L6.33317 6.00008L1.6665 10.6667"
        stroke="#FF9E46"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoticeBlock({ notices }: { notices: NoticeItem[] }) {
  if (!notices.length) return null;
  return (
    <div className="mt-5 flex flex-col">
      {notices.map((n, i) => (
        <div key={i} className="flex">
          <div>
            <svg
              width="25"
              height="21"
              viewBox="0 0 25 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.3827 0C11.5517 0 10.8394 0.469274 10.2458 1.52514L0.51109 17.4804C-0.676076 19.4749 0.273657 21 2.64799 21H22.2362C24.7293 21 25.679 19.3575 24.4918 17.4804L14.6384 1.40782C14.0448 0.469274 13.2138 0 12.3827 0ZM12.5015 5.27933C13.095 5.27933 13.4512 5.51397 13.8073 5.86592C14.1635 6.21788 14.2822 6.68715 14.2822 7.15642C14.2822 7.6257 13.5699 11.0279 13.3325 13.4916H11.5517C11.3143 11.0279 10.602 7.6257 10.602 7.15642C10.602 6.68715 10.8394 6.21788 11.1956 5.86592C11.5517 5.51397 12.0266 5.27933 12.5015 5.27933ZM12.5015 14.5475C12.9763 14.5475 13.4512 14.6648 13.8073 15.0168C14.1635 15.3687 14.4009 15.838 14.4009 16.3073C14.4009 16.8939 14.1635 17.2458 13.8073 17.5978C13.4512 17.9497 12.9763 18.067 12.5015 18.067C12.0266 18.067 11.5517 17.9497 11.1956 17.5978C10.8394 17.2458 10.602 16.8939 10.602 16.3073C10.602 15.838 10.8394 15.3687 11.1956 15.0168C11.5517 14.6648 12.0266 14.5475 12.5015 14.5475Z"
                fill="#FF0A0A"
              />
            </svg>
          </div>
          <div className="ml-2">
            <div className="text-xs font-semibold leading-6 text-uni-red">
              {n.title}
            </div>
            <div className="text-[10px] leading-6 text-black">
              {n.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ParcelCard({
  result,
  index,
  isFirst,
  isOpen,
  collapsible = true,
  onToggle,
}: Props) {
  const { openPiecesView: onOpenPiecesView } = useTrackingContext();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current && cardRef.current) {
      const headerHeight =
        (document.querySelector("nav") as HTMLElement | null)?.offsetHeight ??
        80;
      const top =
        cardRef.current.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        8;
      window.scrollTo({ top, behavior: "smooth" });
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const spath = result.spath_list ?? [];
    const last = spath[spath.length - 1];
    if (last?.warehouse && last.warehouse > 0) {
      fetchWarehouseNotices(last.warehouse, result.country).then(setNotices);
    }
  }, [result]);

  const isTicket = !!result.master_tno;

  const { t } = useTranslation();

  if (isTicket) {
    const dot = dotClass(result);
    const latestStatus =
      result.spath_list?.[result.spath_list.length - 1]?.pathInfo ?? "";
    const displayTno = result.selected_tno ?? result.tno;
    const overviewClass = isFirst
      ? "w-full flex items-center justify-between px-15 py-10 cursor-pointer hover:bg-[#fafafa] active:bg-[#fafafa] mob:flex-col mob:items-start mob:pl-5 mob:py-6"
      : "border-t border-[#c3c3c3] w-full flex items-end justify-between px-15 py-10 cursor-pointer hover:bg-[#fafafa] active:bg-[#fafafa] mob:flex-col mob:items-start mob:pl-5 mob:pr-[15px] mob:py-[17px]";

    return (
      <div
        className={overviewClass}
        onClick={() => onOpenPiecesView(index)}
      >
        <div className="rounded-full bg-[rgba(252,236,220,0.5)] pt-2 pr-3 pb-2 pl-4 -ml-3 text-[#ff9e46] text-[14px] font-semibold mb-6">
          <div className="flex items-center gap-2">
            <FolderSVG />
            <span className="mx-2">
              {t("pieceShipment", { count: result.orders_list?.length ?? 0 })}
            </span>
            <ChevronRight />
          </div>
        </div>
        <div className="hidden mob:flex mob:justify-between mob:w-full mob:whitespace-pre-wrap mob:wrap-break-word mob:-ml-1.25 mob:mb-1">
          <span className={dot} />
          <span className="mob:text-base mob:ml-1.5">{latestStatus}</span>
        </div>
        <div className="flex items-end w-full">
          <div className="text-black text-[20px] font-semibold flex w-4/5 items-center mob:text-base mob:w-full mob:justify-between">
            <div>{displayTno}</div>
          </div>
          <div className="flex items-center w-4/5 mob:hidden">
            <span className={dot} />
            <span className="text-[20px] ml-2.5 max-w-200">{latestStatus}</span>
          </div>
        </div>
      </div>
    );
  }

  const displayTno = result.selected_tno ?? result.tno;

  return (
    <>
      {notices.length > 0 && <NoticeBlock notices={notices} />}
      <div
        ref={cardRef}
        className="max-w-202.5 mx-auto my-3 rounded-[10px] bg-white shadow-card overflow-hidden"
      >
        <button
          onClick={collapsible ? onToggle : undefined}
          className={`w-full flex items-center justify-between px-9.5 py-5 mob:px-5 mob:py-4 bg-transparent border-none ${collapsible ? "cursor-pointer" : "cursor-default"}`}
        >
          <span className="text-[16px] font-semibold text-uni-black">
            {displayTno}
          </span>
          {collapsible && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-uni-muted transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>
        {(isOpen || !collapsible) && (
          <div className="px-9.5 pb-9.5 mob:px-5 mob:pb-6">
            <ResultCard
              result={result}
              index={index}
            />
          </div>
        )}
      </div>
    </>
  );
}
