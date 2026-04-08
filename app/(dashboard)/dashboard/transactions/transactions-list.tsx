"use client"

import { useState } from "react"
import type { Transaction } from "@/lib/types/database"
import { AddTransactionDialog } from "./add-transaction-dialog"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { convertAndFormat } from "@/lib/format"
import { useI18n } from "@/lib/i18n/context"
import type { Locale } from "@/lib/i18n/translations"

type FilterType = "all" | "income" | "expense"

export function TransactionsList({
  transactions,
  userCurrency,
  locale: serverLocale,
}: {
  transactions: Transaction[]
  userCurrency: string
  locale?: Locale
}) {
  const { t, locale: clientLocale } = useI18n()
  const locale = serverLocale ?? clientLocale
  const [filter, setFilter] = useState<FilterType>("all")

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: t.all, value: "all" },
    { label: t.income, value: "income" },
    { label: t.expensesTab, value: "expense" },
  ]

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.type === filter)

  return (
    <div className="space-y-4">
      {/* Header with filter tabs and add button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Filter Tabs */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 h-8 rounded-lg text-sm font-medium transition-all ${
                filter === tab.value
                  ? "bg-white/[0.08] text-[#e2e8f0]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AddTransactionDialog />
      </div>

      {/* Transaction List */}
      <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-[20px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#64748b] text-sm">{t.noTransactions}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((tx) => {
              const isIncome = tx.type === "income"
              const subtitle = isIncome
                ? (tx.client_name || tx.project_name || null)
                : (tx.merchant || tx.category || null)

              return (
                <div
                  key={`${tx.type}-${tx.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Type Icon */}
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? "bg-[#10b981]/10 text-[#10b981]"
                        : "bg-[#ef4444]/10 text-[#ef4444]"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="size-5" />
                    ) : (
                      <ArrowDownLeft className="size-5" />
                    )}
                  </div>

                  {/* Description + subtitle */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e2e8f0] text-sm font-medium truncate">
                      {tx.description || (isIncome ? t.incomeType : t.expenseType)}
                    </p>
                    {subtitle && (
                      <p className="text-[#64748b] text-xs mt-0.5 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-[#64748b] text-xs hidden sm:block shrink-0">
                    {formatDate(tx.date)}
                  </div>

                  {/* Amount */}
                  <div
                    className={`text-sm font-semibold shrink-0 ${
                      isIncome ? "text-[#10b981]" : "text-[#ef4444]"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {convertAndFormat(tx.amount, tx.currency, userCurrency)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
