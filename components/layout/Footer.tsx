import en from "@/lib/i18n/locales/en.json";
import fr from "@/lib/i18n/locales/fr.json";
import type { Locale } from "@/lib/types";
import { Links } from "@/lib/constants";

const translations = { en, fr } as const;

const FOOTER_LINKS = [
  { key: "footerTerms", href: Links.terms },
  { key: "footerPrivacy", href: Links.privacy },
  { key: "footerCookies", href: Links.cookies },
];

export default function Footer({ locale = "en" }: { locale?: Locale }) {
  const t = translations[locale] as Record<string, string>;
  return (
    <footer className="flex flex-wrap items-center justify-center gap-8 border-t border-uni-divider px-14 py-[30px] font-poppins text-[13px] text-[#999] mob:px-5 mob:gap-5">
      <span>{t["footerCopyright"]}</span>
      <span className="flex items-center gap-3">
        {FOOTER_LINKS.map((link, i) => (
          <span key={link.key} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden="true">·</span>}
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-150 hover:text-[#FF8F1C]"
            >
              {t[link.key]}
            </a>
          </span>
        ))}
      </span>
    </footer>
  );
}
