"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const { t, dir } = useI18n()

  return (
    <div dir={dir} className="min-h-screen bg-[#070b14] relative overflow-hidden">
      {/* Geometric arabesque pattern */}
      <div className="absolute inset-0 safi-pattern" />

      {/* Ambient gradient orb */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors mb-8"
        >
          <ArrowRight className="size-4 rtl:rotate-0 ltr:rotate-180" />
          {t.back}
        </Link>

        {children}
      </div>
    </div>
  )
}
