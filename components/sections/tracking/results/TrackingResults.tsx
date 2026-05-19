"use client";

import { useState } from "react";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import ParcelCard from "./ParcelCard";
import ExportTable from "./ExportTable";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useTrackingContext } from "@/lib/context/TrackingContext";
import { Links } from "@/lib/constants";

function ParcelCardError({ tno }: { tno: string }) {
  return (
    <div className="max-w-202.5 mx-auto my-3 rounded-[10px] bg-white shadow-card px-9.5 py-5 flex items-center justify-between mob:px-5">
      <span className="text-[16px] font-semibold text-uni-black">{tno}</span>
      <span className="text-[13px] text-uni-red">Failed to load</span>
    </div>
  );
}

function MoreMenu({
  count,
  onCopy,
  onDownload,
}: {
  count: number;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  function handle(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ boxShadow: "4px 4px 10px 1px #D1E8E8" }}
        className={`flex h-6.25 cursor-pointer items-center justify-between px-5 gap-1.25 rounded-[5px] text-[12px] font-medium transition-colors duration-150 ${
          open
            ? "w-38.25 border-transparent bg-uni-gray text-white"
            : "w-37.75 border border-[#C6C6C6] bg-white text-uni-gray"
        }`}
      >
        {t("menuMore")}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
          <path
            d="M1 1L4 4L7 1"
            stroke={open ? "white" : "#4B4B4B"}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            style={{
              boxShadow: "4px 4px 10px 1px #D1E8E8",
              width: "180px",
              height: "61px",
            }}
            className="absolute right-0 z-20 mt-1.5 overflow-hidden rounded-[10px] bg-white"
          >
            <div
              onClick={() => handle(onCopy)}
              className="flex h-[30px] cursor-pointer items-center justify-between px-3 text-[13px] text-black hover:bg-gray-50"
            >
              <span>{t("menuCopy")}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </div>
            <div className="mx-3 h-px bg-[#f0f0f0]" />
            <div
              onClick={() => handle(onDownload)}
              className="flex h-[30px] cursor-pointer items-center justify-between px-3 text-[13px] text-black hover:bg-gray-50"
            >
              <span>
                {t("menuDownload")} ({count})
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InvalidSection({ tnos }: { tnos: string[] }) {
  const { t } = useTranslation();
  return (
    <div className="mt-5 flex flex-row">
      <div className="flex-1">
        <div className="rounded border border-[#f5c6cb] bg-[#ffeeee] p-4">
          <div className="mb-2 font-semibold text-[#dc3545]">
            {t("alertTitle")}
          </div>
          <div className="hidden text-[14px] text-black desk:block">
            {t("alertNoInfoDesktop")}{" "}
            <a href={Links.support} className="underline text-black">
              {t("linkCustomerService")}
            </a>{" "}
            {t("alertNoInfoSuffix")}
          </div>
          <div className="block text-[14px] text-black desk:hidden">
            {t("alertNoInfoMobile")}{" "}
            <a href={Links.support} className="underline text-black">
              {t("linkCustomerService")}
            </a>
            .
          </div>
          <div className="mt-2 text-[14px]">
            {tnos.map((t, i) => (
              <div key={i} className="flex items-center">
                &bull;&nbsp;{t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-4 hidden items-center desk:flex">
        <img src={Links.invalidSearchImg} alt="" className="w-30" />
      </div>
    </div>
  );
}

export default function TrackingResults() {
  const { t } = useTranslation();
  const {
    validResults,
    invalidTnos,
    exportRows,
    openDetails,
    piecesView,
    resultsRef,
    toggleDetail: onToggleDetail,
    closePiecesView: onClosePiecesView,
  } = useTrackingContext();

  if (!validResults.length && !invalidTnos.length) return null;

  function copyToClipboard() {
    const table = document.getElementById("excel-table");
    if (!table) return;
    table.style.display = "table";
    const range = document.createRange();
    range.selectNodeContents(table);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand("copy");
    table.style.display = "none";
  }

  function exportToExcel() {
    const table = document.getElementById(
      "excel-table",
    ) as HTMLTableElement | null;
    if (!table) return;
    table.style.display = "table";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TableToExcel = (window as any).TableToExcel;
    if (TableToExcel) {
      TableToExcel.convert(table, {
        name: t("excelFileName"),
        sheet: { name: t("excelSheetName") },
      });
    }
    table.style.display = "none";
  }

  if (piecesView) {
    return (
      <div ref={resultsRef} className="mb-25 w-full font-poppins">
        <div
          className="flex cursor-pointer items-baseline pt-10 pb-10 desk:px-0 mob:px-5 mob:-mt-7.5 mob:pt-3.75 mob:pb-3.75"
          onClick={onClosePiecesView}
        >
          <svg
            width="10"
            height="16"
            viewBox="0 0 10 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.2541 0.241064C9.55216 0.533264 9.57926 0.990508 9.33539 1.31272L9.2541 1.40503L2.52658 8L9.2541 14.595C9.55216 14.8872 9.57926 15.3444 9.33539 15.6666L9.2541 15.7589C8.95604 16.0511 8.48963 16.0777 8.16096 15.8386L8.06679 15.7589L0.745899 8.58198C0.44784 8.28978 0.420743 7.83254 0.66461 7.51033L0.745899 7.41802L8.06679 0.241064C8.39466 -0.0803548 8.92624 -0.0803548 9.2541 0.241064Z"
              fill="#121212"
            />
          </svg>
          <div className="font-poppins text-[24px] font-semibold ml-2.5 pt-7.5 mob:text-[18px]">
            {t("backToTracking")}
          </div>
        </div>

        <div className="w-full flex mb-5 border-t border-[#c3c3c3] pt-10 mob:flex-col mob:pt-5 mob:px-5">
          <div className="flex font-semibold w-2/5 items-center text-black font-poppins text-[24px] mob:w-full mob:text-[18px]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.9332 4.50698H20.0265C24.9465 4.50698 27.3465 7.13364 27.3332 12.5203V19.0136C27.3332 24.1603 24.1598 27.3336 18.9998 27.3336H8.9865C3.85317 27.3336 0.666504 24.1603 0.666504 19.0003V8.98698C0.666504 3.46698 3.11984 0.666976 7.95984 0.666976H10.0665C11.3078 0.653642 12.4665 1.22698 13.2265 2.20031L14.3998 3.76031C14.7732 4.22698 15.3332 4.50698 15.9332 4.50698ZM7.8265 18.387H20.1732C20.7198 18.387 21.1598 17.9336 21.1598 17.387C21.1598 16.827 20.7198 16.387 20.1732 16.387H7.8265C7.2665 16.387 6.8265 16.827 6.8265 17.387C6.8265 17.9336 7.2665 18.387 7.8265 18.387Z"
                fill="#101820"
              />
            </svg>
            <div className="text-black ml-7.5 mr-2.5 mob:ml-2">
              {piecesView.masterTno}
            </div>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="hidden desk:block"
            >
              <path
                d="M19 8.5L12 15.5L5 8.5"
                stroke="#121212"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="w-1/5 ml-2.5 text-uni-black font-poppins text-[24px] font-semibold mob:w-auto mob:ml-0 mob:mt-2 mob:text-[18px]">
            {piecesView.deliveredCount}/{piecesView.results.length}{" "}
            {t("pieceDelivered")}
          </div>
        </div>

        <div className="font-poppins">
          {piecesView.results.map((piece, i) => (
            <ErrorBoundary key={piece.tno} fallback={<ParcelCardError tno={piece.tno} />}>
              <ParcelCard
                result={piece}
                index={piecesView.parentIndex}
                isFirst={i === 0}
                isOpen={!!openDetails[`piece-${piece.tno}`]}
                onToggle={() => onToggleDetail(`piece-${piece.tno}`)}
              />
            </ErrorBoundary>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} className="w-full pb-25 font-poppins mt-8">
      {validResults.length > 1 && exportRows.length > 1 && (
        <div className="mx-auto mt-8 flex max-w-202.5 items-center justify-between">
          <span className="text-[12px] text-black">
            <span className="font-semibold">
              {validResults.length} {t("parcelsWord")}
            </span>
            <span className="font-normal"> {t("trackedWord")}</span>
          </span>
          <MoreMenu
            count={exportRows.length}
            onCopy={copyToClipboard}
            onDownload={exportToExcel}
          />
        </div>
      )}

      <div className="w-full font-poppins mb-25">
        {validResults.map((result, i) => (
          <ErrorBoundary key={result.tno} fallback={<ParcelCardError tno={result.tno} />}>
            <ParcelCard
              result={result}
              index={i}
              isFirst={i === 0}
              isOpen={!!openDetails[result.tno]}
              collapsible={validResults.length > 1}
              onToggle={() => onToggleDetail(result.tno)}
            />
          </ErrorBoundary>
        ))}
      </div>

      {invalidTnos.length > 0 && <InvalidSection tnos={invalidTnos} />}
      {exportRows.length > 0 && <ExportTable rows={exportRows} />}
    </div>
  );
}
