import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { convertCurrency } from "@/lib/format"
import { SubscriptionsList } from "./subscriptions-list"
import type { Subscription } from "@/lib/types/database"

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect("/login") }
  const userId = user.id

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", userId)
    .single()

  if (profileError) console.error("[subscriptions] profile query error:", profileError.message);
  const userCurrency = profile?.currency ?? "USD"

  const { data: subscriptions, error: subsError } = await supabase
    .from("subscriptions_decrypted")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("next_renewal_date", { ascending: true })

  if (subsError) console.error("[subscriptions] subscriptions query error:", subsError.message);

  const subs: Subscription[] = subscriptions ?? []

  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Calculate monthly equivalent for each subscription
  const monthlyEquivalents = subs.map((s) => {
    let monthly = s.amount
    if (s.billing_cycle === "yearly") monthly = s.amount / 12
    else if (s.billing_cycle === "weekly") monthly = s.amount * 4.33
    return convertCurrency(monthly, s.currency, userCurrency)
  })

  const totalMonthly = monthlyEquivalents.reduce((sum, v) => sum + v, 0)

  const renewingSoonCount = subs.filter((s) => {
    const renewal = new Date(s.next_renewal_date)
    return renewal >= now && renewal <= sevenDaysLater
  }).length

  return (
    <SubscriptionsList
      subscriptions={subs}
      userCurrency={userCurrency}
      totalMonthly={totalMonthly}
      renewingSoonCount={renewingSoonCount}
    />
  )
}
