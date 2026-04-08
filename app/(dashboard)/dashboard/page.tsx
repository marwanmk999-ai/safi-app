import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  CreditCard,
} from "lucide-react";
import { formatAmount, convertCurrency, convertAndFormat } from "@/lib/format";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const { t, locale, dir } = await getServerTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name?.split(" ")[0] ?? t.there;
  const userId = user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", userId)
    .single();
  if (profileError) console.error("[dashboard] profile query error:", profileError.message);
  const userCurrency = profile?.currency ?? "USD";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t.goodMorning : t.goodEvening;

  const [
    incomeResult,
    expensesResult,
    pendingInvoicesResult,
    recentIncomeResult,
    recentExpensesResult,
    goalsResult,
    subscriptionsResult,
  ] = await Promise.all([
    supabase.from("income_decrypted").select("amount, currency").eq("user_id", userId),
    supabase.from("expenses_decrypted").select("amount, currency").eq("user_id", userId),
    supabase
      .from("invoices_decrypted")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending"),
    supabase
      .from("income_decrypted")
      .select("amount, currency, date, description, client_name")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("expenses_decrypted")
      .select("amount, currency, date, description, merchant, category")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("goals_decrypted")
      .select("title, target_amount, current_amount, currency")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(3),
    supabase
      .from("subscriptions_decrypted")
      .select("amount, currency, billing_cycle")
      .eq("user_id", userId)
      .eq("is_active", true),
  ]);

  if (incomeResult.error) console.error("[dashboard] income query error:", incomeResult.error.message);
  if (expensesResult.error) console.error("[dashboard] expenses query error:", expensesResult.error.message);
  if (pendingInvoicesResult.error) console.error("[dashboard] pending invoices query error:", pendingInvoicesResult.error.message);
  if (recentIncomeResult.error) console.error("[dashboard] recent income query error:", recentIncomeResult.error.message);
  if (recentExpensesResult.error) console.error("[dashboard] recent expenses query error:", recentExpensesResult.error.message);
  if (goalsResult.error) console.error("[dashboard] goals query error:", goalsResult.error.message);
  if (subscriptionsResult.error) console.error("[dashboard] subscriptions query error:", subscriptionsResult.error.message);

  const totalIncome = (incomeResult.data ?? []).reduce(
    (sum, row) =>
      sum +
      convertCurrency(Number(row.amount), row.currency ?? "USD", userCurrency),
    0
  );
  const totalExpenses = (expensesResult.data ?? []).reduce(
    (sum, row) =>
      sum +
      convertCurrency(Number(row.amount), row.currency ?? "USD", userCurrency),
    0
  );
  const pendingInvoices = pendingInvoicesResult.count ?? 0;

  // Monthly subscriptions cost
  const monthlySubs = (subscriptionsResult.data ?? []).reduce((sum, s) => {
    const amt = Number(s.amount);
    const monthly =
      s.billing_cycle === "yearly"
        ? amt / 12
        : s.billing_cycle === "weekly"
          ? amt * 4.33
          : amt;
    return (
      sum + convertCurrency(monthly, s.currency ?? "USD", userCurrency)
    );
  }, 0);

  // Net Profit = Income - Expenses - Monthly Subscriptions
  const totalCosts = totalExpenses + monthlySubs;
  const netProfit = totalIncome - totalCosts;

  // Active goals count
  const activeGoals = goalsResult.data ?? [];

  // Recent transactions
  const recentIncome = (recentIncomeResult.data ?? []).map((row) => ({
    date: row.date,
    description: row.description || row.client_name || t.incomeType,
    amount: Number(row.amount),
    currency: row.currency ?? "USD",
    type: "income" as const,
  }));
  const recentExpenses = (recentExpensesResult.data ?? []).map((row) => ({
    date: row.date,
    description:
      row.description || row.merchant || row.category || t.expenseType,
    amount: Number(row.amount),
    currency: row.currency ?? "USD",
    type: "expense" as const,
  }));
  const recentTransactions = [...recentIncome, ...recentExpenses]
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 6);

  const profitMargin =
    totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-10 safi-page-enter max-w-6xl">
      {/* ─── Hero: Net Profit ─── */}
      <section className="safi-card p-8 md:p-10 relative overflow-hidden">
        {/* Ambient gradient behind the number */}
        <div
          className="absolute -top-20 -end-20 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          <p className="text-[#64748b] text-sm mb-1">{greeting}{locale === "ar" ? "،" : ","} {displayName}</p>
          <p className="text-[#94a3b8] text-sm mb-6">{t.netProfitThisMonth}</p>

          {/* The big number */}
          <div className="flex items-end gap-4 mb-8">
            <h1
              className="text-5xl md:text-7xl font-bold tracking-tight text-[#e2e8f0]"
              style={{ fontFeatureSettings: "'tnum'" }}
            >
              {formatAmount(netProfit, userCurrency)}
            </h1>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full mb-2 ${
                netProfit >= 0
                  ? "bg-[#10b981]/10 text-[#10b981]"
                  : "bg-[#ef4444]/10 text-[#ef4444]"
              }`}
            >
              {netProfit >= 0 ? "+" : ""}
              {profitMargin}%
            </span>
          </div>

          {/* Mini metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <MiniMetric
              label={t.revenue}
              value={formatAmount(totalIncome, userCurrency)}
              icon={<TrendingUp className="size-4" />}
              color="#10b981"
            />
            <MiniMetric
              label={t.expensesAndSubscriptions}
              value={formatAmount(totalCosts, userCurrency)}
              icon={<TrendingDown className="size-4" />}
              color="#ef4444"
            />
            <MiniMetric
              label={t.pendingInvoices}
              value={String(pendingInvoices)}
              icon={<Clock className="size-4" />}
              color="#f59e0b"
            />
            <MiniMetric
              label={t.subscriptionsPerMonth}
              value={formatAmount(monthlySubs, userCurrency)}
              icon={<CreditCard className="size-4" />}
              color="#8b5cf6"
            />
          </div>
        </div>
      </section>

      {/* Currency disclaimer */}
      <p className="text-[10px] text-[#475569] -mt-6">
        {t.currencyDisclaimerFull}
      </p>

      {/* ─── Two-column layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Transactions — takes 3 cols */}
        <section className="lg:col-span-3 safi-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-[#e2e8f0]">
              {t.recentTransactions}
            </h2>
            <Link
              href="/dashboard/transactions"
              className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors font-medium"
            >
              {t.viewAll} {dir === "rtl" ? "←" : "→"}
            </Link>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-0.5">
              {recentTransactions.map((tx, i) => (
                <div
                  key={`${tx.type}-${tx.date}-${i}`}
                  className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-white/[0.025] transition-colors duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                        tx.type === "income"
                          ? "bg-[#10b981]/10"
                          : "bg-[#ef4444]/10"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <ArrowUpRight className="size-[18px] text-[#10b981]" />
                      ) : (
                        <ArrowDownRight className="size-[18px] text-[#ef4444]" />
                      )}
                    </div>
                    <div>
                      <p className="text-[#e2e8f0] text-sm font-medium">
                        {tx.description}
                      </p>
                      <p className="text-[#475569] text-xs mt-0.5">
                        {new Date(tx.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      tx.type === "income"
                        ? "text-[#10b981]"
                        : "text-[#ef4444]"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {convertAndFormat(tx.amount, tx.currency, userCurrency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="size-8 text-[#3b82f6]/30 mx-auto mb-3" />
              <p className="text-[#64748b] text-sm">
                {t.startAddFirstTransaction}
              </p>
              <Link
                href="/dashboard/transactions"
                className="inline-block mt-3 text-xs text-[#3b82f6] font-medium"
              >
                {t.addTransaction}
              </Link>
            </div>
          )}
        </section>

        {/* Right column — Goals + Quick Actions — takes 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Goals */}
          <section className="safi-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#e2e8f0]">
                {t.activeGoals}
              </h2>
              <Link
                href="/dashboard/goals"
                className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors font-medium"
              >
                {t.all} {dir === "rtl" ? "←" : "→"}
              </Link>
            </div>

            {activeGoals.length > 0 ? (
              <div className="space-y-4">
                {activeGoals.map((goal) => {
                  const pct = Math.min(
                    (Number(goal.current_amount) /
                      Number(goal.target_amount)) *
                      100,
                    100
                  );
                  const color =
                    pct >= 80
                      ? "#10b981"
                      : pct >= 50
                        ? "#f59e0b"
                        : "#3b82f6";
                  return (
                    <div key={goal.title}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#e2e8f0] font-medium">
                          {goal.title}
                        </span>
                        <span
                          className="text-xs font-semibold tabular-nums"
                          style={{ color }}
                        >
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Target className="size-6 text-[#3b82f6]/30 mx-auto mb-2" />
                <p className="text-[#64748b] text-xs">{t.noActiveGoals}</p>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="safi-card p-6">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">
              {t.quickActions}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: t.newTransaction,
                  href: "/dashboard/transactions",
                  icon: ArrowUpRight,
                },
                {
                  label: t.newInvoice,
                  href: "/dashboard/invoices",
                  icon: Clock,
                },
                {
                  label: t.newClient,
                  href: "/dashboard/clients",
                  icon: Target,
                },
                {
                  label: t.reports,
                  href: "/dashboard/reports",
                  icon: TrendingUp,
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[#94a3b8] text-xs font-medium hover:bg-white/[0.05] hover:text-[#e2e8f0] hover:border-white/[0.08] transition-all duration-300"
                >
                  <action.icon className="size-3.5" />
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Metric Component ─── */
function MiniMetric({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[#64748b] text-xs truncate">{label}</p>
        <p
          className="text-sm font-bold tabular-nums text-[#e2e8f0] truncate"
        >
          {value}
        </p>
      </div>
    </div>
  );
}
