import FAQItem from "./FAQItem";
import en from "@/lib/i18n/locales/en.json";
import fr from "@/lib/i18n/locales/fr.json";
import type { Locale } from "@/lib/types";

const translations = { en, fr } as const;

export default function FAQ({ locale = "en" }: { locale?: Locale }) {
  const t = translations[locale] as Record<string, string>;
  const items = Array.from({ length: 14 }, (_, i) => ({
    q: t[`faqQ${i + 1}`] ?? "",
    a: t[`faqA${i + 1}`] ?? "",
  }));

  return (
    <section
      id="faqs"
      className="bg-faq-gradient relative w-full py-15 pb-25 max-[720px]:py-10 max-[720px]:pb-17.5"
    >
      <div className="mx-auto max-w-280 px-8 max-[720px]:px-5">
        <h2 className="mb-7 text-center text-[36px] font-semibold text-uni-black tracking-[-0.72px] leading-[1.1] max-[720px]:text-[28px]">
          {t["faqHeading"]}
        </h2>
        <div className="mx-auto mt-7.5 max-w-205">
          {items.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
