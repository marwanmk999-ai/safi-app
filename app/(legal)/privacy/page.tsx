"use client"

import { useI18n } from "@/lib/i18n/context"

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold text-[#e2e8f0] mb-2">{t.privacyPolicy}</h1>
          <p className="text-[#64748b] text-sm">{t.lastUpdated}</p>
        </div>

        <Section title={t.privacySection1Title} content={t.privacySection1Content} />
        <Section title={t.privacySection2Title} content={t.privacySection2Content} />
        <Section title={t.privacySection3Title} content={t.privacySection3Content} />
        <Section title={t.privacySection4Title} content={t.privacySection4Content} />
        <Section title={t.privacySection5Title} content={t.privacySection5Content} />
        <Section title={t.privacySection6Title} content={t.privacySection6Content} />
        <Section title={t.privacySection7Title} content={t.privacySection7Content} />
        <Section title={t.privacySection8Title} content={t.privacySection8Content} />
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
