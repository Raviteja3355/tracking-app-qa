"use client";

import { useState, useEffect } from "react";
import Logo from "@/components/icons/Logo";
import ChevronDown from "@/components/icons/ChevronDown";
import en from "@/lib/i18n/locales/en.json";
import fr from "@/lib/i18n/locales/fr.json";
import { Links } from "@/lib/constants";

const translations = { en, fr } as const;

const LANGUAGES = [
  { code: "en", label: "English", href: "/tracking/" },
  { code: "fr", label: "Français", href: "/fr/suivi/" },
];

export default function Header({ locale = "en" }: { locale?: "en" | "fr" }) {
  const t = translations[locale] as Record<string, string>;
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(
    () => LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0],
  );

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Header bar — z-50, always on top */}
      <nav className="sticky top-0 z-50 flex items-center justify-between bg-white px-14 py-6 mob:px-5 mob:py-4">
        <a
          href={Links.home}
          aria-label="UniUni home"
          title="UniUni"
          className="inline-flex items-center"
        >
          <Logo className="h-8.5 w-auto mob:h-7" />
          <span className="sr-only">UniUni</span>
        </a>

        {/* Desktop nav */}
        <div className="flex items-center gap-8 mob:hidden">
          <a href="#faqs" title={t["navFaqs"]} className="text-[16px] font-medium text-uni-black transition-colors duration-200 hover:text-[#FF8F1C]">
            {t["navFaqs"]}
          </a>
          <a href="#support" title={t["navSupport"]} className="text-[16px] font-medium text-uni-black transition-colors duration-200 hover:text-[#FF8F1C]">
            {t["navSupport"]}
          </a>

          {/* Desktop language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[14px] font-medium text-uni-black cursor-pointer"
            >
              {currentLang.label}
              <ChevronDown className={`transition-transform duration-200 ${langOpen ? "translate-y-0.5" : ""}`} />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-uni-border bg-white shadow-lg">
                  {LANGUAGES.map((lang) => (
                    <a
                      key={lang.code}
                      href={lang.href}
                      title={lang.label}
                      onClick={() => { setCurrentLang(lang); setLangOpen(false); }}
                      className={`block px-5 py-3 text-[14px] font-medium hover:text-[#FF8F1C] ${currentLang.code === lang.code ? "text-[#FF8F1C]" : "text-uni-black"}`}
                    >
                      {lang.label}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger — hidden on desktop */}
        <button
          className="hidden mob:flex items-center justify-center w-9 h-9 rounded-md text-uni-black"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="transition-opacity duration-200"
          >
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/*
        Mobile overlay — z-40 (below header z-50).
        Always in DOM; opacity+transform control visibility.
        Header stays visible on top because z-50 > z-40.
      */}
      <div
        aria-hidden={!mobileOpen}
        inert={!mobileOpen || undefined}
        className={`fixed inset-0 z-40 bg-white flex flex-col pt-15 transition-[opacity,transform] duration-250 ease-out ${mobileOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1.5 pointer-events-none"}`}
      >
        <div className="px-5 pt-2 flex flex-col">
          <a
            href="#faqs"
            title={t["navFaqs"]}
            onClick={() => setMobileOpen(false)}
            className="flex items-center py-4 text-[18px] font-medium text-uni-black border-b border-[#f2f2f2] hover:text-[#FF8F1C] transition-colors"
          >
            {t["navFaqs"]}
          </a>
          <a
            href="#support"
            title={t["navSupport"]}
            onClick={() => setMobileOpen(false)}
            className="flex items-center py-4 text-[18px] font-medium text-uni-black border-b border-[#f2f2f2] hover:text-[#FF8F1C] transition-colors"
          >
            {t["navSupport"]}
          </a>

          <div className="pt-5">
            <div className="text-[12px] text-uni-muted mb-2 uppercase tracking-wider font-medium">Language</div>
            <div className="flex flex-col">
              {LANGUAGES.map((lang) => (
                <a
                  key={lang.code}
                  href={lang.href}
                  title={lang.label}
                  onClick={() => { setCurrentLang(lang); setMobileOpen(false); }}
                  className={`flex items-center gap-2 py-2.5 text-[16px] font-medium transition-colors ${
                    currentLang.code === lang.code ? "text-[#FF8F1C]" : "text-uni-black hover:text-[#FF8F1C]"
                  }`}
                >
                  <span className="w-4 flex justify-center">
                    {currentLang.code === lang.code && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {lang.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
