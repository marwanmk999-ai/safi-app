"use client"

import { useI18n } from "@/lib/i18n/context"

export default function TermsPage() {
  const { t, locale, setLocale, dir } = useI18n()

  const isAr = locale === "ar"

  return (
    <div className="safi-page-enter">
      {/* Language toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLocale(isAr ? "en" : "ar")}
          className="rounded-full px-4 py-1.5 border border-white/10 text-xs text-[#64748b] hover:text-[#94a3b8] hover:border-white/20 bg-white/[0.03] backdrop-blur-sm transition-all duration-300"
        >
          {t.toggleLang}
        </button>
      </div>

      <div className="safi-card p-8 md:p-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0] mb-2">{t.termsOfService}</h1>
          <p className="text-[#64748b] text-sm">{t.lastUpdated}</p>
        </div>

        <Section title={t.termsSection1Title} content={t.termsSection1Content} />
        <Section title={t.termsSection2Title} content={t.termsSection2Content} />
        <Section title={t.termsSection3Title} content={t.termsSection3Content} />
        <Section title={t.termsSection4Title} content={t.termsSection4Content} />
        <Section title={t.termsSection5Title} content={t.termsSection5Content} />
        <Section title={t.termsSection6Title} content={t.termsSection6Content} />
        <Section title={t.termsSection7Title} content={t.termsSection7Content} />
        <Section title={t.termsSection8Title} content={t.termsSection8Content} />
      </div>
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-[#e2e8f0] mb-2">{title}</h2>
      <p className="text-[#94a3b8] text-sm leading-relaxed">{content}</p>
    </div>
  )
}
