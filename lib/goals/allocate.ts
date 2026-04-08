import type { SupabaseClient } from "@supabase/supabase-js"
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

interface AllocationResult {
  goalId: string
  goalTitle: string
  amount: number
  method: string
  note: string
}

/**
 * Distribute income to active goals based on their distribution method.
 * Called after a new income entry is created.
 */
export async function allocateIncomeToGoals(
  supabase: SupabaseClient,
  userId: string,
  incomeId: string,
  incomeAmount: number,
  incomeCurrency: string,
  incomeDescription: string,
  locale: Locale = "ar",
): Promise<AllocationResult[]> {
  // Fetch active goals
  const { data: goals } = await supabase
    .from("goals_decrypted")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("priority_order", { ascending: true })

  if (!goals || goals.length === 0) return []

  const results: AllocationResult[] = []
  let remainingForPriority = incomeAmount

  for (const goal of goals) {
    const remaining = Number(goal.target_amount) - Number(goal.current_amount)
    if (remaining <= 0) continue

    let allocation = 0
    let method = goal.distribution_method ?? "percentage"
    let note = ""

    if (method === "percentage") {
      const pct = Number(goal.monthly_percentage ?? 0)
      if (pct <= 0) continue
      allocation = incomeAmount * pct / 100
      note = t(locale, "allocPercentNote", { pct, desc: incomeDescription, currency: incomeCurrency, amount: incomeAmount })
    } else if (method === "fixed") {
      const fixedAmt = Number(goal.fixed_amount ?? 0)
      if (fixedAmt <= 0) continue
      allocation = fixedAmt
      note = t(locale, "allocFixedNote", { currency: incomeCurrency, fixed: fixedAmt, desc: incomeDescription })
    } else if (method === "priority") {
      if (remainingForPriority <= 0) continue
      allocation = Math.min(remaining, remainingForPriority)
      remainingForPriority -= allocation
      note = t(locale, "allocPriorityNote", {
        order: goal.priority_order + 1,
        currency: incomeCurrency,
        amount: allocation.toFixed(2),
        desc: incomeDescription,
      })
    }

    // Don't allocate more than what's remaining on the goal
    allocation = Math.min(allocation, remaining)
    if (allocation <= 0) continue

    // Update goal's current_amount
    const newAmount = Number(goal.current_amount) + allocation
    const newStatus = newAmount >= Number(goal.target_amount) ? "completed" : "active"

    await supabase
      .from("goals")
      .update({
        current_amount: newAmount,
        status: newStatus,
      })
      .eq("id", goal.id)

    // Log the allocation
    await supabase.from("goal_allocations").insert({
      user_id: userId,
      goal_id: goal.id,
      income_id: incomeId,
      amount: allocation,
      currency: incomeCurrency,
      method,
      note,
    })

    results.push({
      goalId: goal.id,
      goalTitle: goal.title,
      amount: allocation,
      method,
      note,
    })
  }

  return results
}
