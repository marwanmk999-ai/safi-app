"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const CURRENCIES = ["USD", "EUR", "SAR", "AED", "JOD", "EGP", "QAR", "KWD"]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddGoalDialog({ open, onOpenChange }: Props) {
  const { t, dir } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [targetDate, setTargetDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const reset = () => {
    setTitle("")
    setTargetAmount("")
    setCurrency("USD")
    setTargetDate("")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Auth error"); setLoading(false); return }

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title,
      target_amount: parseFloat(targetAmount),
      currency,
      target_date: targetDate || null,
    })

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
          <DialogTitle className="text-[#e2e8f0]">{t.addGoal}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <input
            type="text"
            placeholder={t.goalTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />

          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={t.targetAmount}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              className={inputClass + " flex-1"}
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass + " w-28 appearance-none"}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#64748b] mb-1.5 block">
              {t.targetDate}
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all disabled:opacity-60"
            >
              {loading ? "..." : t.save}
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
      </DialogContent>
    </Dialog>
  )
}
