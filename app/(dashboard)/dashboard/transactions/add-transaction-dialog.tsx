"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
import { Plus, Target, Check } from "lucide-react"
import { allocateIncomeToGoals } from "@/lib/goals/allocate"
import { useI18n } from "@/lib/i18n/context"

interface AllocationResult {
  goalTitle: string
  amount: number
  method: string
  note: string
}

export function AddTransactionDialog() {
  const router = useRouter()
  const { t, dir, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"income" | "expense">("income")
  const [loading, setLoading] = useState(false)
  const [allocations, setAllocations] = useState<AllocationResult[]>([])
  const [showAllocations, setShowAllocations] = useState(false)

  // Form fields
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  // Income-specific
  const [clientName, setClientName] = useState("")
  const [projectName, setProjectName] = useState("")
  // Expense-specific
  const [category, setCategory] = useState("other")
  const [merchant, setMerchant] = useState("")

  function resetForm() {
    setAmount("")
    setCurrency("USD")
    setDescription("")
    setDate(new Date().toISOString().split("T")[0])
    setClientName("")
    setProjectName("")
    setCategory("other")
    setMerchant("")
    setType("income")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return

    setLoading(true)
    setError(null)
    setAllocations([])
    setShowAllocations(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    try {
      if (type === "income") {
        // Insert income
        const { data: incomeData, error } = await supabase.from("income").insert({
          user_id: user.id,
          amount: Number(amount),
          currency,
          description: description || null,
          client_name: clientName || null,
          project_name: projectName || null,
          date,
        }).select("id, user_id").single()
        if (error) throw error

        // Auto-allocate to goals
        if (incomeData) {
          const results = await allocateIncomeToGoals(
            supabase,
            incomeData.user_id,
            incomeData.id,
            Number(amount),
            currency,
            description || clientName || t.newIncomeFallback,
            locale,
          )
          if (results.length > 0) {
            setAllocations(results)
            setShowAllocations(true)
            setLoading(false)
            router.refresh()
            return // Don't close — show allocations first
          }
        }
      } else {
        const { error } = await supabase.from("expenses").insert({
          user_id: user.id,
          amount: Number(amount),
          currency,
          description: description || null,
          category,
          merchant: merchant || null,
          date,
        })
        if (error) throw error
      }

      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.transactionSaveError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v)
      if (!v) { resetForm(); setAllocations([]); setShowAllocations(false) }
    }}>
      <DialogTrigger asChild>
        <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white rounded-xl h-10 px-5 gap-2">
          <Plus className="size-4" />
          {t.addTransactionBtn}
        </Button>
      </DialogTrigger>
      <DialogContent
        dir={dir}
        className="bg-[#0f1729] border border-white/[0.08] sm:max-w-md rounded-[20px] p-0 overflow-hidden"
      >
        {/* Allocation results overlay */}
        {showAllocations && allocations.length > 0 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center">
                <Check className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#e2e8f0]">{t.incomeAdded}</h3>
                <p className="text-xs text-[#64748b]">{t.goalsUpdated}</p>
              </div>
            </div>
            <div className="space-y-2">
              {allocations.map((a, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="size-3.5 text-[#3b82f6]" />
                    <span className="text-sm font-medium text-[#e2e8f0]">{a.goalTitle}</span>
                    <span className="text-xs text-[#10b981] font-bold ms-auto tabular-nums">
                      +{a.amount.toFixed(2)} {currency}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748b] leading-relaxed">{a.note}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setOpen(false); resetForm(); setAllocations([]); setShowAllocations(false) }}
              className="safi-btn-primary w-full"
            >
              {t.done}
            </button>
          </div>
        )}

        {!showAllocations && (
        <>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-[#e2e8f0] text-lg">
            {t.addNewTransaction}
          </DialogTitle>
        </DialogHeader>

        {/* Type Toggle */}
        <div className="px-6">
          <div className="flex gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                type === "income"
                  ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {t.incomeType}
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                type === "expense"
                  ? "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {t.expenseType}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Amount + Currency */}
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div className="space-y-2">
              <Label className="text-[#94a3b8] text-xs">{t.amount}</Label>
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
            <div className="space-y-2">
              <Label className="text-[#94a3b8] text-xs">{t.currency}</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 text-white px-3 text-sm outline-none focus:border-[#3b82f6]"
              >
                <option value="USD">USD</option>
                <option value="EGP">EGP</option>
                <option value="EUR">EUR</option>
                <option value="SAR">SAR</option>
                <option value="AED">AED</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[#94a3b8] text-xs">{t.description}</Label>
            <Input
              placeholder={t.transactionDesc}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-[#64748b]"
            />
          </div>

          {/* Conditional fields */}
          {type === "income" ? (
            <>
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-xs">{t.clientName}</Label>
                <Input
                  placeholder={t.clientNamePlaceholder}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-[#64748b]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-xs">{t.projectName}</Label>
                <Input
                  placeholder={t.projectNamePlaceholder}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-[#64748b]"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-xs">{t.category}</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 text-white px-3 text-sm outline-none focus:border-[#3b82f6]"
                >
                  {([
                    { key: "food", label: t.food },
                    { key: "transport", label: t.transport },
                    { key: "workTools", label: t.workTools },
                    { key: "entertainment", label: t.entertainment },
                    { key: "subscriptions", label: t.subscriptions },
                    { key: "other", label: t.other },
                  ]).map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-xs">{t.merchantLabel}</Label>
                <Input
                  placeholder={t.merchantPlaceholder}
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-[#64748b]"
                />
              </div>
            </>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-[#94a3b8] text-xs">{t.date}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
            />
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
            {loading ? t.saving : t.saveTransaction}
          </Button>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  )
}
