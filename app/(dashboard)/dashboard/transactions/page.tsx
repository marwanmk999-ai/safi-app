import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import type { Transaction } from "@/lib/types/database"
import { TransactionsList } from "./transactions-list"
import { formatAmount, convertCurrency } from "@/lib/format"
import { getServerTranslations } from "@/lib/i18n/server"

export default async function TransactionsPage() {
  const { t, locale, dir } = await getServerTranslations()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect("/login") }
  const userId = user.id

  const { data: profile, error: profileError } = await supabase.from("profiles").select("currency").eq("id", userId).single();
  if (profileError) console.error("[transactions] profile query error:", profileError.message);
  const userCurrency = profile?.currency ?? "USD";

  const [incomeResult, expenseResult] = await Promise.all([
    supabase
      .from("income_decrypted")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase
      .from("expenses_decrypted")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
  ])

  if (incomeResult.error) console.error("[transactions] income query error:", incomeResult.error.message);
  if (expenseResult.error) console.error("[transactions] expenses query error:", expenseResult.error.message);

  const incomeData = incomeResult.data;
  const expenseData = expenseResult.data;

  const income = (incomeData ?? []).map((i) => ({ ...i, type: "income" as const }))
  const expenses = (expenseData ?? []).map((e) => ({ ...e, type: "expense" as const }))

  const transactions: Transaction[] = [...income, ...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const totalIncome = income.reduce((sum, t) => sum + convertCurrency(Number(t.amount), t.currency ?? "USD", userCurrency), 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + convertCurrency(Number(t.amount), t.currency ?? "USD", userCurrency), 0)
  const net = totalIncome - totalExpenses

  const summaryCards = [
    {
      label: t.totalRevenue,
      value: formatAmount(totalIncome, userCurrency),
      icon: TrendingUp,
      color: "text-[#10b981]",
      bgColor: "bg-[#10b981]/10",
    },
    {
      label: t.totalExpensesLabel,
      value: formatAmount(totalExpenses, userCurrency),
      icon: TrendingDown,
      color: "text-[#ef4444]",
      bgColor: "bg-[#ef4444]/10",
    },
    {
      label: t.netProfitLabel,
      value: formatAmount(net, userCurrency),
      icon: DollarSign,
      color: "text-[#3b82f6]",
      bgColor: "bg-[#3b82f6]/10",
    },
  ]

  return (
    <div className="space-y-6" dir={dir}>
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#e2e8f0]">{t.transactions}</h2>
        <p className="text-[#94a3b8] mt-1 text-sm">
          {t.manageTransactions}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#94a3b8] text-sm">{card.label}</span>
                <div
                  className={`size-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}
                >
                  <Icon className="size-5" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Transactions List (Client Component) */}
      <TransactionsList transactions={transactions} userCurrency={userCurrency} locale={locale} />
    </div>
  )
}
