"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { formatAmount } from "@/lib/format"
import { SetBudgetDialog } from "./set-budget-dialog"
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  PiggyBank,
  Minus,
} from "lucide-react"

interface BudgetWithSpend {
  id: string
  period: string
  category: string | null
  budget_type: string
  percentage: number
  limitAmount: number
  spent: number
  currency: string
}

interface CategoryData {
  name: string
  thisMonth: number
  prevMonth: number
  change: number
}

interface Props {
  budgets: BudgetWithSpend[]
  dailyTotals: number[]
  userCurrency: string
  thisMonthTotal: number
  prevMonthTotal: number
  thisMonthIncome: number
  monthlySubs: number
  categories: CategoryData[]
  dayOfMonth: number
  daysInMonth: number
  daysRemaining: number
  avgDailySpend: number
  predictedEndOfMonth: number
  suggestedBudget: number
  fixedExpenses: number
  variableExpenses: number
}

function Sparkline({ data, budgetLine }: { data: number[]; budgetLine: number | null }) {
  if (data.length === 0) return null
  const maxVal = Math.max(...data, budgetLine ?? 0, 1)
  const w = 300, h = 50, p = 2
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

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: typeof Wallet; color: string }) {
  return (
    <div className="safi-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="size-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] text-[#64748b] uppercase">{label}</span>
      </div>
      <p className="text-lg font-bold text-[#e2e8f0] tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-[#475569] mt-0.5">{sub}</p>}
    </div>
  )
}

