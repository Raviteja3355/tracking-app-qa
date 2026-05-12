'use client'

import '@/lib/i18n'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-uni-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between gap-4 px-1 py-4.25 text-left text-[14px] font-medium tracking-[0.07px] transition-colors duration-200 ${open ? 'text-[#FF8F1C]' : 'text-[#020617] hover:text-[#FF8F1C]'}`}
      >
        <span>{q}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className="overflow-hidden px-1 text-[14px] leading-[1.6] text-[#4a4a4a] transition-all duration-300"
        style={{ maxHeight: open ? '400px' : '0', paddingBottom: open ? '20px' : '0' }}
      >
        {a}
      </div>
    </div>
  )
}

export default function FAQ() {
  const { t } = useTranslation()
  const items = Array.from({ length: 14 }, (_, i) => ({
    q: t(`faqQ${i + 1}`),
    a: t(`faqA${i + 1}`),
  }))
  return (
    <section
      id="faqs"
      className="relative w-full py-15 pb-25 max-[720px]:py-10 max-[720px]:pb-17.5"
      style={{ background: 'linear-gradient(to top, #fff 0%, #FBFAF7 100%)' }}
    >
      <div className="mx-auto max-w-280 px-8 max-[720px]:px-5">
        <h2
          className="mb-7 text-center text-[36px] font-semibold text-uni-black max-[720px]:text-[28px]"
          style={{ letterSpacing: '-0.72px', lineHeight: '1.1' }}
        >
          {t('faqHeading')}
        </h2>
        <div className="mx-auto mt-7.5 max-w-205">
          {items.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
