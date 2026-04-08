"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { translations, type Locale } from "./translations"

interface I18nContext {
  locale: Locale
  t: (typeof translations)["ar"]
  dir: "rtl" | "ltr"
  setLocale: (locale: Locale) => void
}

const I18nCtx = createContext<I18nContext>({
  locale: "ar",
  t: translations.ar,
  dir: "rtl",
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar")

  useEffect(() => {
    const saved = localStorage.getItem("safi-lang") as Locale | null
    if (saved && (saved === "ar" || saved === "en")) {
      setLocaleState(saved)
      document.cookie = "safi-lang=" + saved + ";path=/;max-age=31536000"
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("safi-lang", newLocale)
    document.cookie = "safi-lang=" + newLocale + ";path=/;max-age=31536000"
    document.documentElement.lang = newLocale
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr"
  }

  const t = translations[locale] as (typeof translations)["ar"]
  const dir = locale === "ar" ? "rtl" as const : "ltr" as const

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  return (
    <I18nCtx.Provider value={{ locale, t, dir, setLocale }}>
      {children}
    </I18nCtx.Provider>
  )
}

export function useI18n() {
  return useContext(I18nCtx)
}
