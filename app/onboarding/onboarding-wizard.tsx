"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n/context"
import {
  User,
  Wallet,
  Home,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  Sparkles,
} from "lucide-react"

interface Props {
  userId: string
  userEmail: string
}

interface ExpenseItem {
  name: string
  amount: string
  category: string
}

interface SubItem {
  name: string
  amount: string
  cycle: string
}

const CURRENCIES = ["USD", "EUR", "SAR", "AED", "JOD", "EGP", "QAR", "KWD"]
const inputClass =
  "w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white text-sm placeholder:text-[#475569] outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"

export function OnboardingWizard({ userId, userEmail }: Props) {
  const { t, dir, locale, setLocale } = useI18n()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Step 1: Personal info
  const [fullName, setFullName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [currency, setCurrency] = useState("USD")

  // Step 2: Income — can have salary AND freelance
  const [incomeType, setIncomeType] = useState<"salary" | "freelance" | "both" | null>(null)
  const [salary, setSalary] = useState("")

  // Step 3: Main expenses
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { name: "", amount: "", category: "other" },
  ])

  // Step 4: Subscriptions
  const [subs, setSubs] = useState<SubItem[]>([
    { name: "", amount: "", cycle: "monthly" },
  ])

  const steps = [
    {
      icon: User,
      title: t.tellUsAboutYourself,
      subtitle: t.yourBasicInfo,
    },
    {
      icon: Wallet,
      title: t.yourIncome,
      subtitle: t.doYouHaveSalary,
    },
    {
      icon: Home,
      title: t.yourMainExpenses,
      subtitle: t.rentBillsEtc,
    },
    {
      icon: CreditCard,
      title: t.yourSubscriptions,
      subtitle: t.adobeNetflixEtc,
    },
  ]

  const canNext =
    step === 0
      ? fullName.trim().length > 0
      : step === 1
        ? incomeType !== null
        : true

  async function handleFinish() {
    setSaving(true)
    setSaveError(null)

    try {
      // Save profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        email: userEmail,
        full_name: fullName,
        specialty: specialty || null,
        currency,
        monthly_salary: (incomeType === "salary" || incomeType === "both") && salary ? Number(salary) : null,
        salary_currency: currency,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      if (profileError) throw profileError

      // Save expenses as expense entries
      const validExpenses = expenses.filter((e) => e.name && e.amount)
      if (validExpenses.length > 0) {
        const { error: expensesError } = await supabase.from("expenses").insert(
          validExpenses.map((e) => ({
            user_id: userId,
            amount: Number(e.amount),
            currency,
            description: e.name,
            category: e.category,
            merchant: e.name,
            source: "onboarding",
            date: new Date().toISOString().split("T")[0],
          }))
        )
        if (expensesError) throw expensesError
      }

      // Save subscriptions
      const validSubs = subs.filter((s) => s.name && s.amount)
      if (validSubs.length > 0) {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)

        const { error: subsError } = await supabase.from("subscriptions").insert(
          validSubs.map((s) => ({
            user_id: userId,
            name: s.name,
            amount: Number(s.amount),
            currency,
            billing_cycle: s.cycle,
            next_renewal_date: nextMonth.toISOString().split("T")[0],
            is_active: true,
          }))
        )
        if (subsError) throw subsError
      }

      // Save salary as recurring income
      if ((incomeType === "salary" || incomeType === "both") && salary) {
        const { error: incomeError } = await supabase.from("income").insert({
          user_id: userId,
          amount: Number(salary),
          currency,
          description: t.monthlySalaryIncome,
          client_name: t.salaryLabel,
          date: new Date().toISOString().split("T")[0],
        })
        if (incomeError) throw incomeError
      }

      window.location.href = "/dashboard"
    } catch (err) {
      const message = err instanceof Error ? err.message : (typeof err === "object" && err !== null && "message" in err ? String((err as { message: string }).message) : "Unknown error")
      setSaveError(t.savingError.replace("{error}", message))
      setSaving(false)
    }
  }

  const NextArrow = dir === "rtl" ? ArrowLeft : ArrowRight
  const PrevArrow = dir === "rtl" ? ArrowRight : ArrowLeft

  return (
    <div
      className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden"
      dir={dir}
    >
      {/* Background */}
      <div className="absolute inset-0 safi-pattern" />
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <div className="relative z-10 w-full max-w-lg safi-page-enter">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="rounded-full px-3 py-1 border border-white/10 text-xs text-[#64748b] hover:text-[#94a3b8] bg-white/[0.03] transition-all"
          >
            {t.toggleLang}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                backgroundColor:
                  i <= step ? "#3b82f6" : "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>

        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center">
            {(() => {
              const Icon = steps[step].icon
              return <Icon className="size-5" />
            })()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#e2e8f0]">
              {steps[step].title}
            </h2>
            <p className="text-sm text-[#64748b]">{steps[step].subtitle}</p>
          </div>
        </div>

        {/* Step content */}
        <div className="safi-card p-8 mb-6">
          {step === 0 && (
            <div className="space-y-4 safi-stagger">
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  {t.fullName} *
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={dir === "rtl" ? "مثال: مروان خلوف" : "e.g. Marwan Khallouf"}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  {t.specialty}
                </label>
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder={dir === "rtl" ? "مطور، مصمم، مونتير، مسوّق..." : "Developer, Designer, Editor..."}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  {t.defaultCurrency}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputClass}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0a0f1a]">{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 safi-stagger">
              <p className="text-sm text-[#94a3b8]">
                {t.howDescribeIncome}
              </p>
              <div className="space-y-2">
                {([
                  { value: "salary" as const, label: t.salaryOnly, desc: t.salaryOnlyDesc },
                  { value: "freelance" as const, label: t.freelanceIncome, desc: t.freelanceIncomeDesc },
                  { value: "both" as const, label: t.salaryPlusSide, desc: t.salaryPlusSideDesc },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIncomeType(opt.value)}
                    className={`w-full text-start p-4 rounded-xl border transition-all ${
                      incomeType === opt.value
                        ? "border-[#3b82f6] bg-[#3b82f6]/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className={`text-sm font-medium ${incomeType === opt.value ? "text-[#3b82f6]" : "text-[#e2e8f0]"}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
              {(incomeType === "salary" || incomeType === "both") && (
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                    {t.monthlySalary}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="0.00"
                      className={inputClass + " pe-16"}
                      autoFocus
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 end-4 text-xs text-[#64748b]">
                      {currency}
                    </span>
                  </div>
                </div>
              )}
              {(incomeType === "freelance" || incomeType === "both") && (
                <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/10 rounded-xl p-3">
                  <p className="text-xs text-[#3b82f6]">
                    {"💡 " + t.freelanceTip}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 safi-stagger">
              <p className="text-sm text-[#94a3b8] mb-1">
                {t.addFixedExpenses}
              </p>

              {/* Quick-add suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { name: t.rent, amount: "" },
                  { name: t.electricity, amount: "" },
                  { name: t.water, amount: "" },
                  { name: t.internet, amount: "" },
                  { name: t.phoneBill, amount: "" },
                  { name: t.gasTransport, amount: "" },
                  { name: t.healthInsurance, amount: "" },
                  { name: t.carPayment, amount: "" },
                  { name: t.groceries, amount: "" },
                ].filter((s) => !expenses.some((existing) => existing.name === s.name))
                .map((suggestion) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    onClick={() =>
                      setExpenses([...expenses.filter((e) => e.name || e.amount), { name: suggestion.name, amount: "", category: "other" }])
                    }
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#3b82f6]/30 hover:bg-[#3b82f6]/5 transition-all"
                  >
                    + {suggestion.name}
                  </button>
                ))}
              </div>

              {/* Expense rows */}
              {expenses.map((exp, i) => (
                <div key={i} className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-[#64748b] uppercase">
                      {t.expenseName}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (expenses.length <= 1) {
                          setExpenses([{ name: "", amount: "", category: "other" }])
                        } else {
                          setExpenses(expenses.filter((_, j) => j !== i))
                        }
                      }}
                      className="size-6 rounded text-[#475569] hover:text-[#ef4444] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <input
                    placeholder={t.expenseNamePlaceholder}
                    value={exp.name}
                    onChange={(e) => {
                      const arr = [...expenses]
                      arr[i].name = e.target.value
                      setExpenses(arr)
                    }}
                    className={inputClass}
                  />
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={t.monthlyAmount}
                      value={exp.amount}
                      onChange={(e) => {
                        const arr = [...expenses]
                        arr[i].amount = e.target.value
                        setExpenses(arr)
                      }}
                      className={inputClass + " pe-16"}
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 end-4 text-xs text-[#475569]">
                      {currency}
                    </span>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExpenses([...expenses, { name: "", amount: "", category: "other" }])}
                className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors"
              >
                <Plus className="size-3.5" />
                {t.addAnotherExpense}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 safi-stagger">
              <p className="text-sm text-[#94a3b8] mb-1">
                {t.addMonthlySubscriptions}
              </p>

              {/* Quick-add suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { name: "Netflix", amount: "16" },
                  { name: "Spotify", amount: "10" },
                  { name: "YouTube Premium", amount: "12" },
                  { name: "Adobe CC", amount: "55" },
                  { name: "Figma", amount: "15" },
                  { name: "ChatGPT Plus", amount: "20" },
                  { name: "Canva Pro", amount: "13" },
                  { name: "iCloud+", amount: "3" },
                  { name: "GitHub Pro", amount: "4" },
                  { name: "Notion", amount: "10" },
                  { name: "Blender Market", amount: "10" },
                  { name: "Midjourney", amount: "10" },
                ].filter((s) => !subs.some((existing) => existing.name === s.name))
                .map((suggestion) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    onClick={() =>
                      setSubs([...subs.filter((s) => s.name || s.amount), { name: suggestion.name, amount: suggestion.amount, cycle: "monthly" }])
                    }
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#3b82f6]/30 hover:bg-[#3b82f6]/5 transition-all"
                  >
                    + {suggestion.name}
                  </button>
                ))}
              </div>

              {/* Added subscriptions */}
              {subs.map((sub, i) => (
                <div key={i} className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-[#64748b] uppercase">
                      {t.subscriptionNameLabel}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (subs.length <= 1) {
                          setSubs([{ name: "", amount: "", cycle: "monthly" }])
                        } else {
                          setSubs(subs.filter((_, j) => j !== i))
                        }
                      }}
                      className="size-6 rounded text-[#475569] hover:text-[#ef4444] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <input
                    placeholder={t.subscriptionPlaceholder}
                    value={sub.name}
                    onChange={(e) => {
                      const arr = [...subs]
                      arr[i].name = e.target.value
                      setSubs(arr)
                    }}
                    className={inputClass}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder={t.amount}
                        value={sub.amount}
                        onChange={(e) => {
                          const arr = [...subs]
                          arr[i].amount = e.target.value
                          setSubs(arr)
                        }}
                        className={inputClass + " pe-16"}
                      />
                      <span className="absolute top-1/2 -translate-y-1/2 end-4 text-xs text-[#475569]">
                        {currency}
                      </span>
                    </div>
                    <select
                      value={sub.cycle}
                      onChange={(e) => {
                        const arr = [...subs]
                        arr[i].cycle = e.target.value
                        setSubs(arr)
                      }}
                      className={inputClass}
                    >
                      <option value="monthly" className="bg-[#0a0f1a]">{t.monthly}</option>
                      <option value="yearly" className="bg-[#0a0f1a]">{t.yearly}</option>
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSubs([...subs, { name: "", amount: "", cycle: "monthly" }])}
                className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors"
              >
                <Plus className="size-3.5" />
                {t.addAnotherSubscription}
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {saveError && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-3 mb-4">
            <p className="text-sm text-[#ef4444] text-center">{saveError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
            >
              <PrevArrow className="size-4" />
              {t.previous}
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="safi-btn-primary px-8 flex items-center gap-2 disabled:opacity-40"
            >
              {t.next}
              <NextArrow className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="safi-btn-primary px-8 flex items-center gap-2"
            >
              {saving ? "..." : (
                <>
                  <Sparkles className="size-4" />
                  {t.startWithSafi}
                </>
              )}
            </button>
          )}
        </div>

        {/* Skip */}
        {step >= 2 && (
          <div className="text-center mt-4">
            <button
              onClick={() => step < 3 ? setStep(step + 1) : handleFinish()}
              className="text-xs text-[#475569] hover:text-[#64748b] transition-colors"
            >
              {t.skipStep}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
