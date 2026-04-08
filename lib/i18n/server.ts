import { cookies } from "next/headers"
import { translations } from "./translations"
import type { Locale } from "./translations"

export async function getServerTranslations() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get("safi-lang")?.value ?? "ar") as Locale
  const validLocale: Locale = locale === "en" ? "en" : "ar"
  return {
    t: translations[validLocale],
    locale: validLocale,
    dir: (validLocale === "ar" ? "rtl" : "ltr") as "rtl" | "ltr",
  }
}