export function SmartBudgetView({
  budgets, dailyTotals, userCurrency,
  thisMonthTotal, prevMonthTotal, thisMonthIncome, monthlySubs,
  categories, dayOfMonth, daysInMonth, daysRemaining,
  avgDailySpend, predictedEndOfMonth, suggestedBudget,
  fixedExpenses, variableExpenses,
}: Props) {
  const { t, dir, locale } = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [simCut, setSimCut] = useState(20)

  const monthlyBudget = budgets.find((b) => b.period === "monthly" && !b.category)
  const budgetLimit = monthlyBudget?.limitAmount ?? 0
  const budgetPct = budgetLimit > 0 ? (thisMonthTotal / budgetLimit) * 100 : 0
  const isOver = budgetPct > 100
  const isApproaching = budgetPct >= 80
  const statusColor = isOver ? "#ef4444" : isApproaching ? "#f59e0b" : "#10b981"
  const monthChange = prevMonthTotal > 0 ? ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0

  // Simulation: biggest variable category
  const subsKeywords = [t.subscriptions.toLowerCase(), "اشتراكات", "subscriptions"]
  const biggestVariable = categories.find((c) => !subsKeywords.includes(c.name.toLowerCase()))
  const simSaving = biggestVariable ? biggestVariable.thisMonth * (simCut / 100) : 0
  const simMonthly = simSaving
  const simYearly = simSaving * 12

  const fmt = (n: number) => formatAmount(n, userCurrency)

  return (
    <div className="space-y-6 max-w-5xl" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#e2e8f0]">{t.budgets}</h2>
        <button onClick={() => setDialogOpen(true)} className="h-10 rounded-xl px-5 font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all text-sm">
          {t.setBudget}
        </button>
      </div>

      {/* ═══ Feature 1 & 2: Budget Hero + Prediction ═══ */}
      <div className="safi-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -end-20 w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${statusColor}10 0%, transparent 70%)` }} />
        <div className="relative">
          {budgetLimit > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${statusColor}15` }}>
                  {isOver ? <AlertTriangle className="size-5" style={{ color: statusColor }} /> : <CheckCircle2 className="size-5" style={{ color: statusColor }} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">{t.monthlyBudget}</p>
                  <p className="text-xs" style={{ color: statusColor }}>
                    {isOver ? t.overBudget : isApproaching ? t.approachingLimit : t.underBudget}
                  </p>
                </div>
              </div>

              {/* Big progress */}
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-bold text-[#e2e8f0] tabular-nums">{fmt(thisMonthTotal)}</span>
                <span className="text-sm text-[#64748b]">{t.ofBudget} {fmt(budgetLimit)}</span>
              </div>
              <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: statusColor }} />
              </div>
              <div className="flex justify-between text-[10px] text-[#475569] mb-6">
                <span>{Math.round(budgetPct)}%</span>
                <span>{daysRemaining} {t.daysLeftLabel}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4 mb-6">
              <Wallet className="size-10 text-[#3b82f6]/30 mx-auto mb-3" />
              <p className="text-sm text-[#94a3b8] mb-1">{t.noBudgets}</p>
              <p className="text-xs text-[#475569]">
                {t.budgetSuggestionMsg.replace("{amount}", fmt(suggestedBudget))}
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={t.remainingBudget} value={fmt(Math.max(budgetLimit - thisMonthTotal, 0))} icon={Wallet} color={statusColor} />
            <StatCard label={t.dailyAllowance} value={fmt(daysRemaining > 0 ? Math.max(budgetLimit - thisMonthTotal, 0) / daysRemaining : 0)} icon={Zap} color="#3b82f6" />
            <StatCard label={t.avgDaily} value={fmt(avgDailySpend)} icon={TrendingDown} color="#8b5cf6" />
            <StatCard
              label={t.endOfMonthForecast}
              value={fmt(predictedEndOfMonth)}
              sub={budgetLimit > 0 && predictedEndOfMonth > budgetLimit ? `⚠️ ${t.willExceedBudget}` : `✅ ${t.withinBudget}`}
              icon={predictedEndOfMonth > budgetLimit && budgetLimit > 0 ? AlertTriangle : CheckCircle2}
              color={predictedEndOfMonth > budgetLimit && budgetLimit > 0 ? "#ef4444" : "#10b981"}
            />
          </div>
        </div>
      </div>

      {/* ═══ Feature 3: Month over Month ═══ */}
      <div className="safi-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-[#e2e8f0]">{t.vsLastMonth}</p>
          <span className={`text-xs font-bold flex items-center gap-1 ${monthChange > 0 ? "text-[#ef4444]" : "text-[#10b981]"}`}>
            {monthChange > 0 ? <ArrowUpRight className="size-3" /> : monthChange < 0 ? <ArrowDownRight className="size-3" /> : <Minus className="size-3" />}
            {Math.abs(monthChange).toFixed(0)}%
          </span>
        </div>
        <div className="space-y-2.5">
          {categories.slice(0, 5).map((cat) => (
            <div key={cat.name} className="flex items-center justify-between">
              <span className="text-xs text-[#94a3b8] w-24 truncate">{cat.name}</span>
              <div className="flex-1 mx-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-[#3b82f6] transition-all" style={{ width: `${categories[0]?.thisMonth > 0 ? (cat.thisMonth / categories[0].thisMonth) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center gap-2 w-32 justify-end">
                <span className="text-xs text-[#e2e8f0] tabular-nums">{fmt(cat.thisMonth)}</span>
                {cat.change !== 0 && (
                  <span className={`text-[10px] font-medium ${cat.change > 0 ? "text-[#ef4444]" : "text-[#10b981]"}`}>
                    {cat.change > 0 ? "+" : ""}{cat.change.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Two column: Sparkline + Fixed vs Variable ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sparkline */}
        <div className="safi-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#94a3b8]">{t.last30Days}</p>
            {budgetLimit > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0 border-t-[1.5px] border-dashed border-[#f59e0b]" />
                <span className="text-[10px] text-[#64748b]">{fmt(budgetLimit / daysInMonth)}/{t.day}</span>
              </div>
            )}
          </div>
          <Sparkline data={dailyTotals} budgetLine={budgetLimit > 0 ? budgetLimit / daysInMonth : null} />
        </div>

        {/* ═══ Feature 5: Fixed vs Variable ═══ */}
        <div className="safi-card p-5">
          <p className="text-xs font-medium text-[#94a3b8] mb-4">{t.fixedVsVariable}</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#94a3b8] flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#8b5cf6]" />
                  {t.fixedSubscriptions}
                </span>
                <span className="text-[#e2e8f0] tabular-nums">{fmt(fixedExpenses)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-[#8b5cf6] transition-all" style={{ width: `${(fixedExpenses + variableExpenses) > 0 ? (fixedExpenses / (fixedExpenses + variableExpenses)) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#94a3b8] flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#3b82f6]" />
                  {t.variableExpenses}
                </span>
                <span className="text-[#e2e8f0] tabular-nums">{fmt(variableExpenses)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-[#3b82f6] transition-all" style={{ width: `${(fixedExpenses + variableExpenses) > 0 ? (variableExpenses / (fixedExpenses + variableExpenses)) * 100 : 0}%` }} />
              </div>
            </div>
            <p className="text-[10px] text-[#475569] pt-1">
              {t.percentVariableMsg.replace("{pct}", String(Math.round((variableExpenses / Math.max(fixedExpenses + variableExpenses, 1)) * 100)))}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Feature 6: "What If" Simulator ═══ */}
      {biggestVariable && biggestVariable.thisMonth > 0 && (
        <div className="safi-card p-5 border-[#3b82f6]/20">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="size-4 text-[#f59e0b]" />
            <p className="text-sm font-medium text-[#e2e8f0]">{t.whatIfSaved}</p>
          </div>

          <p className="text-xs text-[#94a3b8] mb-3">
            {t.biggestVariableMsg.replace("{name}", biggestVariable.name).replace("{amount}", fmt(biggestVariable.thisMonth))}
          </p>

          {/* Slider */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs text-[#64748b] w-16">{t.cutBy}</span>
            <input
              type="range" min="5" max="50" step="5" value={simCut}
              onChange={(e) => setSimCut(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to ${dir === "rtl" ? "left" : "right"}, #3b82f6 ${simCut * 2}%, rgba(255,255,255,0.06) ${simCut * 2}%)`, accentColor: "#3b82f6" }}
            />
            <span className="text-sm font-bold text-[#3b82f6] tabular-nums w-12 text-end">{simCut}%</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.03] rounded-xl p-3 text-center">
              <PiggyBank className="size-4 text-[#10b981] mx-auto mb-1" />
              <p className="text-lg font-bold text-[#10b981] tabular-nums">{fmt(simMonthly)}</p>
              <p className="text-[10px] text-[#64748b]">/{t.month}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center">
              <TrendingUp className="size-4 text-[#3b82f6] mx-auto mb-1" />
              <p className="text-lg font-bold text-[#3b82f6] tabular-nums">{fmt(simYearly)}</p>
              <p className="text-[10px] text-[#64748b]">/{t.year}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center">
              <Zap className="size-4 text-[#f59e0b] mx-auto mb-1" />
              <p className="text-lg font-bold text-[#f59e0b] tabular-nums">
                {fmt(predictedEndOfMonth - simMonthly)}
              </p>
              <p className="text-[10px] text-[#64748b]">{t.newForecast}</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Feature 4: Smart Suggestion (if no budget set) ═══ */}
      {budgets.length === 0 && suggestedBudget > 0 && (
        <div className="safi-card p-5 border-[#10b981]/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="size-4 text-[#10b981]" />
            <p className="text-sm font-medium text-[#e2e8f0]">{t.smartSuggestion}</p>
          </div>
          <p className="text-xs text-[#94a3b8] mb-4">
            {t.smartSuggestionMsg.replace("{amount}", fmt(prevMonthTotal))}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-[#10b981] tabular-nums">{fmt(suggestedBudget)}</span>
            <span className="text-xs text-[#64748b]">/{t.month}</span>
            <button
              onClick={() => setDialogOpen(true)}
              className="ms-auto text-xs text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors"
            >
              {t.applyBudget}
            </button>
          </div>
        </div>
      )}

      <SetBudgetDialog userCurrency={userCurrency} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
