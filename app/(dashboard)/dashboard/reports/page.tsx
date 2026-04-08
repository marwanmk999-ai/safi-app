import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { convertCurrency } from "@/lib/format";
import ReportsView from "./reports-view";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect("/login"); }
  const userId = user.id;

  const { data: profile, error: profileError } = await supabase.from("profiles").select("currency").eq("id", userId).single();
  if (profileError) console.error("[reports] profile query error:", profileError.message);
  const userCurrency = profile?.currency ?? "USD";

  // Calculate date 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

  // Fetch all report data in parallel
  const [
    incomeResult,
    expensesResult,
    invoicesResult,
  ] = await Promise.all([
    supabase
      .from("income_decrypted")
      .select("amount, currency, date, client_name")
      .eq("user_id", userId)
      .gte("date", sixMonthsAgoStr)
      .order("date", { ascending: true }),
    supabase
      .from("expenses_decrypted")
      .select("amount, currency, date, category")
      .eq("user_id", userId)
      .gte("date", sixMonthsAgoStr)
      .order("date", { ascending: true }),
    supabase
      .from("invoices_decrypted")
      .select("amount, currency, status")
      .eq("user_id", userId),
  ]);

  if (incomeResult.error) console.error("[reports] income query error:", incomeResult.error.message);
  if (expensesResult.error) console.error("[reports] expenses query error:", expensesResult.error.message);
  if (invoicesResult.error) console.error("[reports] invoices query error:", invoicesResult.error.message);

  const incomeRows = incomeResult.data ?? [];
  const expenseRows = expensesResult.data ?? [];
  const invoiceRows = invoicesResult.data ?? [];

  // Monthly income totals (last 6 months)
  const monthlyIncome: Record<string, number> = {};
  const monthlyExpenses: Record<string, number> = {};

  for (const row of incomeRows) {
    const key = row.date.slice(0, 7); // "YYYY-MM"
    monthlyIncome[key] = (monthlyIncome[key] ?? 0) + convertCurrency(Number(row.amount), row.currency ?? "USD", userCurrency);
  }

  for (const row of expenseRows) {
    const key = row.date.slice(0, 7);
    monthlyExpenses[key] = (monthlyExpenses[key] ?? 0) + convertCurrency(Number(row.amount), row.currency ?? "USD", userCurrency);
  }

  // Build sorted list of last 6 months
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  const monthlyData = months.map((m) => ({
    month: m,
    income: monthlyIncome[m] ?? 0,
    expenses: monthlyExpenses[m] ?? 0,
  }));

  // Top expense categories
  const categoryTotals: Record<string, number> = {};
  for (const row of expenseRows) {
    const cat = row.category || "other";
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + convertCurrency(Number(row.amount), row.currency ?? "USD", userCurrency);
  }
  const totalExpenseAmount = Object.values(categoryTotals).reduce(
    (a, b) => a + b,
    0
  );
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0,
    }));

  // Top clients by revenue
  const clientTotals: Record<string, number> = {};
  for (const row of incomeRows) {
    const client = row.client_name || "—";
    clientTotals[client] = (clientTotals[client] ?? 0) + convertCurrency(Number(row.amount), row.currency ?? "USD", userCurrency);
  }
  const topClients = Object.entries(clientTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  // Income grouped by currency
  const currencyMap: Record<string, { count: number; originalTotal: number; convertedTotal: number }> = {};
  for (const row of incomeRows) {
    const cur = row.currency ?? "USD";
    if (!currencyMap[cur]) {
      currencyMap[cur] = { count: 0, originalTotal: 0, convertedTotal: 0 };
    }
    currencyMap[cur].count += 1;
    currencyMap[cur].originalTotal += Number(row.amount);
    currencyMap[cur].convertedTotal += convertCurrency(Number(row.amount), cur, userCurrency);
  }
  const currencyBreakdown = Object.entries(currencyMap)
    .sort((a, b) => b[1].convertedTotal - a[1].convertedTotal)
    .map(([currency, data]) => ({
      currency,
      count: data.count,
      originalTotal: data.originalTotal,
      convertedTotal: data.convertedTotal,
    }));

  // Invoice status breakdown
  const invoiceSummary: Record<string, { count: number; total: number }> = {
    paid: { count: 0, total: 0 },
    pending: { count: 0, total: 0 },
    overdue: { count: 0, total: 0 },
    draft: { count: 0, total: 0 },
  };
  for (const row of invoiceRows) {
    const status = row.status as string;
    if (invoiceSummary[status]) {
      invoiceSummary[status].count += 1;
      invoiceSummary[status].total += convertCurrency(Number(row.amount), row.currency ?? "USD", userCurrency);
    }
  }

  return (
    <ReportsView
      monthlyData={monthlyData}
      topCategories={topCategories}
      topClients={topClients}
      invoiceSummary={invoiceSummary}
      currencyBreakdown={currencyBreakdown}
      currency={userCurrency}
    />
  );
}
