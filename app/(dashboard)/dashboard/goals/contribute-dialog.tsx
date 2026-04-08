"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import { formatAmount } from "@/lib/format"
import type { Goal } from "@/lib/types/database"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContributeDialog({ goal, open, onOpenChange }: Props) {
  const { t, dir } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const reset = () => {
    setAmount("")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal) return
    setLoading(true)
    setError("")

    const contributed = parseFloat(amount)
    const newTotal = goal.current_amount + contributed
    const isCompleted = newTotal >= goal.target_amount

    const { error } = await supabase
      .from("goals")
      .update({
        current_amount: newTotal,
        ...(isCompleted ? { status: "completed" } : {}),
      })
      .eq("id", goal.id)

    if (error) {
      setError(t.genericError + ": " + error.message)
      setLoading(false)
      return
    }

    reset()
    setLoading(false)
    onOpenChange(false)
    router.refresh()
  }

  if (!goal) return null

  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0

  const inputClass =
    "w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent
        className="bg-[#0a0f1a] border-white/[0.08] rounded-[20px] max-w-md"
        dir={dir}
      >
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0]">{t.contribute}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Goal info */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <h4 className="text-[#e2e8f0] font-medium mb-2">{goal.title}</h4>
            <div className="flex items-center justify-between text-sm text-[#94a3b8] mb-2">
              <span>{t.progress} {Math.round(progress)}%</span>
              <span>
                {formatAmount(goal.current_amount, goal.currency)} / {formatAmount(goal.target_amount, goal.currency)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress > 80 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder={t.contributeAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className={inputClass}
            />

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 rounded-xl font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all disabled:opacity-60"
              >
                {loading ? "..." : t.contribute}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 rounded-xl border border-white/10 text-[#94a3b8] hover:bg-white/[0.04] transition-all"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
