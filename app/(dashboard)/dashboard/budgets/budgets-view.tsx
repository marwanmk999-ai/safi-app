"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { formatAmount } from "@/lib/format"
import type { BudgetLimit } from "@/lib/types/database"
import { SetBudgetDialog } from "./set-budget-dialog"
import { Wallet, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react"

interface BudgetWithSpend extends BudgetLimit {
  spent: number
}

function getStatus(spent: number, limit: number) {
  const ratio = limit > 0 ? spent / limit : 0
  if (ratio > 1) return "over" as const
  if (ratio >= 0.8) return "approaching" as const
  return "under" as const
}

const statusConfig = {
  under: { color: "#10b981", icon: CheckCircle2 },
  approaching: { color: "#f59e0b", icon: AlertTriangle },
  over: { color: "#ef4444", icon: TrendingDown },
}

function Sparkline({ data, budgetLine }: { data: number[]; budgetLine: number | null }) {
  if (data.length === 0) return null
  const maxVal = Math.max(...data, budgetLine ?? 0, 1)
  const w = 280, h = 50, p = 2
  const points = data.map((v, i) => {
    const x = p + (i / (data.length - 1)) * (w - p * 2)
    const y = h - p - (v / maxVal) * (h - p * 2)
    return `${x},${y}`
  })
  const budgetY = budgetLine != null ? h - p - (budgetLine / maxVal) * (h - p * 2) : null
  const lastVal = data[data.length - 1] ?? 0
  const lineColor = budgetLine != null && lastVal > budgetLine ? "#ef4444" : "#10b981"

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-[50px]">
      <polygon points={`${p},${h - p} ${points.join(" ")} ${w - p},${h - p}`} fill={lineColor} fillOpacity="0.06" />
      <polyline points={points.join(" ")} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {budgetY != null && (
        <line x1={p} y1={budgetY} x2={w - p} y2={budgetY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
      )}
    </svg>
  )
}

export function BudgetsView({
  budgets,
  dailyTotals,
  userCurrency,
}: {
  budgets: BudgetWithSpend[]
  dailyTotals: number[]
  userCurrency: string
}) {
  const { t, dir, locale } = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)

  const monthlyBudget = budgets.find((b) => b.period === "monthly" && !b.category)
  const dailyBudget = budgets.find((b) => b.period === "daily" && !b.category)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const dayOfMonth = new Date().getDate()
  const daysRemaining = daysInMonth - dayOfMonth

  return (
    <div className="space-y-6 max-w-4xl" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#e2e8f0]">{t.budgets}</h2>
        <button
          onClick={() => setDialogOpen(true)}
          className="h-10 rounded-xl px-5 font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all text-sm"
        >
          {t.setBudget}
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="safi-card p-12 text-center">
          <Wallet className="size-12 text-[#3b82f6]/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">{t.noBudgets}</h3>
          <p className="text-sm text-[#64748b] mb-4">
            {t.setBudgetHelpMsg}
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="safi-btn-primary px-6 mx-auto"
          >
            {t.setBudget}
          </button>
        </div>
      ) : (
        <>
          {/* Main Budget Hero — Monthly */}
          {monthlyBudget && (() => {
            const status = getStatus(monthlyBudget.spent, monthlyBudget.amount)
            const { color, icon: StatusIcon } = statusConfig[status]
            const pct = monthlyBudget.amount > 0 ? (monthlyBudget.spent / monthlyBudget.amount) * 100 : 0
            const remaining = Math.max(monthlyBudget.amount - monthlyBudget.spent, 0)
            const dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0

            return (
              <div className="safi-card p-8 relative overflow-hidden">
                {/* Accent glow */}
                <div className="absolute -top-20 -end-20 w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${color}10 0%, transparent 70%)` }} />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <StatusIcon className="size-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#e2e8f0]">{t.monthlyBudget}</p>
                      <p className="text-xs" style={{ color }}>
                        {status === "over" ? t.overBudget : status === "approaching" ? t.approachingLimit : t.underBudget}
                      </p>
                    </div>
                  </div>

                  {/* Big progress bar */}
                  <div className="mb-4">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-3xl font-bold text-[#e2e8f0] tabular-nums">
                        {formatAmount(monthlyBudget.spent, userCurrency)}
                      </span>
                      <span className="text-sm text-[#64748b]">
                        {t.ofBudget} {formatAmount(monthlyBudget.amount, userCurrency)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-[#475569]">
                      <span>{Math.round(pct)}%</span>
                      <span>{daysRemaining} {t.daysLeftLabel}</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                    <div>
                      <p className="text-[10px] text-[#64748b] uppercase">{t.remainingBudget}</p>
                      <p className="text-lg font-bold tabular-nums" style={{ color }}>
                        {formatAmount(remaining, userCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b] uppercase">
                        {t.dailyAllowance}
                      </p>
                      <p className="text-lg font-bold text-[#e2e8f0] tabular-nums">
                        {formatAmount(dailyAllowance, userCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b] uppercase">
                        {t.avgDailySpend}
                      </p>
                      <p className="text-lg font-bold text-[#e2e8f0] tabular-nums">
                        {formatAmount(dayOfMonth > 0 ? monthlyBudget.spent / dayOfMonth : 0, userCurrency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Sparkline — Last 30 days */}
          {dailyTotals.length > 0 && (
            <div className="safi-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-[#94a3b8]">
                  {t.dailySpendingLast30}
                </p>
                {monthlyBudget && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0 border-t-[1.5px] border-dashed border-[#f59e0b]" />
                    <span className="text-[10px] text-[#64748b]">
                      {formatAmount(monthlyBudget.amount / daysInMonth, userCurrency)}/{t.day}
                    </span>
                  </div>
                )}
              </div>
              <Sparkline
                data={dailyTotals}
                budgetLine={monthlyBudget ? monthlyBudget.amount / daysInMonth : null}
              />
            </div>
          )}

          {/* Daily Budget Card */}
          {dailyBudget && (() => {
            const status = getStatus(dailyBudget.spent, dailyBudget.amount)
            const { color } = statusConfig[status]
            const pct = dailyBudget.amount > 0 ? (dailyBudget.spent / dailyBudget.amount) * 100 : 0
            const remaining = Math.max(dailyBudget.amount - dailyBudget.spent, 0)

            return (
              <div className="safi-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[#e2e8f0]">{t.dailyBudget}</p>
                  <span className="text-xs font-bold tabular-nums" style={{ color }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                </div>
                <div className="flex justify-between text-xs text-[#64748b]">
                  <span>{t.spent} {formatAmount(dailyBudget.spent, userCurrency)}</span>
                  <span>{t.remainingBudget} {formatAmount(remaining, userCurrency)}</span>
                </div>
              </div>
            )
          })()}

          {/* Category Budgets */}
          {budgets.filter((b) => b.category).length > 0 && (
            <div className="safi-card p-5">
              <p className="text-sm font-medium text-[#e2e8f0] mb-4">
                {t.categoryBudgets}
              </p>
              <div className="space-y-3">
                {budgets.filter((b) => b.category).map((b) => {
                  const status = getStatus(b.spent, b.amount)
                  const { color } = statusConfig[status]
                  const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#e2e8f0]">{b.category}</span>
                        <span className="text-[#64748b]">{formatAmount(b.spent, userCurrency)} / {formatAmount(b.amount, userCurrency)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <SetBudgetDialog userCurrency={userCurrency} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
