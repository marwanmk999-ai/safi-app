import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { convertCurrency } from "@/lib/format"
import { SmartBudgetView } from "./smart-budget-view"

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect("/login") }
  const userId = user.id

  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - dayOfMonth

  // Previous month boundaries
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStart = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}-01`
  const prevMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

  // 30 days ago
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const { data: profile } = await supabase.from("profiles").select("currency, monthly_salary, salary_currency").eq("id", userId).single()
  const userCurrency = profile?.currency ?? "USD"

  const [
    budgetResult,
    thisMonthExpenses,
    prevMonthExpenses,
    last30Expenses,
    thisMonthIncome,
    subscriptionsResult,
  ] = await Promise.all([
    supabase.from("budget_limits").select("*").eq("user_id", userId),
    supabase.from("expenses_decrypted").select("amount, currency, category, date").eq("user_id", userId).gte("date", monthStart).lte("date", todayStr),
    supabase.from("expenses_decrypted").select("amount, currency, category").eq("user_id", userId).gte("date", prevMonthStart).lt("date", prevMonthEnd),
    supabase.from("expenses_decrypted").select("amount, currency, date").eq("user_id", userId).gte("date", thirtyDaysAgo.toISOString().split("T")[0]).lte("date", todayStr),
    supabase.from("income_decrypted").select("amount, currency").eq("user_id", userId).gte("date", monthStart).lte("date", todayStr),
    supabase.from("subscriptions_decrypted").select("amount, currency, billing_cycle").eq("user_id", userId).eq("is_active", true),
  ])

  // Convert helper
  const toUser = (amt: number, cur: string) => convertCurrency(amt, cur ?? "USD", userCurrency)

  // This month totals
  const thisMonthTotal = (thisMonthExpenses.data ?? []).reduce((s, r) => s + toUser(Number(r.amount), r.currency), 0)
  const prevMonthTotal = (prevMonthExpenses.data ?? []).reduce((s, r) => s + toUser(Number(r.amount), r.currency), 0)
  const thisMonthIncomeTotal = (thisMonthIncome.data ?? []).reduce((s, r) => s + toUser(Number(r.amount), r.currency), 0)

  // Monthly subscriptions
  const monthlySubs = (subscriptionsResult.data ?? []).reduce((s, sub) => {
    const amt = Number(sub.amount)
    const monthly = sub.billing_cycle === "yearly" ? amt / 12 : sub.billing_cycle === "weekly" ? amt * 4.33 : amt
    return s + toUser(monthly, sub.currency)
  }, 0)

  // Category breakdown this month
  const categoryMap: Record<string, { thisMonth: number; prevMonth: number }> = {}
  for (const r of thisMonthExpenses.data ?? []) {
    const cat = r.category || "other"
    if (!categoryMap[cat]) categoryMap[cat] = { thisMonth: 0, prevMonth: 0 }
    categoryMap[cat].thisMonth += toUser(Number(r.amount), r.currency)
  }
  for (const r of prevMonthExpenses.data ?? []) {
    const cat = r.category || "other"
    if (!categoryMap[cat]) categoryMap[cat] = { thisMonth: 0, prevMonth: 0 }
    categoryMap[cat].prevMonth += toUser(Number(r.amount), r.currency)
  }
  const categories = Object.entries(categoryMap)
    .map(([name, data]) => ({
      name,
      thisMonth: data.thisMonth,
      prevMonth: data.prevMonth,
      change: data.prevMonth > 0 ? ((data.thisMonth - data.prevMonth) / data.prevMonth) * 100 : 0,
    }))
    .sort((a, b) => b.thisMonth - a.thisMonth)

  // Daily totals for sparkline
  const dailyMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    dailyMap[d.toISOString().split("T")[0]] = 0
  }
  for (const r of last30Expenses.data ?? []) {
    dailyMap[r.date] = (dailyMap[r.date] ?? 0) + toUser(Number(r.amount), r.currency)
  }
  const dailyTotals = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)

  // Budget limits with spend data
  const budgets = (budgetResult.data ?? []).map((bl) => {
    const limitAmount = bl.budget_type === "percentage"
      ? thisMonthIncomeTotal * (Number(bl.percentage) / 100)
      : toUser(Number(bl.amount), bl.currency)

    const relevantExpenses = (thisMonthExpenses.data ?? []).filter((exp) => {
      if (bl.category && exp.category !== bl.category) return false
      if (bl.period === "daily" && exp.date !== todayStr) return false
      return true
    })
    const spent = relevantExpenses.reduce((s, r) => s + toUser(Number(r.amount), r.currency), 0)

    return { ...bl, limitAmount, spent, currency: userCurrency }
  })

  // Prediction: end of month spend
  const avgDailySpend = dayOfMonth > 0 ? thisMonthTotal / dayOfMonth : 0
  const predictedEndOfMonth = avgDailySpend * daysInMonth

  // Smart suggestion: based on last 3 months average
  const suggestedBudget = prevMonthTotal > 0 ? Math.round(prevMonthTotal * 0.9) : Math.round(thisMonthTotal * 1.1)

  // Fixed vs variable
  const fixedCategories = ["اشتراكات", "subscriptions"]
  const fixedExpenses = monthlySubs
  const variableExpenses = thisMonthTotal

  return (
    <SmartBudgetView
      budgets={budgets}
      dailyTotals={dailyTotals}
      userCurrency={userCurrency}
      thisMonthTotal={thisMonthTotal}
      prevMonthTotal={prevMonthTotal}
      thisMonthIncome={thisMonthIncomeTotal}
      monthlySubs={monthlySubs}
      categories={categories}
      dayOfMonth={dayOfMonth}
      daysInMonth={daysInMonth}
      daysRemaining={daysRemaining}
      avgDailySpend={avgDailySpend}
      predictedEndOfMonth={predictedEndOfMonth}
      suggestedBudget={suggestedBudget}
      fixedExpenses={fixedExpenses}
      variableExpenses={variableExpenses}
    />
  )
}
