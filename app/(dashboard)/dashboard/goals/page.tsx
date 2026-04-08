import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { convertCurrency } from "@/lib/format"
import { GoalsList } from "./goals-list"

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect("/login") }
  const userId = user.id

  const [profileResult, goalsResult, incomeResult, allocationsResult] = await Promise.all([
    supabase.from("profiles").select("currency, monthly_salary, salary_currency").eq("id", userId).single(),
    supabase.from("goals_decrypted").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("income_decrypted").select("amount, currency, date").eq("user_id", userId),
    supabase.from("goal_allocations_decrypted").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
  ])

  if (profileResult.error) console.error("[goals] profile query error:", profileResult.error.message);
  if (goalsResult.error) console.error("[goals] goals query error:", goalsResult.error.message);
  if (incomeResult.error) console.error("[goals] income query error:", incomeResult.error.message);
  if (allocationsResult.error) console.error("[goals] allocations query error:", allocationsResult.error.message);

  const profile = profileResult.data
  const userCurrency = profile?.currency ?? "USD"

  // Calculate average monthly income from last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const recentIncome = (incomeResult.data ?? []).filter(
    (row) => new Date(row.date) >= threeMonthsAgo
  )
  const totalRecentIncome = recentIncome.reduce(
    (sum, row) => sum + convertCurrency(Number(row.amount), row.currency ?? "USD", userCurrency),
    0
  )
  const monthsWithData = Math.max(1, new Set(recentIncome.map((r) => r.date.slice(0, 7))).size)
  const avgMonthlyIncome = totalRecentIncome / monthsWithData

  // Use salary if set, otherwise use average
  const monthlyIncome = profile?.monthly_salary
    ? convertCurrency(Number(profile.monthly_salary), profile.salary_currency ?? "USD", userCurrency)
    : avgMonthlyIncome

  const convertedGoals = (goalsResult.data ?? []).map((g) => ({
    ...g,
    target_amount: convertCurrency(Number(g.target_amount), g.currency ?? "USD", userCurrency),
    current_amount: convertCurrency(Number(g.current_amount), g.currency ?? "USD", userCurrency),
    monthly_percentage: Number(g.monthly_percentage ?? 0),
    currency: userCurrency,
  }))

  return (
    <GoalsList
      goals={convertedGoals}
      userCurrency={userCurrency}
      monthlyIncome={monthlyIncome}
      recentAllocations={allocationsResult.data ?? []}
    />
  )
}
