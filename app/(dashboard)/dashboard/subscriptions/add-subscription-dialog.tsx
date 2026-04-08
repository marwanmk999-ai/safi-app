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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const currencies = ["USD", "EUR", "SAR", "AED", "JOD", "EGP", "QAR", "KWD"]

export function AddSubscriptionDialog({ open, onOpenChange }: Props) {
  const { t, dir } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [billingCycle, setBillingCycle] = useState<"weekly" | "monthly" | "yearly">("monthly")
  const [nextRenewal, setNextRenewal] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const reset = () => {
    setName("")
    setAmount("")
    setCurrency("USD")
    setBillingCycle("monthly")
    setNextRenewal("")
    setCategory("")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Auth error"); setLoading(false); return }

    const { error: insertError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      name,
      amount: parseFloat(amount),
      currency,
      billing_cycle: billingCycle,
      next_renewal_date: nextRenewal,
      category: category || null,
    })

    if (insertError) {
      setError(t.genericError + ": " + insertError.message)
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
  const selectClass =
    "w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm appearance-none"

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="bg-[#0a0f1a] border-white/[0.08] rounded-[20px] max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0]">{t.addSubscription}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <input
            type="text"
            placeholder={t.subscriptionName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />

          {/* Amount + Currency */}
          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={t.amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className={inputClass + " flex-1"}
              dir="ltr"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={selectClass + " w-28"}
            >
              {currencies.map((c) => (
                <option key={c} value={c} className="bg-[#0a0f1a]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="text-xs text-[#64748b] mb-1.5 block">{t.billingCycle}</label>
            <div className="flex gap-2">
              {(["weekly", "monthly", "yearly"] as const).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
                    billingCycle === cycle
                      ? "bg-[#3b82f6] text-white"
                      : "border border-white/10 text-[#94a3b8] hover:bg-white/[0.04]"
                  }`}
                >
                  {cycle === "weekly" ? t.weekly : cycle === "yearly" ? t.yearly : t.monthly}
                </button>
              ))}
            </div>
          </div>

          {/* Next Renewal Date */}
          <div>
            <label className="text-xs text-[#64748b] mb-1.5 block">{t.nextRenewal}</label>
            <input
              type="date"
              value={nextRenewal}
              onChange={(e) => setNextRenewal(e.target.value)}
              required
              className={inputClass}
              dir="ltr"
            />
          </div>

          {/* Category (optional) */}
          <input
            type="text"
            placeholder={t.category}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

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
