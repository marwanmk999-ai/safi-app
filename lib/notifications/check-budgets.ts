import type { SupabaseClient } from "@supabase/supabase-js"
import { convertCurrency } from "@/lib/format"
import { translations, type Locale } from "@/lib/i18n/translations"

function t(locale: Locale, key: keyof typeof translations.ar, vars?: Record<string, string | number>): string {
  let text = translations[locale][key] as string
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

/**
 * Check budget limits and create notifications if approaching or exceeding.
 * Called from dashboard server component on each page load.
 */
export async function checkBudgetNotifications(
  supabase: SupabaseClient,
  userId: string,
  userCurrency: string,
  locale: Locale = "ar",
) {
  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

  // Fetch budget limits
  const { data: limits } = await supabase
    .from("budget_limits")
    .select("*")
    .eq("user_id", userId)

  if (!limits || limits.length === 0) return

  // Fetch this month's expenses
  const { data: expenses } = await supabase
    .from("expenses_decrypted")
    .select("amount, currency, category, date")
    .eq("user_id", userId)
    .gte("date", monthStart)
    .lte("date", todayStr)

  // Check today's existing notifications to avoid duplicates
  const { data: todayNotifs } = await supabase
    .from("notifications")
    .select("title")
    .eq("user_id", userId)
    .gte("created_at", todayStr + "T00:00:00Z")

  const existingTitles = new Set((todayNotifs ?? []).map((n) => n.title))

  const newNotifs: Array<{
    user_id: string
    title: string
    message: string
    type: string
    link: string
  }> = []

  for (const limit of limits) {
    const limitAmount = convertCurrency(Number(limit.amount), limit.currency ?? "USD", userCurrency)
    const categoryLabel = limit.category ?? t(locale, "allCategories")

    const relevantExpenses = (expenses ?? []).filter((exp) => {
      if (limit.category && exp.category !== limit.category) return false
      if (limit.period === "daily" && exp.date !== todayStr) return false
      return true
    })

    const spent = relevantExpenses.reduce(
      (sum, exp) => sum + convertCurrency(Number(exp.amount), exp.currency ?? "USD", userCurrency),
      0
    )

    const pct = limitAmount > 0 ? (spent / limitAmount) * 100 : 0
    const periodLabel = limit.period === "daily" ? t(locale, "dailyPeriod") : t(locale, "monthlyPeriod")

    if (pct >= 100) {
      const title = t(locale, "budgetExceeded") + " " + periodLabel
      if (!existingTitles.has(title)) {
        newNotifs.push({
          user_id: userId,
          title,
          message: t(locale, "budgetExceededMsg", { pct: Math.round(pct), period: periodLabel, category: categoryLabel }),
          type: "danger",
          link: "/dashboard/budgets",
        })
      }
    } else if (pct >= 80) {
      const title = t(locale, "budgetApproaching") + " " + periodLabel
      if (!existingTitles.has(title)) {
        newNotifs.push({
          user_id: userId,
          title,
          message: t(locale, "budgetApproachingMsg", {
            pct: Math.round(pct),
            period: periodLabel,
            category: categoryLabel,
            remaining: Math.round(limitAmount - spent),
            currency: userCurrency,
          }),
          type: "warning",
          link: "/dashboard/budgets",
        })
      }
    }
  }

  // Also check subscriptions renewing within 3 days
  const threeDaysLater = new Date(now)
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)
  const threeDaysStr = threeDaysLater.toISOString().split("T")[0]

  const { data: upcomingSubs } = await supabase
    .from("subscriptions_decrypted")
    .select("name, amount, currency, next_renewal_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("next_renewal_date", todayStr)
    .lte("next_renewal_date", threeDaysStr)

  for (const sub of upcomingSubs ?? []) {
    const title = t(locale, "subscriptionRenewing", { name: sub.name })
    if (!existingTitles.has(title)) {
      newNotifs.push({
        user_id: userId,
        title,
        message: t(locale, "subscriptionRenewingMsg", {
          name: sub.name,
          date: sub.next_renewal_date,
          amount: sub.amount,
          currency: sub.currency,
        }),
        type: "info",
        link: "/dashboard/subscriptions",
      })
    }
  }

  if (newNotifs.length > 0) {
    await supabase.from("notifications").insert(newNotifs)
  }
}
