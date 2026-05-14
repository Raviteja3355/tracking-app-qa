"use client";

import { useState } from "react";

export default function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-uni-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between gap-4 px-1 py-4.25 text-left text-[14px] font-medium tracking-[0.07px] transition-colors duration-200 ${open ? "text-[#FF8F1C]" : "text-[#020617] hover:text-[#FF8F1C]"}`}
      >
        <span>{q}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className={`overflow-hidden px-1 text-[14px] leading-[1.6] text-[#4a4a4a] transition-all duration-300 ${open ? "max-h-100 pb-5" : "max-h-0 pb-0"}`}
      >
        {a}
      </div>
    </div>
  );
}
