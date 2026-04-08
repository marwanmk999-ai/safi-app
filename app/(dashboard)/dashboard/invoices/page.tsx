import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InvoicesList } from "./invoices-list"
import type { Invoice, Client } from "@/lib/types/database"
import { formatAmount, convertCurrency } from "@/lib/format"
import { getServerTranslations } from "@/lib/i18n/server"

export default async function InvoicesPage() {
  const { t, locale, dir } = await getServerTranslations()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("currency").eq("id", user.id).single();
  if (profileError) console.error("[invoices] profile query error:", profileError.message);
  const userCurrency = profile?.currency ?? "USD";

  // Fetch invoices with client data joined
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices_decrypted")
    .select("*, client:clients_decrypted(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (invoicesError) console.error("[invoices] invoices query error:", invoicesError.message);

  // Fetch clients for the create dialog
  const { data: clients, error: clientsError } = await supabase
    .from("clients_decrypted")
    .select("*")
    .eq("user_id", user.id)
    .order("name")

  if (clientsError) console.error("[invoices] clients query error:", clientsError.message);

  const typedInvoices = (invoices ?? []) as (Invoice & { client: Client | null })[]
  const typedClients = (clients ?? []) as Client[]

  // Calculate summary
  const totalInvoiced = typedInvoices.reduce((sum, inv) => sum + convertCurrency(Number(inv.amount), inv.currency ?? "USD", userCurrency), 0)
  const totalPaid = typedInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + convertCurrency(Number(inv.amount), inv.currency ?? "USD", userCurrency), 0)
  const totalPending = typedInvoices
    .filter((inv) => inv.status === "pending" || inv.status === "overdue")
    .reduce((sum, inv) => sum + convertCurrency(Number(inv.amount), inv.currency ?? "USD", userCurrency), 0)

  return (
    <div className="space-y-8" dir={dir}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#e2e8f0]">{t.invoices}</h2>
        <p className="text-[#94a3b8] mt-1">{t.manageInvoices}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 backdrop-blur-sm">
          <span className="text-[#94a3b8] text-sm">{t.totalInvoiced}</span>
          <p className="text-2xl font-bold text-[#3b82f6] mt-2">
            {formatAmount(totalInvoiced, userCurrency)}
          </p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 backdrop-blur-sm">
          <span className="text-[#94a3b8] text-sm">{t.paidLabel}</span>
          <p className="text-2xl font-bold text-[#10b981] mt-2">
            {formatAmount(totalPaid, userCurrency)}
          </p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 backdrop-blur-sm">
          <span className="text-[#94a3b8] text-sm">{t.pendingAndOverdue}</span>
          <p className="text-2xl font-bold text-[#f59e0b] mt-2">
            {formatAmount(totalPending, userCurrency)}
          </p>
        </div>
      </div>

      {/* Invoice List */}
      <InvoicesList invoices={typedInvoices} clients={typedClients} userCurrency={userCurrency} locale={locale as "ar" | "en"} />
    </div>
  )
}
