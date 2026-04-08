"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Bell, CreditCard } from "lucide-react"
import { formatAmount } from "@/lib/format"
import type { Subscription } from "@/lib/types/database"
import { AddSubscriptionDialog } from "./add-subscription-dialog"

interface Props {
  subscriptions: Subscription[]
  userCurrency: string
  totalMonthly: number
  renewingSoonCount: number
}

export function SubscriptionsList({ subscriptions, userCurrency, totalMonthly, renewingSoonCount }: Props) {
  const { t, dir } = useI18n()
  const [addOpen, setAddOpen] = useState(false)

  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const cycleLabel = (cycle: string) => {
    if (cycle === "weekly") return t.weekly
    if (cycle === "yearly") return t.yearly
    return t.monthly
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <button
          onClick={() => setAddOpen(true)}
          className="h-12 rounded-xl px-6 font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] text-sm"
        >
          {t.addSubscription}
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[#64748b] text-sm mb-1">{t.monthlyTotal}</p>
            <p className="text-2xl font-bold text-[#e2e8f0]">
              {formatAmount(totalMonthly, userCurrency)}
            </p>
          </div>
          {renewingSoonCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
              <Bell className="size-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">
                {renewingSoonCount} {t.renewingSoon}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-12 backdrop-blur-sm text-center">
          <CreditCard className="size-12 text-[#3b82f6] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
            {t.noSubscriptions}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => {
            const renewalDate = new Date(sub.next_renewal_date)
            const isRenewingSoon = renewalDate >= now && renewalDate <= sevenDaysLater
            const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            const isWithinReminder = daysUntilRenewal >= 0 && daysUntilRenewal <= sub.reminder_days_before

            return (
              <div
                key={sub.id}
                className={`bg-white/[0.04] border rounded-[20px] p-6 backdrop-blur-sm hover:bg-white/[0.06] transition-colors ${
                  isWithinReminder
                    ? "border-amber-500/30"
                    : "border-white/[0.08]"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${
                      isWithinReminder
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-[#3b82f6]/10 text-[#3b82f6]"
                    }`}>
                      <Bell className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#e2e8f0]">{sub.name}</h3>
                      {sub.category && (
                        <span className="text-xs text-[#64748b] bg-white/[0.06] rounded-full px-2 py-0.5 mt-1 inline-block">
                          {sub.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {isRenewingSoon && (
                    <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-1">
                      {t.renewingSoon}
                    </span>
                  )}
                </div>

                {/* Amount + Cycle */}
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#e2e8f0] font-medium">
                    {formatAmount(sub.amount, sub.currency)}
                  </span>
                  <span className="text-[#64748b]">
                    {cycleLabel(sub.billing_cycle)}
                  </span>
                </div>

                {/* Next Renewal */}
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span>{t.nextRenewal}</span>
                  <span className={isWithinReminder ? "text-amber-400 font-medium" : ""}>
                    {renewalDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddSubscriptionDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
