"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n/context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

const expenseCategories = [
  "",
  "food",
  "transport",
  "workTools",
  "entertainment",
  "subscriptions",
  "other",
] as const

export function SetBudgetDialog({ userCurrency, open: controlledOpen, onOpenChange }: { userCurrency: string; open?: boolean; onOpenChange?: (v: boolean) => void }) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [period, setPeriod] = useState<"daily" | "monthly">("monthly")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")

  function resetForm() {
    setPeriod("monthly")
    setAmount("")
    setCategory("")
    setError(null)
  }

  // Category display labels from translation keys
  const categoryLabels: Record<string, string> = {
    "": locale === "ar" ? "الكل" : "All",
    food: t.food,
    transport: t.transport,
    workTools: t.workTools,
    entertainment: t.entertainment,
    subscriptions: t.subscriptions,
    other: t.other,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return

    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // Upsert based on UNIQUE(user_id, period, category) constraint
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { error } = await supabase.from("budget_limits").upsert(
        {
          user_id: userData.user.id,
          period,
          amount: Number(amount),
          currency: userCurrency,
          category: category || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,period,category" }
      )
      if (error) throw error

      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "ar" ? "حدث خطأ أثناء حفظ الميزانية" : "Error saving budget"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white rounded-xl h-10 px-5 gap-2">
          <Plus className="size-4" />
          {t.setBudget}
        </Button>
      </DialogTrigger>
      <DialogContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="bg-[#0f1729] border border-white/[0.08] sm:max-w-md rounded-[20px] p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-[#e2e8f0] text-lg">
            {t.setBudget}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Period Toggle */}
          <div className="space-y-2">
            <Label className="text-[#94a3b8] text-xs">{t.period}</Label>
            <div className="flex gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                  period === "monthly"
                    ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
                    : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {t.monthly}
              </button>
              <button
                type="button"
                onClick={() => setPeriod("daily")}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                  period === "daily"
                    ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
                    : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {t.daily}
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-[#94a3b8] text-xs">{t.limit}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-[#64748b] text-lg font-semibold"
            />
          </div>

          {/* Category (optional) */}
          <div className="space-y-2">
            <Label className="text-[#94a3b8] text-xs">{t.category}</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 text-white px-3 text-sm outline-none focus:border-[#3b82f6]"
            >
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || !amount}
            className="w-full h-12 rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium text-sm mt-2"
          >
            {loading
              ? (locale === "ar" ? "جاري الحفظ..." : "Saving...")
              : t.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
