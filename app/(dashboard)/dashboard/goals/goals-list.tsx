"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import { Target, TrendingUp, History } from "lucide-react"
import type { GoalAllocation } from "@/lib/types/database"
import { formatAmount } from "@/lib/format"
import type { Goal } from "@/lib/types/database"
import { AddGoalDialog } from "./add-goal-dialog"
import { ContributeDialog } from "./contribute-dialog"

interface Props {
  goals: Goal[]
  userCurrency: string
  monthlyIncome: number
  recentAllocations: GoalAllocation[]
}

export function GoalsList({ goals, userCurrency, monthlyIncome, recentAllocations }: Props) {
  const { t, dir } = useI18n()
  const router = useRouter()
  const supabase = createClient()
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [addOpen, setAddOpen] = useState(false)
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null)

  const filtered = goals.filter((g) => {
    if (filter === "active") return g.status === "active"
    if (filter === "completed") return g.status === "completed"
    return true
  })

  const totalAllocated = goals
    .filter((g) => g.status === "active")
    .reduce((sum, g) => sum + (g.monthly_percentage ?? 0), 0)

  const tabs = [
    { key: "all" as const, label: t.all },
    { key: "active" as const, label: t.active },
    { key: "completed" as const, label: t.completed },
  ]

  // Local slider state for instant feedback
  const [localPcts, setLocalPcts] = useState<Record<string, number>>({})

  function handleSliderChange(goalId: string, pct: number) {
    setLocalPcts((prev) => ({ ...prev, [goalId]: pct }))
  }

  async function handleSliderCommit(goalId: string, pct: number) {
    await supabase.from("goals").update({ monthly_percentage: pct }).eq("id", goalId)
    router.refresh()
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* Income allocation summary */}
      {monthlyIncome > 0 && goals.some((g) => g.status === "active") && (
        <div className="safi-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e2e8f0]">
                {t.monthlyIncomeAllocation}
              </p>
              <p className="text-xs text-[#64748b]">
                {t.monthlyIncome}: {formatAmount(monthlyIncome, userCurrency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(totalAllocated, 100)}%`,
                  backgroundColor: totalAllocated > 80 ? "#f59e0b" : totalAllocated > 95 ? "#ef4444" : "#3b82f6",
                }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${totalAllocated > 95 ? "text-[#ef4444]" : "text-[#3b82f6]"}`}>
              {totalAllocated}%
            </span>
          </div>
          <p className="text-[10px] text-[#475569] mt-2">
            {t.allocatedForGoals
              .replace("{allocated}", formatAmount(monthlyIncome * totalAllocated / 100, userCurrency))
              .replace("{remaining}", formatAmount(monthlyIncome * (100 - totalAllocated) / 100, userCurrency))}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-white/[0.08] text-[#e2e8f0]"
                  : "text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="h-12 rounded-xl px-6 font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] text-sm"
        >
          {t.addGoal}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="safi-card p-12 text-center">
          <Target className="size-12 text-[#3b82f6] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">{t.noGoals}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((goal) => {
            const progress = goal.target_amount > 0
              ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
              : 0
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0)
            const currentPct = localPcts[goal.id] ?? (goal.monthly_percentage ?? 0)
            const monthlyAmount = monthlyIncome * currentPct / 100
            const monthsToGoal = monthlyAmount > 0 ? Math.ceil(remaining / monthlyAmount) : null

            let daysLeft: number | null = null
            if (goal.target_date) {
              const diff = new Date(goal.target_date).getTime() - Date.now()
              daysLeft = Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0)
            }

            const barColor =
              progress > 80 ? "#10b981" : progress >= 50 ? "#f59e0b" : "#3b82f6"
            const isCompleted = goal.status === "completed"

            return (
              <div key={goal.id} className="safi-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center">
                      <Target className="size-5" />
                    </div>
                    <h3 className="font-semibold text-[#e2e8f0]">{goal.title}</h3>
                  </div>
                  <span className={`text-xs border rounded-full px-2.5 py-1 ${
                    isCompleted
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20"
                  }`}>
                    {isCompleted ? t.completed : t.active}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-1.5">
                    <span>{Math.round(progress)}%</span>
                    {daysLeft !== null && !isCompleted && (
                      <span>{daysLeft} {t.daysLeft}</span>
                    )}
                  </div>
                  <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-[#e2e8f0] font-medium">{formatAmount(goal.current_amount, goal.currency)}</span>
                  <span className="text-[#64748b]">{formatAmount(goal.target_amount, goal.currency)}</span>
                </div>

                {/* Percentage slider — only for active goals */}
                {!isCompleted && monthlyIncome > 0 && (
                  <div className="bg-white/[0.03] rounded-xl p-4 mb-4 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#94a3b8]">
                        {t.fromMonthlyIncome}
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
                        {currentPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={currentPct}
                      onChange={(e) => handleSliderChange(goal.id, Number(e.target.value))}
                      onMouseUp={(e) => handleSliderCommit(goal.id, Number((e.target as HTMLInputElement).value))}
                      onTouchEnd={(e) => handleSliderCommit(goal.id, Number((e.target as HTMLInputElement).value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to ${dir === "rtl" ? "left" : "right"}, ${barColor} ${currentPct * 2}%, rgba(255,255,255,0.06) ${currentPct * 2}%)`,
                        accentColor: barColor,
                      }}
                    />
                    <div className="flex items-center justify-between mt-2 text-[10px] text-[#475569]">
                      <span>= {formatAmount(monthlyAmount, userCurrency)} / {t.month}</span>
                      {monthsToGoal !== null && monthsToGoal > 0 && (
                        <span>
                          {t.monthsToGoal.replace("{months}", String(monthsToGoal))}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {isCompleted ? (
                  <div className="text-center text-emerald-400 text-sm font-medium py-2">
                    {t.goalCompleted}
                  </div>
                ) : (
                  <button
                    onClick={() => setContributeGoal(goal)}
                    className="w-full h-10 rounded-xl text-sm font-medium border border-white/10 text-[#94a3b8] hover:bg-white/[0.04] transition-all"
                  >
                    {t.contribute}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Allocation History */}
      {recentAllocations.length > 0 && (
        <div className="safi-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-9 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center">
              <History className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#e2e8f0]">
                {t.allocationHistory}
              </h3>
              <p className="text-[10px] text-[#64748b]">
                {t.allocationHistoryDesc}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {recentAllocations.map((a) => {
              const goalTitle = goals.find((g) => g.id === a.goal_id)?.title ?? "—"
              return (
                <div key={a.id} className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Target className="size-3.5 text-[#3b82f6] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#e2e8f0] font-medium truncate">{goalTitle}</p>
                      <p className="text-[10px] text-[#475569] truncate">{a.note}</p>
                    </div>
                  </div>
                  <div className="text-end shrink-0 ms-3">
                    <p className="text-xs font-bold text-[#10b981] tabular-nums">+{formatAmount(Number(a.amount), a.currency)}</p>
                    <p className="text-[10px] text-[#475569]">
                      {new Date(a.created_at).toLocaleDateString(dir === "rtl" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AddGoalDialog open={addOpen} onOpenChange={setAddOpen} />
      <ContributeDialog
        goal={contributeGoal}
        open={!!contributeGoal}
        onOpenChange={(open) => { if (!open) setContributeGoal(null) }}
      />
    </div>
  )
}
